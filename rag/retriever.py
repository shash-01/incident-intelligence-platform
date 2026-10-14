import chromadb


CHROMA_PATH = "rag/chroma_db"
COLLECTION_NAME = "incident_knowledge"


class KnowledgeRetriever:

    def __init__(self):

        self.client = chromadb.PersistentClient(
            path=CHROMA_PATH
        )

        self.collection = self.client.get_collection(
            name=COLLECTION_NAME
        )

    def retrieve(self, query, top_k=3):

        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )

        retrieved_documents = results.get("documents", [[]])[0]
        retrieved_ids = results.get("ids", [[]])[0]

        results_list = []

        for document_id, document in zip(
            retrieved_ids,
            retrieved_documents
        ):

            results_list.append(
                {
                    "id": document_id,
                    "document": document
                }
            )

        return results_list


if __name__ == "__main__":

    retriever = KnowledgeRetriever()

    query = """
    user-service has unusually high CPU utilization.
    The anomaly detector identified CPU as an important
    feature contributing to the incident.
    """

    results = retriever.retrieve(query, top_k=3)

    print("\n===== RAG RETRIEVAL TEST =====")

    print("\nQuery:")
    print(query)

    print("\nRetrieved Knowledge:")

    for i, result in enumerate(results, start=1):

        print(f"\n--- Result {i} ---")
        print("ID:", result["id"])
        print("Knowledge:")
        print(result["document"])

    print("\n===== RAG RETRIEVAL COMPLETE =====")