from typing import Any
from .prompt_builder import PromptBuilder
from .llm_provider import GroqLLMProvider


class AIService:
    """Service to handle AI-based student performance reporting."""

    def __init__(self) -> None:
        self.llm_provider = GroqLLMProvider()

    def generate_remark(self, data: dict[str, Any]) -> dict[str, Any]:
        """Validates input, generates a prompt, and returns AI-generated remarks with student details."""
        self._validate_input(data)

        prompt = PromptBuilder.build_remark_prompt(data)
        llm_response = self.llm_provider.generate(prompt)

        return {
            "student_detail": {
                "name": data.get("name"),
                "usn": data.get("usn"),
                "class_details": data.get("class_details"),
                "cgpa": data.get("cgpa"),
                "last_updated": data.get("last_updated"),
            },
            "ai_remark": llm_response["text"],
            "meta": {
                "model": llm_response["model"],
                "tokens_used": llm_response["tokens_used"],
                "generation_time_ms": llm_response["generation_time_ms"]
            }
        }

    def _validate_input(self, data: dict[str, Any]) -> None:
        """Validates that the input follows the unified subjects schema."""
        if "subjects" not in data:
            raise ValueError("Input must contain a 'subjects' key.")

        subjects = data["subjects"]
        if not isinstance(subjects, list) or len(subjects) == 0:
            raise ValueError("'subjects' must be a non-empty list.")

        for subject in subjects:
            required_fields = {
                "code": str,
                "name": str,
                "marks": (int, float),
                "attendance": (int, float)
            }
            for field, expected_type in required_fields.items():
                if field not in subject:
                    raise ValueError(f"Subject item missing required field: '{field}'")
                if not isinstance(subject[field], expected_type):
                    raise ValueError(f"Field '{field}' in subject must be of type {expected_type}")
