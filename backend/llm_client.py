import os

from dotenv import load_dotenv
from groq import Groq


# Load variables from .env
load_dotenv()


class LLMClient:

    def __init__(self):

        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise ValueError(
                "GROQ_API_KEY is not set. "
                "Please add it to the .env file."
            )

        self.client = Groq(
            api_key=api_key
        )

        # Current Groq production model suitable
        # for reasoning and agentic workflows.
        self.model = "openai/gpt-oss-120b"

    def generate(
        self,
        system_prompt,
        user_prompt
    ):

        response = self.client.chat.completions.create(

            model=self.model,

            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],

            temperature=0.2,

            max_completion_tokens=1000,

            reasoning_effort="medium"
        )

        return response.choices[0].message.content