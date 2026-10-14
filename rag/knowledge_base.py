import chromadb


# ChromaDB persistent storage
CHROMA_PATH = "rag/chroma_db"


def create_knowledge_base():

    client = chromadb.PersistentClient(
        path=CHROMA_PATH
    )

    collection = client.get_or_create_collection(
        name="incident_knowledge"
    )

    documents = [
        {
            "id": "cpu_spike",
            "text": """
            CPU utilization spike troubleshooting:
            A sudden increase in CPU utilization may indicate CPU-intensive
            operations, infinite loops, excessive computation, traffic spikes,
            or inefficient application code.

            Recommended investigation:
            1. Check CPU utilization over time.
            2. Identify the affected microservice.
            3. Check application logs around the incident timestamp.
            4. Look for CPU-intensive operations or repeated processing.
            5. Check whether request rate increased significantly.

            Recommended actions:
            Reduce unnecessary computation, optimize expensive operations,
            investigate abnormal traffic, and review recent application changes.
            """
        },
        {
            "id": "high_latency",
            "text": """
            High latency troubleshooting:
            Increased request latency may be caused by slow application
            operations, blocking calls, database delays, external service
            delays, CPU contention, or excessive processing.

            Recommended investigation:
            1. Check request latency metrics.
            2. Identify the affected microservice.
            3. Examine logs around the incident timestamp.
            4. Check CPU and memory utilization.
            5. Check whether request traffic increased.

            Recommended actions:
            Identify the slow operation, optimize application logic,
            investigate downstream dependencies, and reduce unnecessary
            blocking operations.
            """
        },
        {
            "id": "application_error",
            "text": """
            Application error troubleshooting:
            A sudden increase in HTTP 4xx or 5xx errors may indicate
            application failures, invalid requests, unavailable dependencies,
            configuration problems, or unexpected runtime exceptions.

            Recommended investigation:
            1. Check the error rate.
            2. Identify the affected service.
            3. Query application logs around the incident timestamp.
            4. Look for HTTP 500 errors and exception messages.
            5. Check whether the problem is isolated to one service.

            Recommended actions:
            Inspect the application exception, fix the failing operation,
            validate dependencies, and deploy the corrected application.
            """
        },
        {
            "id": "memory_spike",
            "text": """
            High memory utilization troubleshooting:
            Increasing memory usage may be caused by large data processing,
            memory leaks, excessive caching, inefficient object creation,
            or unusually high traffic.

            Recommended investigation:
            1. Check memory utilization over time.
            2. Identify the affected service.
            3. Compare memory usage with request traffic.
            4. Examine application logs for memory-related warnings.
            5. Check whether memory continues increasing after traffic drops.

            Recommended actions:
            Identify memory-intensive operations, optimize memory usage,
            review caching behavior, and investigate possible memory leaks.
            """
        },
        {
            "id": "traffic_spike",
            "text": """
            Request traffic spike troubleshooting:
            A sudden increase in request rate may overload a microservice
            and result in increased CPU usage, memory usage, latency,
            or application errors.

            Recommended investigation:
            1. Check request rate.
            2. Check CPU and memory utilization.
            3. Check latency and error rate.
            4. Identify the affected service.
            5. Examine application logs for abnormal request patterns.

            Recommended actions:
            Investigate the source of the traffic increase, optimize the
            service, apply appropriate rate limiting, and scale the service
            when required.
            """
        },
        {
            "id": "service_failure",
            "text": """
            Microservice failure troubleshooting:
            A service failure may result in unavailable endpoints, HTTP 5xx
            responses, missing metrics, or repeated connection failures.

            Recommended investigation:
            1. Check the Prometheus service health metric.
            2. Check application error rates.
            3. Examine Loki logs for exceptions or service shutdown messages.
            4. Check whether other services are affected.
            5. Determine whether the failure is isolated or cascading.

            Recommended actions:
            Restart the failed service when appropriate, investigate the
            underlying exception, verify service dependencies, and deploy
            a permanent fix.
            """
        }
    ]

    for document in documents:

        collection.upsert(
            ids=[document["id"]],
            documents=[document["text"]],
            metadatas=[
                {
                    "type": "troubleshooting",
                    "category": document["id"]
                }
            ]
        )

    print("\n===== KNOWLEDGE BASE CREATED =====")
    print("Collection:", collection.name)
    print("Documents:", collection.count())
    print("Storage:", CHROMA_PATH)


if __name__ == "__main__":
    create_knowledge_base()