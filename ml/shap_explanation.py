import os
import joblib
import pandas as pd
import shap


# ============================================================
# FILE PATHS
# ============================================================

DATA_FILE = "ml/data/metrics_dataset.csv"

MODEL_FILE = "ml/models/isolation_forest.joblib"

SCALER_FILE = "ml/models/scaler.joblib"

ANOMALY_RESULTS_FILE = (
    "ml/data/anomaly_evaluation_results.csv"
)

SHAP_RESULTS_FILE = (
    "ml/data/shap_explanation.csv"
)

SHAP_IMPORTANCE_FILE = (
    "ml/data/shap_feature_importance.csv"
)


# ============================================================
# FEATURES
# ============================================================

FEATURES = [
    "request_rate",
    "error_rate",
    "latency",
    "memory",
    "cpu"
]


# ============================================================
# LOAD DATA
# ============================================================

print("Loading metrics dataset...")

if not os.path.exists(DATA_FILE):
    raise FileNotFoundError(
        f"Metrics dataset not found: {DATA_FILE}"
    )

df = pd.read_csv(DATA_FILE)

df["timestamp"] = pd.to_datetime(
    df["timestamp"]
)

print(
    "Dataset records:",
    len(df)
)


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

print("\nLoading trained Isolation Forest...")

if not os.path.exists(MODEL_FILE):
    raise FileNotFoundError(
        f"Trained model not found: {MODEL_FILE}"
    )

model = joblib.load(
    MODEL_FILE
)

print(
    "Model loaded successfully."
)


# ============================================================
# LOAD TRAINED SCALER
# ============================================================

print("\nLoading trained scaler...")

if not os.path.exists(SCALER_FILE):
    raise FileNotFoundError(
        f"Scaler not found: {SCALER_FILE}"
    )

scaler = joblib.load(
    SCALER_FILE
)

print(
    "Scaler loaded successfully."
)


# ============================================================
# PREPARE FEATURES
# ============================================================

X = df[FEATURES].copy()

X_scaled = scaler.transform(
    X
)


# ============================================================
# LOAD ANOMALY RESULTS
# ============================================================

print(
    "\nLoading anomaly evaluation results..."
)

if not os.path.exists(ANOMALY_RESULTS_FILE):
    raise FileNotFoundError(
        f"Anomaly results not found: "
        f"{ANOMALY_RESULTS_FILE}"
    )

anomaly_results = pd.read_csv(
    ANOMALY_RESULTS_FILE
)

anomaly_results["timestamp"] = (
    pd.to_datetime(
        anomaly_results["timestamp"]
    )
)

print(
    "Evaluation records:",
    len(anomaly_results)
)


# ============================================================
# SELECT MEANINGFUL ANOMALIES
# ============================================================

anomalies = anomaly_results[
    anomaly_results["baseline_label"] == "Anomaly"
].copy()


# Remove meaningless observations.
#
# A meaningful operational incident requires:
#
# request_rate > 0
# latency > 0
# AND
# CPU > 2 OR error_rate > 0

meaningful = (
    (anomalies["request_rate"] > 0) &
    (anomalies["latency"] > 0) &
    (
        (anomalies["cpu"] > 2) |
        (anomalies["error_rate"] > 0)
    )
)

anomalies = anomalies[
    meaningful
].copy()


print(
    "\nMeaningful anomalies:",
    len(anomalies)
)


if anomalies.empty:

    raise RuntimeError(
        "No meaningful anomalies available "
        "for SHAP explanation."
    )


# ============================================================
# INCIDENT SEVERITY
# ============================================================

cpu_severity = (
    anomalies["cpu"] / 10
).clip(
    lower=0,
    upper=10
)

error_severity = (
    anomalies["error_rate"] * 100
).clip(
    lower=0,
    upper=10
)

latency_severity = (
    anomalies["latency"] * 10
).clip(
    lower=0,
    upper=10
)

anomaly_severity = (
    -anomalies["anomaly_score"] * 10
).clip(
    lower=0,
    upper=10
)

anomalies["incident_severity"] = (
    (cpu_severity * 0.45) +
    (error_severity * 0.30) +
    (latency_severity * 0.10) +
    (anomaly_severity * 0.15)
)


# ============================================================
# SELECT SAME INCIDENT AS INCIDENT AGENT
# ============================================================

latest_timestamp = (
    anomalies["timestamp"].max()
)

recent_window = anomalies[
    anomalies["timestamp"] >=
    latest_timestamp -
    pd.Timedelta(minutes=5)
].copy()


if recent_window.empty:

    recent_window = anomalies.copy()


selected_incident = recent_window.loc[
    recent_window[
        "incident_severity"
    ].idxmax()
]


# ============================================================
# PRINT SELECTED INCIDENT
# ============================================================

print(
    "\n===== INCIDENT SELECTED FOR SHAP ====="
)

print(
    "Timestamp:",
    selected_incident["timestamp"]
)

print(
    "Service:",
    selected_incident["service"]
)

print(
    "CPU:",
    selected_incident["cpu"]
)

print(
    "Error Rate:",
    selected_incident["error_rate"]
)

print(
    "Latency:",
    selected_incident["latency"]
)

print(
    "Request Rate:",
    selected_incident["request_rate"]
)

print(
    "Anomaly Score:",
    selected_incident["anomaly_score"]
)

print(
    "Incident Severity:",
    selected_incident[
        "incident_severity"
    ]
)


# ============================================================
# FIND EXACT ROW IN ORIGINAL DATASET
# ============================================================

selected_timestamp = pd.to_datetime(
    selected_incident["timestamp"]
)

selected_service = (
    selected_incident["service"]
)


matching_rows = df[
    (df["timestamp"] == selected_timestamp) &
    (df["service"] == selected_service)
]


if matching_rows.empty:

    raise RuntimeError(
        "Could not find the selected incident "
        "in the original metrics dataset."
    )


# Use the first exact matching observation.
selected_index = matching_rows.index[0]

selected_position = (
    df.index.get_loc(
        selected_index
    )
)


# ============================================================
# CREATE SHAP EXPLAINER
# ============================================================

print(
    "\nCreating SHAP TreeExplainer..."
)

explainer = shap.TreeExplainer(
    model
)


# ============================================================
# CALCULATE SHAP VALUES
# ============================================================

print(
    "Calculating SHAP values..."
)

shap_values = (
    explainer.shap_values(
        X_scaled
    )
)


# ============================================================
# HANDLE SHAP OUTPUT FORMAT
# ============================================================

# Depending on the SHAP version/model configuration,
# shap_values may be returned as a NumPy array.

if hasattr(
    shap_values,
    "values"
):

    shap_values = (
        shap_values.values
    )


# ============================================================
# EXTRACT SHAP FOR SELECTED INCIDENT
# ============================================================

selected_shap = shap_values[
    selected_position
]


# ============================================================
# CREATE EXPLANATION TABLE
# ============================================================

explanation = pd.DataFrame({

    "feature": FEATURES,

    "shap_value": selected_shap,

    "absolute_contribution":
        abs(selected_shap)

})


explanation = explanation.sort_values(
    "absolute_contribution",
    ascending=False
).reset_index(
    drop=True
)


# ============================================================
# DOMINANT FEATURE
# ============================================================

dominant_feature = (
    explanation.iloc[0]["feature"]
)


# ============================================================
# PRINT EXPLANATION
# ============================================================

print(
    "\n===== SHAP EXPLANATION ====="
)

print(
    explanation.to_string(
        index=False
    )
)

print(
    "\nDominant Feature:",
    dominant_feature
)


# ============================================================
# GLOBAL SHAP FEATURE IMPORTANCE
# ============================================================

mean_abs_shap = abs(
    shap_values
).mean(
    axis=0
)


feature_importance = pd.DataFrame({

    "feature": FEATURES,

    "mean_abs_shap":
        mean_abs_shap

})


feature_importance = (
    feature_importance
    .sort_values(
        "mean_abs_shap",
        ascending=False
    )
    .reset_index(
        drop=True
    )
)


print(
    "\n===== GLOBAL SHAP FEATURE IMPORTANCE ====="
)

print(
    feature_importance.to_string(
        index=False
    )
)


# ============================================================
# SAVE SELECTED INCIDENT SHAP
# ============================================================

explanation.to_csv(
    SHAP_RESULTS_FILE,
    index=False
)


# ============================================================
# SAVE GLOBAL FEATURE IMPORTANCE
# ============================================================

feature_importance.to_csv(
    SHAP_IMPORTANCE_FILE,
    index=False
)


# ============================================================
# FINAL OUTPUT
# ============================================================

print(
    "\nSHAP explanation saved to:"
)

print(
    SHAP_RESULTS_FILE
)

print(
    "\nGlobal SHAP feature importance saved to:"
)

print(
    SHAP_IMPORTANCE_FILE
)

print(
    "\n===== SHAP ANALYSIS COMPLETE ====="
)