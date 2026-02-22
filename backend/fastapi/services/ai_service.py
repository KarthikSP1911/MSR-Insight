from .prompt_builder import PromptBuilder
from .llm_provider import GroqLLMProvider


class AIService:

    def __init__(self):
        self.llm_provider = GroqLLMProvider()

    def generate_remark(self, data: dict) -> dict:
        self._validate_input(data)

        prompt = PromptBuilder.build_remark_prompt(data)

        llm_response = self.llm_provider.generate(prompt)

        return {
            "ai_remark": llm_response["text"],
            "meta": {
                "model": llm_response["model"],
                "tokens_used": llm_response["tokens_used"],
                "generation_time_ms": llm_response["generation_time_ms"]
            }
        }

    def _validate_input(self, data: dict):
        if not data.get("marks"):
            raise ValueError("Marks data required")

        if "attendance" not in data:
            raise ValueError("Attendance required")

        if not isinstance(data["attendance"], dict):
            raise ValueError("Attendance must be a dictionary")