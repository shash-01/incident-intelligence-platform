import sys
import os
from datetime import datetime, timedelta, timezone

# Add project root to Python path
sys.path.append(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

from backend.loki_client import query_logs
from agents.incident_agent import IncidentAgent


# Metrics timestamps are stored as Indian Standard Time (IST)
IST = timezone(timedelta(hours=5, minutes=30))


class RootCauseAgent:

    def __init__(self):
        self.incident_agent = IncidentAgent()

    def get_relevant_logs(self, incident):
        """
        Retrieve Loki logs around the incident timestamp.

        Incident timestamps from the metrics dataset are stored
        as naive IST timestamps. Loki uses UTC timestamps.
        """

        service = incident["service"]

        timestamp = datetime.fromisoformat(
            incident["timestamp"]
        )

        # ---------------------------------------------------------
        # TIMEZONE CORRECTION
        # ---------------------------------------------------------

        if timestamp.tzinfo is None:
            # Metrics timestamp is naive -> treat it as IST
            timestamp = timestamp.replace(tzinfo=IST)

        # Convert incident timestamp to UTC for Loki
        timestamp = timestamp.astimezone(timezone.utc)

        # Search 30 seconds before and after the incident
        start_time = timestamp - timedelta(seconds=30)
        end_time = timestamp + timedelta(seconds=30)

        print("\n===== QUERYING LOKI =====")
        print("Service:", service)
        print("Incident UTC:", timestamp)
        print("Start:", start_time)
        print("End:", end_time)

        logs = query_logs(
            service_name=service,
            start_time=start_time,
            end_time=end_time,
            limit=100
        )

        return logs

    def analyze_logs(self, incident, logs):
        """
        Analyze Loki logs together with anomaly information.
        """

        if not logs:
            return {
                "root_cause": "Insufficient log evidence",
                "confidence": "Low",
                "evidence": []
            }

        evidence = []

        dominant_feature = incident["dominant_feature"]

        # ---------------------------------------------------------
        # SEARCH FOR EXPLICIT FAULT EVIDENCE
        # ---------------------------------------------------------

        cpu_evidence = []
        latency_evidence = []
        error_evidence = []

        for log in logs:

            message = log["message"]

            # CPU stress evidence
            if "CPU stress simulation started" in message:
                cpu_evidence.append(message)

            elif "CPU stress simulation completed" in message:
                cpu_evidence.append(message)

            elif "/simulate-cpu" in message:
                cpu_evidence.append(message)

            # Latency evidence
            if (
                "/simulate-delay" in message
                or "Simulating high latency" in message
            ):
                latency_evidence.append(message)

            # Error evidence
            if (
                "/simulate-error" in message
                or "Simulated payment/user-service error" in message
            ):
                error_evidence.append(message)

        # ---------------------------------------------------------
        # DETERMINE ROOT CAUSE
        # ---------------------------------------------------------

        if cpu_evidence:

            evidence.extend(cpu_evidence)

            root_cause = (
                "CPU utilization increased due to a CPU stress operation "
                "executed on the user-service."
            )

            confidence = "High"

        elif latency_evidence:

            evidence.extend(latency_evidence)

            root_cause = (
                "Increased latency was associated with a simulated "
                "high-latency operation on the user-service."
            )

            confidence = "High"

        elif error_evidence:

            evidence.extend(error_evidence)

            root_cause = (
                "The incident was associated with a simulated application "
                "error in the user-service."
            )

            confidence = "High"

        else:

            root_cause = (
                f"Anomaly appears to be primarily associated with "
                f"{dominant_feature}, but no explicit fault event "
                f"was found in the available logs."
            )

            confidence = "Medium"

        return {
            "root_cause": root_cause,
            "confidence": confidence,
            "evidence": evidence
        }

    def analyze_incident(self, incident):

        print("\n===== ROOT CAUSE AGENT =====")

        logs = self.get_relevant_logs(incident)

        print("\nLogs retrieved:", len(logs))

        result = self.analyze_logs(
            incident,
            logs
        )

        return {
            "incident": incident,
            "logs": logs,
            "root_cause": result["root_cause"],
            "confidence": result["confidence"],
            "evidence": result["evidence"]
        }


if __name__ == "__main__":

    print("Initializing Root Cause Agent...")

    # ---------------------------------------------------------
    # LOAD INCIDENT INFORMATION
    # ---------------------------------------------------------

    incident_agent = IncidentAgent()

    incident_agent.load_anomaly_results()
    incident_agent.load_shap_results()

    strongest_anomaly = incident_agent.get_strongest_anomaly()

    if strongest_anomaly is None:

        print("\nNo anomaly available for root cause analysis.")

        sys.exit(0)

    # ---------------------------------------------------------
    # CREATE INCIDENT CONTEXT
    # ---------------------------------------------------------

    incident = incident_agent.create_incident_context(
        strongest_anomaly
    )

    # ---------------------------------------------------------
    # INITIALIZE ROOT CAUSE AGENT
    # ---------------------------------------------------------

    root_cause_agent = RootCauseAgent()

    # ---------------------------------------------------------
    # ANALYZE INCIDENT
    # ---------------------------------------------------------

    result = root_cause_agent.analyze_incident(
        incident
    )

    # ---------------------------------------------------------
    # DISPLAY RESULT
    # ---------------------------------------------------------

    print("\n===== ROOT CAUSE RESULT =====")

    print("\nService:")
    print(result["incident"]["service"])

    print("\nDominant Feature:")
    print(result["incident"]["dominant_feature"])

    print("\nRoot Cause:")
    print(result["root_cause"])

    print("\nConfidence:")
    print(result["confidence"])

    print("\nEvidence:")

    if result["evidence"]:

        for evidence in result["evidence"]:
            print("  -", evidence)

    else:

        print("  No direct evidence found.")

    print("\n===== ROOT CAUSE ANALYSIS COMPLETE =====")