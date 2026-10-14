import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Load dataset
DATA_FILE = "ml/data/metrics_dataset.csv"

df = pd.read_csv(DATA_FILE)

# Features used for anomaly detection
features = [
    "request_rate",
    "error_rate",
    "latency",
    "memory",
    "cpu"
]

X = df[features].copy()

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Isolation Forest
model = IsolationForest(
    contamination=0.05,
    random_state=42
)

# Predict
df["anomaly"] = model.fit_predict(X_scaled)

# Convert:
#  1  = normal
# -1  = anomaly
df["anomaly_label"] = df["anomaly"].map({
    1: "Normal",
    -1: "Anomaly"
})

# Save results
OUTPUT_FILE = "ml/data/anomaly_results.csv"
df.to_csv(OUTPUT_FILE, index=False)

# Results
print("\n===== ANOMALY DETECTION RESULTS =====")

print("\nTotal records:", len(df))

print("\nNormal records:")
print((df["anomaly"] == 1).sum())

print("\nAnomalous records:")
print((df["anomaly"] == -1).sum())

print("\nAnomaly percentage:")
print(round((df["anomaly"] == -1).mean() * 100, 2), "%")

print("\nTop anomalies:")
print(
    df[df["anomaly"] == -1]
    .sort_values("cpu", ascending=False)
    [
        [
            "timestamp",
            "service",
            "request_rate",
            "error_rate",
            "latency",
            "memory",
            "cpu",
            "anomaly_label"
        ]
    ]
    .head(20)
    .to_string(index=False)
)

print("\nResults saved to:")
print(OUTPUT_FILE)