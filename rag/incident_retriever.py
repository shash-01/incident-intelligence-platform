from rag.retriever import KnowledgeRetriever


class IncidentKnowledgeRetriever:

    def __init__(self):
        self.retriever = KnowledgeRetriever()

    def build_query(self, incident, root_cause_result=None):

        service = incident.get(
            "service",
            "unknown-service"
        )

        dominant_feature = incident.get(
            "dominant_feature",
            "unknown"
        )

        metrics = incident.get(
            "metrics",
            {}
        )

        cpu = metrics.get(
            "cpu",
            0
        )

        error_rate = metrics.get(
            "error_rate",
            0
        )

        latency = metrics.get(
            "latency",
            0
        )

        request_rate = metrics.get(
            "request_rate",
            0
        )

        root_cause = ""

        if root_cause_result:

            root_cause = root_cause_result.get(
                "root_cause",
                ""
            )

        query = f"""
Microservice incident investigation.

Service: {service}

Dominant anomaly feature: {dominant_feature}

CPU utilization: {cpu}
Error rate: {error_rate}
Request latency: {latency}
Request rate: {request_rate}

Root cause evidence:
{root_cause}

Find troubleshooting knowledge and recommended
actions relevant to this incident.
"""

        return query.strip()

    def retrieve_knowledge(
        self,
        incident,
        root_cause_result=None,
        top_k=3
    ):

        query = self.build_query(
            incident=incident,
            root_cause_result=root_cause_result
        )

        results = self.retriever.retrieve(
            query=query,
            top_k=top_k
        )

        return {
            "query": query,
            "results": results
        }


if __name__ == "__main__":

    print(
        "===== INCIDENT RAG TEST ====="
    )

    incident = {

        "service": "user-service",

        "dominant_feature": "latency",

        "metrics": {

            "cpu": 27.640384,

            "error_rate": 0,

            "latency": 1.278109,

            "request_rate": 0.218214
        }
    }

    root_cause_result = {

        "root_cause": (
            "CPU utilization increased due to a CPU stress "
            "operation executed on the user-service."
        )
    }

    retriever = IncidentKnowledgeRetriever()

    result = retriever.retrieve_knowledge(
        incident=incident,
        root_cause_result=root_cause_result,
        top_k=3
    )

    print("\nGenerated Query:")

    print(
        result["query"]
    )

    print("\nRetrieved Knowledge:")

    for i, item in enumerate(
        result["results"],
        start=1
    ):

        print(
            f"\n--- Knowledge {i} ---"
        )

        print(
            "ID:",
            item["id"]
        )

        print(
            item["document"]
        )

    print(
        "\n===== INCIDENT RAG TEST COMPLETE ====="
    )