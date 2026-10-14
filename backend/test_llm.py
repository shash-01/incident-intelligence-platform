from llm_client import LLMClient


if __name__ == "__main__":

    print("Testing Groq LLM...")

    llm = LLMClient()

    response = llm.generate(

        system_prompt=(
            "You are an incident analysis assistant "
            "for a microservice monitoring platform."
        ),

        user_prompt=(
            "A microservice has CPU utilization of 27.6%. "
            "Give one short troubleshooting recommendation."
        )
    )

    print("\n===== LLM RESPONSE =====")

    print(response)

    print("\n===== LLM TEST COMPLETE =====")