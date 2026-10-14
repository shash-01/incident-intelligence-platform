import pandas as pd
import os


ANOMALY_RESULTS_FILE = "ml/data/anomaly_evaluation_results.csv"
SHAP_RESULTS_FILE = "ml/data/shap_explanation.csv"


FEATURES = [
    "request_rate",
    "error_rate",
    "latency",
    "memory",
    "cpu"
]


class IncidentAgent:

    def __init__(
        self,
        anomaly_results_file=ANOMALY_RESULTS_FILE,
        shap_results_file=SHAP_RESULTS_FILE
    ):
        self.anomaly_results_file = anomaly_results_file
        self.shap_results_file = shap_results_file

        self.anomaly_data = None
        self.shap_data = None

    # =========================================================
    # LOAD DATA
    # =========================================================

    def load_anomaly_results(self):

        if not os.path.exists(self.anomaly_results_file):
            raise FileNotFoundError(
                f"Anomaly results not found: "
                f"{self.anomaly_results_file}"
            )

        self.anomaly_data = pd.read_csv(
            self.anomaly_results_file
        )

        self.anomaly_data["timestamp"] = pd.to_datetime(
            self.anomaly_data["timestamp"]
        )

        return self.anomaly_data

    def load_shap_results(self):

        if not os.path.exists(self.shap_results_file):
            raise FileNotFoundError(
                f"SHAP results not found: "
                f"{self.shap_results_file}"
            )

        self.shap_data = pd.read_csv(
            self.shap_results_file
        )

        return self.shap_data

    # =========================================================
    # GET BASELINE ANOMALIES
    # =========================================================

    def get_anomalies(self):

        if self.anomaly_data is None:
            self.load_anomaly_results()

        anomalies = self.anomaly_data[
            self.anomaly_data["baseline_label"] == "Anomaly"
        ].copy()

        return anomalies

    # =========================================================
    # FILTER MEANINGFUL ANOMALIES
    # =========================================================

    def filter_meaningful_anomalies(self, anomalies):

        anomalies = anomalies.copy()

        # We only consider an observation meaningful when
        # there is actual application activity.
        #
        # request_rate > 0
        # latency > 0
        #
        # AND at least one important fault indicator exists:
        #
        # CPU > 2
        # OR error_rate > 0

        meaningful = (
            (anomalies["request_rate"] > 0) &
            (anomalies["latency"] > 0) &
            (
                (anomalies["cpu"] > 2) |
                (anomalies["error_rate"] > 0)
            )
        )

        return anomalies[meaningful].copy()

    # =========================================================
    # CALCULATE INCIDENT SEVERITY
    # =========================================================

    def calculate_incident_severity(self, anomalies):

        anomalies = anomalies.copy()

        # -----------------------------------------------------
        # CPU SEVERITY
        # -----------------------------------------------------
        #
        # CPU > 2 is considered a known operational fault
        # according to the current project definition.
        #
        # Higher CPU produces a higher severity score.

        cpu_severity = (
            anomalies["cpu"] / 10
        ).clip(lower=0, upper=10)

        # -----------------------------------------------------
        # ERROR SEVERITY
        # -----------------------------------------------------
        #
        # Error rate is normally very small in this dataset,
        # so scale it strongly.

        error_severity = (
            anomalies["error_rate"] * 100
        ).clip(lower=0, upper=10)

        # -----------------------------------------------------
        # LATENCY SEVERITY
        # -----------------------------------------------------

        latency_severity = (
            anomalies["latency"] * 10
        ).clip(lower=0, upper=10)

        # -----------------------------------------------------
        # ANOMALY SCORE SEVERITY
        # -----------------------------------------------------
        #
        # Lower Isolation Forest score = more anomalous.
        #
        # Convert the score into a positive severity value.

        anomaly_severity = (
            -anomalies["anomaly_score"] * 10
        ).clip(lower=0, upper=10)

        # -----------------------------------------------------
        # FINAL INCIDENT SEVERITY
        # -----------------------------------------------------

        anomalies["incident_severity"] = (
            (cpu_severity * 0.45) +
            (error_severity * 0.30) +
            (latency_severity * 0.10) +
            (anomaly_severity * 0.15)
        )

        return anomalies

    # =========================================================
    # GET STRONGEST INCIDENT
    # =========================================================

    def get_strongest_anomaly(self):

        anomalies = self.get_anomalies()

        if anomalies.empty:
            return None

        # Remove meaningless observations.
        anomalies = self.filter_meaningful_anomalies(
            anomalies
        )

        if anomalies.empty:
            return None

        # Calculate operational severity.
        anomalies = self.calculate_incident_severity(
            anomalies
        )

        # -----------------------------------------------------
        # PRIORITIZE RECENT OPERATIONAL INCIDENTS
        # -----------------------------------------------------
        #
        # The current dataset contains historical incidents
        # from September and a fresh incident from October.
        #
        # We want the latest meaningful incident window,
        # but we don't want a random weak anomaly from the
        # latest timestamp to win.
        #
        # Therefore:
        # 1. Find the latest meaningful timestamp.
        # 2. Consider observations within the last 5 minutes.
        # 3. Select the highest operational severity.

        latest_timestamp = anomalies["timestamp"].max()

        recent_window = anomalies[
            anomalies["timestamp"] >=
            latest_timestamp - pd.Timedelta(minutes=5)
        ].copy()

        if recent_window.empty:
            recent_window = anomalies.copy()

        # Select the most operationally severe incident.
        strongest = recent_window.loc[
            recent_window["incident_severity"].idxmax()
        ]

        return strongest

    # =========================================================
    # SHAP EXPLANATION
    # =========================================================

    def get_shap_explanation(self):

        if self.shap_data is None:
            self.load_shap_results()

        explanation = {}

        for _, row in self.shap_data.iterrows():

            feature = row["feature"]

            shap_value = float(
                row["shap_value"]
            )

            explanation[feature] = shap_value

        return explanation

    # =========================================================
    # DOMINANT FEATURE
    # =========================================================

    def get_dominant_feature(
        self,
        shap_explanation
    ):

        if not shap_explanation:
            return None

        dominant_feature = max(
            shap_explanation,
            key=lambda feature:
                abs(shap_explanation[feature])
        )

        return dominant_feature

    # =========================================================
    # CREATE INCIDENT CONTEXT
    # =========================================================

    def create_incident_context(
        self,
        anomaly,
        logs=None
    ):

        timestamp = anomaly["timestamp"]

        service = anomaly["service"]

        anomaly_score = float(
            anomaly["anomaly_score"]
        )

        shap_explanation = (
            self.get_shap_explanation()
        )

        dominant_feature = (
            self.get_dominant_feature(
                shap_explanation
            )
        )

        context = {

            "incident_id":
                f"{service}_{timestamp}",

            "service":
                service,

            "timestamp":
                str(timestamp),

            "anomaly_score":
                anomaly_score,

            "incident_severity":
                float(
                    anomaly.get(
                        "incident_severity",
                        0.0
                    )
                ),

            "anomaly_type":
                "ML-detected operational anomaly",

            "metrics": {

                "request_rate":
                    float(
                        anomaly["request_rate"]
                    ),

                "error_rate":
                    float(
                        anomaly["error_rate"]
                    ),

                "latency":
                    float(
                        anomaly["latency"]
                    ),

                "memory":
                    float(
                        anomaly["memory"]
                    ),

                "cpu":
                    float(
                        anomaly["cpu"]
                    )
            },

            "shap_explanation":
                shap_explanation,

            "dominant_feature":
                dominant_feature,

            "logs":
                logs or []
        }

        return context


# =============================================================
# MAIN
# =============================================================

if __name__ == "__main__":

    print(
        "Initializing Incident Agent..."
    )

    agent = IncidentAgent()

    # ---------------------------------------------------------
    # LOAD RESULTS
    # ---------------------------------------------------------

    print(
        "\nLoading anomaly results..."
    )

    agent.load_anomaly_results()

    print(
        "Loading SHAP results..."
    )

    agent.load_shap_results()

    # ---------------------------------------------------------
    # GET BASELINE ANOMALIES
    # ---------------------------------------------------------

    anomalies = agent.get_anomalies()

    print(
        "\nDetected baseline anomalies:",
        len(anomalies)
    )

    # ---------------------------------------------------------
    # FILTER MEANINGFUL ANOMALIES
    # ---------------------------------------------------------

    meaningful_anomalies = (
        agent.filter_meaningful_anomalies(
            anomalies
        )
    )

    print(
        "Meaningful anomalies:",
        len(meaningful_anomalies)
    )

    # ---------------------------------------------------------
    # SELECT INCIDENT
    # ---------------------------------------------------------

    strongest = (
        agent.get_strongest_anomaly()
    )

    if strongest is None:

        print(
            "\nNo meaningful anomalies detected."
        )

    else:

        print(
            "\n===== SELECTED INCIDENT ====="
        )

        print(
            "Timestamp:",
            strongest["timestamp"]
        )

        print(
            "Service:",
            strongest["service"]
        )

        print(
            "CPU:",
            strongest["cpu"]
        )

        print(
            "Error Rate:",
            strongest["error_rate"]
        )

        print(
            "Latency:",
            strongest["latency"]
        )

        print(
            "Request Rate:",
            strongest["request_rate"]
        )

        print(
            "Anomaly Score:",
            strongest["anomaly_score"]
        )

        print(
            "Incident Severity:",
            strongest["incident_severity"]
        )

        # -----------------------------------------------------
        # CREATE INCIDENT CONTEXT
        # -----------------------------------------------------

        incident = (
            agent.create_incident_context(
                strongest
            )
        )

        print(
            "\n===== INCIDENT CONTEXT ====="
        )

        print(
            "\nIncident ID:"
        )

        print(
            incident["incident_id"]
        )

        print(
            "\nService:"
        )

        print(
            incident["service"]
        )

        print(
            "\nTimestamp:"
        )

        print(
            incident["timestamp"]
        )

        print(
            "\nAnomaly Score:"
        )

        print(
            incident["anomaly_score"]
        )

        print(
            "\nIncident Severity:"
        )

        print(
            incident["incident_severity"]
        )

        print(
            "\nMetrics:"
        )

        for feature, value in (
            incident["metrics"].items()
        ):

            print(
                f"  {feature}: {value}"
            )

        print(
            "\nSHAP Explanation:"
        )

        for feature, value in (
            incident[
                "shap_explanation"
            ].items()
        ):

            print(
                f"  {feature}: {value}"
            )

        print(
            "\nDominant Feature:"
        )

        print(
            incident[
                "dominant_feature"
            ]
        )

        print(
            "\n===== INCIDENT CONTEXT "
            "CREATED SUCCESSFULLY ====="
        )