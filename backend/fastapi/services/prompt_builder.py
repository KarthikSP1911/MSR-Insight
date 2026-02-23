from typing import Any


class PromptBuilder:
    """Class to build prompts for AI remark generation."""

    @staticmethod
    def build_remark_prompt(data: dict[str, Any]) -> str:
        subjects = data.get("subjects", [])
        subjects_block = "\n".join(
            [f"- {s['code']} - {s['name']}: Marks={s['marks']}, Attendance={s['attendance']}%" for s in subjects]
        )

        prompt = f"""Generate structured semester performance remarks based on the data below.

Student Data:
{subjects_block}

Instructions:
1. Write exactly one sentence per subject.
2. Each sentence must be on a SINGLE LINE.
3. Format: <Subject Name>: <score-based phrase> and <attendance phrase>.
4. Use descriptive phrases for marks (e.g., "scored well", "achieved good marks", "secured satisfactory marks", "scored below expectations").
5. Attendance phrase rule: 
   - 85% or above: "maintained regular attendance"
   - Below 85%: "attendance below expected level"
6. Do NOT display any numeric values in the output.
7. Do NOT use blank lines.
8. No motivational language or advice.
9. After subject sentences, add a line:
   Overall performance: <summary of scoring trend> and <overall attendance trend>.
10. Final sentence must follow this format:
    Improvement needed in <subjects with marks below 50> and attendance improvement required in <subjects with attendance below 85%>.
    - Determine low scores as marks < 50 and low attendance as < 85%.
    - List subject names only (e.g., "Machine Learning"). Do NOT include subject codes.
    - If no subjects meet the criteria for a category, use "none".

Output only the sentences as requested."""
        return prompt.strip()