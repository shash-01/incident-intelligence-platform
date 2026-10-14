import pandas as pd
import os

DATA_FILE = "ml/data/metrics_dataset.csv"

TRAIN_FILE = "ml/data/normal_train.csv"
EVAL_FILE = "ml/data/evaluation_data.csv"

FEATURES = [
    "request_rate",
    "error_rate",
    "latency",
    "memory",
    "cpu"
]


def load_data():
    df = pd.read_csv(DATA_FILE)

    print("Loaded dataset:", df.shape)

    # Convert timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Check required columns
    required_columns = ["timestamp", "service"] + FEATURES

    missing_columns = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing columns: {missing_columns}"
        )

    # Remove rows with missing feature values
    df = df.dropna(
        subset=FEATURES
    ).copy()

    return df


def identify_known_faults(df):
    """
    Identify faults that were intentionally injected
    during our experiment.

    CPU fault:
        cpu > 2

    Error fault:
        error_rate > 0
    """

    df["known_fault"] = (
        (df["cpu"] > 2) |
        (df["error_rate"] > 0)
    )

    return df


def create_datasets(df):

    normal_data = df[
        df["known_fault"] == False
    ].copy()

    fault_data = df[
        df["known_fault"] == True
    ].copy()

    print("\n===== DATASET SUMMARY =====")

    print("Total records:", len(df))
    print("Normal records:", len(normal_data))
    print("Known fault records:", len(fault_data))

    print("\nFault records by service:")
    print(
        fault_data["service"]
        .value_counts()
    )

    print("\nFault records:")
    print(
        fault_data[
            [
                "timestamp",
                "service",
                "cpu",
                "error_rate",
                "known_fault"
            ]
        ]
        .to_string(index=False)
    )

    # Sort normal data chronologically
    normal_data = normal_data.sort_values(
        "timestamp"
    ).reset_index(drop=True)

    # 80% normal data for training
    split_index = int(
        len(normal_data) * 0.80
    )

    train_data = normal_data.iloc[
        :split_index
    ].copy()

    normal_test_data = normal_data.iloc[
        split_index:
    ].copy()

    # Evaluation set = unseen normal data + known faults
    evaluation_data = pd.concat(
        [
            normal_test_data,
            fault_data
        ],
        ignore_index=True
    )

    evaluation_data = evaluation_data.sort_values(
        "timestamp"
    ).reset_index(drop=True)

    # Create directories
    os.makedirs(
        "ml/data",
        exist_ok=True
    )

    # Save datasets
    train_data.to_csv(
        TRAIN_FILE,
        index=False
    )

    evaluation_data.to_csv(
        EVAL_FILE,
        index=False
    )

    print("\n===== SPLIT RESULTS =====")

    print(
        "Training records:",
        len(train_data)
    )

    print(
        "Normal evaluation records:",
        len(normal_test_data)
    )

    print(
        "Fault evaluation records:",
        len(fault_data)
    )

    print(
        "Total evaluation records:",
        len(evaluation_data)
    )

    print("\nSaved:")
    print(TRAIN_FILE)
    print(EVAL_FILE)


if __name__ == "__main__":

    df = load_data()

    df = identify_known_faults(df)

    create_datasets(df)