import os
import joblib
import pandas as pd

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


# ============================================================
# Configuration
# ============================================================

TRAIN_FILE = "ml/data/normal_train.csv"

MODEL_DIR = "ml/models"

MODEL_FILE = os.path.join(
    MODEL_DIR,
    "isolation_forest.joblib"
)

SCALER_FILE = os.path.join(
    MODEL_DIR,
    "scaler.joblib"
)

FEATURES = [
    "request_rate",
    "error_rate",
    "latency",
    "memory",
    "cpu"
]


# ============================================================
# Load training data
# ============================================================

print("Loading normal training data...")

df = pd.read_csv(TRAIN_FILE)

print("Training records:", len(df))


# ============================================================
# Prepare features
# ============================================================

X = df[FEATURES].copy()

print("\nFeatures used for training:")

for feature in FEATURES:
    print(f"- {feature}")


# ============================================================
# Scale features
# ============================================================

scaler = StandardScaler()

X_scaled = scaler.fit_transform(X)


# ============================================================
# Train Isolation Forest
# ============================================================

print("\nTraining Isolation Forest...")

model = IsolationForest(
    n_estimators=200,
    contamination="auto",
    random_state=42,
    n_jobs=-1
)

model.fit(X_scaled)


# ============================================================
# Save model and scaler
# ============================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)

joblib.dump(
    model,
    MODEL_FILE
)

joblib.dump(
    scaler,
    SCALER_FILE
)


# ============================================================
# Training summary
# ============================================================

print("\n===== MODEL TRAINING COMPLETE =====")

print("Training records:", len(df))

print("Number of trees:", model.n_estimators)

print("Contamination:", model.contamination)

print("\nModel saved to:")
print(MODEL_FILE)

print("\nScaler saved to:")
print(SCALER_FILE)