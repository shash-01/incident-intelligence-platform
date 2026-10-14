import os
import joblib
import pandas as pd

from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    precision_score,
    recall_score,
    f1_score
)


# ============================================================
# Configuration
# ============================================================

EVALUATION_FILE = "ml/data/evaluation_data.csv"

TRAIN_FILE = "ml/data/normal_train.csv"

MODEL_FILE = "ml/models/isolation_forest.joblib"

SCALER_FILE = "ml/models/scaler.joblib"

OUTPUT_FILE = "ml/data/anomaly_evaluation_results.csv"

FEATURES = [
    "request_rate",
    "error_rate",
    "latency",
    "memory",
    "cpu"
]


# ============================================================
# Load model and scaler
# ============================================================

print("Loading trained model...")

model = joblib.load(MODEL_FILE)

print("Loading trained scaler...")

scaler = joblib.load(SCALER_FILE)


# ============================================================
# Load evaluation data
# ============================================================

print("\nLoading evaluation data...")

df = pd.read_csv(EVALUATION_FILE)

print("Evaluation records:", len(df))


# ============================================================
# Prepare evaluation features
# ============================================================

X = df[FEATURES].copy()

X_scaled = scaler.transform(X)


# ============================================================
# Calculate continuous anomaly scores
# ============================================================

print("\nRunning anomaly detection...")

# Lower scores indicate more anomalous observations
df["anomaly_score"] = model.decision_function(X_scaled)


# ============================================================
# Original Isolation Forest prediction
# ============================================================

predictions = model.predict(X_scaled)

df["prediction"] = predictions

# Isolation Forest:
#  1  = Normal
# -1  = Anomaly

df["predicted_label"] = df["prediction"].map({
    1: "Normal",
    -1: "Anomaly"
})


# ============================================================
# Create ground-truth labels
# ============================================================

df["actual_label"] = df["known_fault"].map({
    False: "Normal",
    True: "Anomaly"
})


# ============================================================
# Convert labels for original model metrics
# ============================================================

y_true = df["known_fault"].astype(int)

y_pred = (
    df["prediction"] == -1
).astype(int)


# ============================================================
# Original Isolation Forest Evaluation
# ============================================================

cm = confusion_matrix(
    y_true,
    y_pred
)

tn, fp, fn, tp = cm.ravel()


precision = precision_score(
    y_true,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_true,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_true,
    y_pred,
    zero_division=0
)


fault_detection_rate = (
    tp / (tp + fn)
    if (tp + fn) > 0
    else 0
)


# ============================================================
# Original Isolation Forest Results
# ============================================================

print("\n========================================")
print("   ORIGINAL ISOLATION FOREST EVALUATION")
print("========================================")

print("\nTotal evaluation records:", len(df))

print(
    "Actual normal records:",
    (y_true == 0).sum()
)

print(
    "Actual fault records:",
    (y_true == 1).sum()
)

print(
    "\nPredicted normal:",
    (y_pred == 0).sum()
)

print(
    "Predicted anomalies:",
    (y_pred == 1).sum()
)


print("\n===== CONFUSION MATRIX =====")

print("True Negatives :", tn)
print("False Positives:", fp)
print("False Negatives:", fn)
print("True Positives  :", tp)


print("\n===== PERFORMANCE =====")

print(
    "Precision:",
    round(precision, 4)
)

print(
    "Recall:",
    round(recall, 4)
)

print(
    "F1 Score:",
    round(f1, 4)
)

print(
    "\nFault Detection Rate:",
    round(
        fault_detection_rate * 100,
        2
    ),
    "%"
)


print("\n===== CLASSIFICATION REPORT =====")

print(
    classification_report(
        y_true,
        y_pred,
        target_names=[
            "Normal",
            "Anomaly"
        ],
        zero_division=0
    )
)


# ============================================================
# Baseline-Derived Anomaly Threshold
# ============================================================

print("\n========================================")
print("   BASELINE THRESHOLD CALCULATION")
print("========================================")

print("\nLoading normal training data...")

train_df = pd.read_csv(TRAIN_FILE)

print(
    "Normal training records:",
    len(train_df)
)


# Training features
train_X = train_df[FEATURES].copy()


# Apply the SAME scaler used by the trained model
train_X_scaled = scaler.transform(train_X)


# Calculate anomaly scores for normal training data
train_scores = model.decision_function(
    train_X_scaled
)


# Use only normal training data to determine
# the anomaly threshold.
#
# 5th percentile means approximately the lowest
# 5% of normal training scores are treated as
# unusually low.
baseline_threshold = pd.Series(
    train_scores
).quantile(0.05)


print(
    "\n5th percentile baseline threshold:",
    round(
        baseline_threshold,
        6
    )
)


# ============================================================
# Apply Baseline Threshold
# ============================================================

# Lower anomaly score = more anomalous
#
# If score is below the threshold,
# classify it as an anomaly.

df["baseline_prediction"] = (
    df["anomaly_score"] < baseline_threshold
)

df["baseline_label"] = df[
    "baseline_prediction"
].map({
    True: "Anomaly",
    False: "Normal"
})


# ============================================================
# Baseline Threshold Evaluation
# ============================================================

y_pred_baseline = (
    df["baseline_prediction"]
).astype(int)


baseline_cm = confusion_matrix(
    y_true,
    y_pred_baseline
)

baseline_tn, baseline_fp, baseline_fn, baseline_tp = (
    baseline_cm.ravel()
)


baseline_precision = precision_score(
    y_true,
    y_pred_baseline,
    zero_division=0
)

baseline_recall = recall_score(
    y_true,
    y_pred_baseline,
    zero_division=0
)

baseline_f1 = f1_score(
    y_true,
    y_pred_baseline,
    zero_division=0
)


baseline_fault_detection_rate = (
    baseline_tp /
    (baseline_tp + baseline_fn)
    if (baseline_tp + baseline_fn) > 0
    else 0
)


# ============================================================
# Baseline Results
# ============================================================

print("\n========================================")
print("    BASELINE THRESHOLD EVALUATION")
print("========================================")

print(
    "\nThreshold:",
    round(
        baseline_threshold,
        6
    )
)

print(
    "\nPredicted normal:",
    (y_pred_baseline == 0).sum()
)

print(
    "Predicted anomalies:",
    (y_pred_baseline == 1).sum()
)


print("\n===== CONFUSION MATRIX =====")

print(
    "True Negatives :",
    baseline_tn
)

print(
    "False Positives:",
    baseline_fp
)

print(
    "False Negatives:",
    baseline_fn
)

print(
    "True Positives  :",
    baseline_tp
)


print("\n===== PERFORMANCE =====")

print(
    "Precision:",
    round(
        baseline_precision,
        4
    )
)

print(
    "Recall:",
    round(
        baseline_recall,
        4
    )
)

print(
    "F1 Score:",
    round(
        baseline_f1,
        4
    )
)

print(
    "\nFault Detection Rate:",
    round(
        baseline_fault_detection_rate * 100,
        2
    ),
    "%"
)


print(
    "\n===== BASELINE CLASSIFICATION REPORT ====="
)

print(
    classification_report(
        y_true,
        y_pred_baseline,
        target_names=[
            "Normal",
            "Anomaly"
        ],
        zero_division=0
    )
)


# ============================================================
# Compare Original Model vs Baseline Threshold
# ============================================================

print("\n========================================")
print("       METHOD COMPARISON")
print("========================================")

comparison = pd.DataFrame({
    "Method": [
        "Isolation Forest predict()",
        "Baseline score threshold"
    ],
    "Precision": [
        precision,
        baseline_precision
    ],
    "Recall": [
        recall,
        baseline_recall
    ],
    "F1 Score": [
        f1,
        baseline_f1
    ],
    "Fault Detection Rate": [
        fault_detection_rate,
        baseline_fault_detection_rate
    ]
})

print(
    comparison.to_string(
        index=False
    )
)


# ============================================================
# Show Known Faults
# ============================================================

print("\n========================================")
print("          KNOWN FAULT ANALYSIS")
print("========================================")

print("\n===== FAULT ANOMALY SCORES =====")

print(
    df[
        df["known_fault"] == True
    ][
        [
            "timestamp",
            "service",
            "cpu",
            "error_rate",
            "anomaly_score",
            "predicted_label",
            "baseline_label"
        ]
    ].to_string(
        index=False
    )
)


# ============================================================
# Most Anomalous Records
# ============================================================

print(
    "\n===== MOST ANOMALOUS EVALUATION RECORDS ====="
)

print(
    df.sort_values(
        "anomaly_score"
    )[
        [
            "timestamp",
            "service",
            "cpu",
            "error_rate",
            "latency",
            "anomaly_score",
            "predicted_label",
            "baseline_label",
            "known_fault"
        ]
    ]
    .head(20)
    .to_string(
        index=False
    )
)


# ============================================================
# Save Evaluation Results
# ============================================================

os.makedirs(
    "ml/data",
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print(
    "\nEvaluation results saved to:"
)

print(OUTPUT_FILE)