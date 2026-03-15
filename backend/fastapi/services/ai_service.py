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
        if not isinstance(subjects, list):
            raise ValueError("'subjects' must be a list.")
        
        if len(subjects) == 0:
            raise ValueError("'subjects' list cannot be empty.")

        for subject in subjects:
            # Ensure required fields exist with fallback types
            subject["code"] = str(subject.get("code", "N/A"))
            subject["name"] = str(subject.get("name", "Unknown"))
            
            # Coerce marks and attendance to float, default to 0.0 if missing/invalid
            try:
                subject["marks"] = float(subject.get("marks", 0))
            except (ValueError, TypeError):
                subject["marks"] = 0.0
                
            try:
                subject["attendance"] = float(subject.get("attendance", 0))
            except (ValueError, TypeError):
                subject["attendance"] = 0.0
