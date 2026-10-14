import sys
import os
import json
import pandas as pd


# ============================================================
# PROJECT ROOT
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(
        0,
        PROJECT_ROOT
    )


# ============================================================
# PROJECT IMPORTS
# ============================================================

from agents.incident_agent import IncidentAgent
from agents.root_cause_agent import RootCauseAgent
from rag.incident_retriever import IncidentKnowledgeRetriever
from backend.llm_client import LLMClient


# ============================================================
# FILES
# ============================================================

SHAP_FILE = os.path.join(
    PROJECT_ROOT,
    "ml",
    "data",
    "shap_explanation.csv"
)


class RecommendationAgent:

    def __init__(self):

        print("Initializing Recommendation Agent...")

        self.incident_agent = IncidentAgent()

        self.root_cause_agent = RootCauseAgent()

        self.knowledge_retriever = (
            IncidentKnowledgeRetriever()
        )

        self.llm = LLMClient()


    # ========================================================
    # LOAD SHAP EXPLANATION
    # ========================================================

    def load_shap_explanation(self):

        if not os.path.exists(SHAP_FILE):

            print(
                "\nWARNING: SHAP explanation file not found."
            )

            return []

        df = pd.read_csv(
            SHAP_FILE
        )

        shap_values = []

        for _, row in df.iterrows():

            shap_values.append(
                {
                    "feature": row["feature"],
                    "shap_value": float(
                        row["shap_value"]
                    ),
                    "absolute_contribution": float(
                        row["absolute_contribution"]
                    )
                }
            )

        return shap_values


    # ========================================================
    # BUILD LLM CONTEXT
    # ========================================================

    def build_llm_prompt(
        self,
        incident,
        root_cause_result,
        shap_values,
        retrieved_knowledge
    ):

        service = incident.get(
            "service",
            "unknown-service"
        )

        timestamp = incident.get(
            "timestamp",
            "unknown"
        )

        dominant_feature = incident.get(
            "dominant_feature",
            "unknown"
        )

        incident_severity = incident.get(
            "incident_severity",
            0
        )

        anomaly_score = incident.get(
            "anomaly_score",
            0
        )

        metrics = incident.get(
            "metrics",
            {}
        )

        root_cause = root_cause_result.get(
            "root_cause",
            "Unknown"
        )

        confidence = root_cause_result.get(
            "confidence",
            "Unknown"
        )

        evidence = root_cause_result.get(
            "evidence",
            []
        )

        knowledge = []

        for item in retrieved_knowledge:

            knowledge.append(
                {
                    "id": item.get(
                        "id",
                        "unknown"
                    ),
                    "document": item.get(
                        "document",
                        ""
                    )
                }
            )

        # ----------------------------------------------------
        # Complete evidence package
        # ----------------------------------------------------

        incident_data = {

            "service": service,

            "timestamp": timestamp,

            "incident_severity": incident_severity,

            "anomaly_score": anomaly_score,

            "metrics": metrics,

            "dominant_shap_feature": dominant_feature,

            "shap_explanation": shap_values,

            "root_cause": root_cause,

            "root_cause_confidence": confidence,

            "loki_evidence": evidence,

            "retrieved_troubleshooting_knowledge": knowledge
        }

        # ----------------------------------------------------
        # System instructions
        # ----------------------------------------------------

        system_prompt = """
You are an AI incident analysis and recommendation agent
for a microservice observability platform.

Your task is to analyze an incident using ONLY the evidence
provided in the incident context.

The evidence may contain:

1. Operational metrics
2. Isolation Forest anomaly score
3. SHAP feature contributions
4. Loki application logs
5. Root Cause Agent analysis
6. Retrieved troubleshooting knowledge from a RAG system

Important reasoning rules:

- Do not invent evidence.
- Do not claim that a feature caused an incident only because
  it has a high SHAP contribution.
- SHAP indicates which features contributed to the model's
  anomaly decision; it does NOT by itself prove causality.
- Prefer direct application-log evidence when determining
  the probable operational cause.
- If SHAP and log evidence appear different, explicitly
  distinguish anomaly contribution from causal evidence.
- Use the retrieved troubleshooting knowledge to support
  practical recommendations.
- Recommendations must be specific to the affected service.
- Do not recommend actions unsupported by the evidence.
- Do not recommend automatic remediation.
- The system is a prototype and recommendations are advisory.

Return your answer using exactly these sections:

ROOT CAUSE:
<probable root cause>

EVIDENCE:
<important evidence supporting the conclusion>

ANOMALY EXPLANATION:
<explain the important SHAP features and clarify that
SHAP represents model contribution rather than causality>

RECOMMENDATION:
<specific corrective action>

VERIFICATION:
<how an engineer should verify that the incident is resolved>

CONFIDENCE:
<High, Medium, or Low>
"""

        # ----------------------------------------------------
        # User context
        # ----------------------------------------------------

        user_prompt = f"""
Analyze the following microservice incident.

INCIDENT CONTEXT:

{json.dumps(
    incident_data,
    indent=4
)}

Produce an evidence-grounded incident analysis and
recommendation according to the required format.
"""

        return system_prompt, user_prompt


    # ========================================================
    # FALLBACK RECOMMENDATION
    # ========================================================

    def fallback_recommendation(
        self,
        incident,
        root_cause_result
    ):

        root_cause = root_cause_result.get(
            "root_cause",
            ""
        )

        feature = incident.get(
            "dominant_feature",
            ""
        )

        cause = root_cause.lower()
        feature = feature.lower()

        # CPU incident
        if "cpu" in cause:

            recommendation = (
                "Investigate the CPU-intensive operation "
                "identified in the affected microservice. "
                "Optimize or remove unnecessary computation, "
                "then monitor CPU utilization to verify that "
                "the service returns to normal behavior."
            )

        # Latency incident
        elif "latency" in feature:

            recommendation = (
                "Investigate the operation responsible for "
                "increased latency, optimize the affected "
                "code path, and verify that request latency "
                "returns to normal."
            )

        # Error incident
        elif "error" in feature:

            recommendation = (
                "Investigate the application error using "
                "the corresponding Loki logs, fix the failing "
                "operation, and verify that the error rate "
                "returns to normal."
            )

        # Generic fallback
        else:

            recommendation = (
                "Investigate the affected microservice using "
                "the available metrics and logs, apply the "
                "appropriate corrective action, and monitor "
                "the service to verify that the anomaly has "
                "been resolved."
            )

        return (
            "ROOT CAUSE:\n"
            f"{root_cause}\n\n"

            "EVIDENCE:\n"
            "Root Cause Agent evidence was used.\n\n"

            "ANOMALY EXPLANATION:\n"
            f"The dominant SHAP feature was {feature}.\n\n"

            "RECOMMENDATION:\n"
            f"{recommendation}\n\n"

            "VERIFICATION:\n"
            "Monitor the affected service metrics and logs "
            "to confirm that the anomaly has returned to "
            "normal levels.\n\n"

            "CONFIDENCE:\n"
            "Medium"
        )


    # ========================================================
    # MAIN ANALYSIS
    # ========================================================

    def analyze_incident(self):

        # ----------------------------------------------------
        # Step 1: Load anomaly results
        # ----------------------------------------------------

        print(
            "\n===== LOADING INCIDENT DATA ====="
        )

        self.incident_agent.load_anomaly_results()

        self.incident_agent.load_shap_results()


        # ----------------------------------------------------
        # Step 2: Select strongest anomaly
        # ----------------------------------------------------

        strongest_anomaly = (
            self.incident_agent.get_strongest_anomaly()
        )

        if strongest_anomaly is None:

            print(
                "\nNo meaningful anomaly found."
            )

            return None


        # ----------------------------------------------------
        # Step 3: Create incident context
        # ----------------------------------------------------

        incident = (
            self.incident_agent.create_incident_context(
                strongest_anomaly
            )
        )


        # ----------------------------------------------------
        # Step 4: Root Cause Agent
        # ----------------------------------------------------

        print(
            "\n===== RUNNING ROOT CAUSE AGENT ====="
        )

        root_cause_result = (
            self.root_cause_agent.analyze_incident(
                incident
            )
        )


        # ----------------------------------------------------
        # Step 5: Load SHAP explanation
        # ----------------------------------------------------

        shap_values = (
            self.load_shap_explanation()
        )


        # ----------------------------------------------------
        # Step 6: Retrieve RAG knowledge
        # ----------------------------------------------------

        print(
            "\n===== RETRIEVING RAG KNOWLEDGE ====="
        )

        rag_result = (
            self.knowledge_retriever.retrieve_knowledge(

                incident=incident,

                root_cause_result=root_cause_result,

                top_k=3
            )
        )

        retrieved_knowledge = (
            rag_result["results"]
        )


        print(
            "\nRetrieved Knowledge:"
        )

        for item in retrieved_knowledge:

            print(
                "  -",
                item["id"]
            )


        # ----------------------------------------------------
        # Step 7: Build LLM context
        # ----------------------------------------------------

        system_prompt, user_prompt = (
            self.build_llm_prompt(

                incident=incident,

                root_cause_result=root_cause_result,

                shap_values=shap_values,

                retrieved_knowledge=retrieved_knowledge
            )
        )


        # ----------------------------------------------------
        # Step 8: Call LLM
        # ----------------------------------------------------

        print(
            "\n===== CALLING GROQ LLM ====="
        )

        try:

            llm_response = self.llm.generate(

                system_prompt=system_prompt,

                user_prompt=user_prompt
            )

            source = "Groq LLM"

        except Exception as error:

            print(
                "\nLLM request failed:"
            )

            print(
                error
            )

            print(
                "\nUsing deterministic fallback."
            )

            llm_response = (
                self.fallback_recommendation(

                    incident=incident,

                    root_cause_result=root_cause_result
                )
            )

            source = "Deterministic Fallback"


        # ----------------------------------------------------
        # Step 9: Return complete result
        # ----------------------------------------------------

        return {

            "incident": incident,

            "root_cause_result": root_cause_result,

            "shap_values": shap_values,

            "retrieved_knowledge": retrieved_knowledge,

            "llm_response": llm_response,

            "source": source
        }


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    agent = RecommendationAgent()

    result = (
        agent.analyze_incident()
    )

    if result is None:

        sys.exit(0)


    incident = result[
        "incident"
    ]

    root_cause_result = result[
        "root_cause_result"
    ]


    print(
        "\n\n=================================================="
    )

    print(
        "       FINAL AI INCIDENT ANALYSIS"
    )

    print(
        "=================================================="
    )


    print(
        "\nService:"
    )

    print(
        incident.get(
            "service",
            "unknown"
        )
    )


    print(
        "\nTimestamp:"
    )

    print(
        incident.get(
            "timestamp",
            "unknown"
        )
    )


    print(
        "\nIncident Severity:"
    )

    print(
        incident.get(
            "incident_severity",
            "unknown"
        )
    )


    print(
        "\nDominant SHAP Feature:"
    )

    print(
        incident.get(
            "dominant_feature",
            "unknown"
        )
    )


    print(
        "\nRoot Cause Agent:"
    )

    print(
        root_cause_result.get(
            "root_cause",
            "unknown"
        )
    )


    print(
        "\nRCA Confidence:"
    )

    print(
        root_cause_result.get(
            "confidence",
            "unknown"
        )
    )


    print(
        "\nLLM Source:"
    )

    print(
        result["source"]
    )


    print(
        "\n===== FINAL LLM ANALYSIS ====="
    )

    print(
        result["llm_response"]
    )


    print(
        "\n=================================================="
    )

    print(
        "       RECOMMENDATION AGENT COMPLETE"
    )

    print(
        "=================================================="
    )