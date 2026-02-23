from typing import Any


class PromptBuilder:
    """Class to build prompts for AI remark generation."""

    @staticmethod
    def build_remark_prompt(data: dict[str, Any]) -> str:
        subjects = data.get("subjects", [])
        subjects_block = "\n".join(
            [f"- {s['code']} - {s['name']}: Marks={s['marks']}, Attendance={s['attendance']}%" for s in subjects]
        )

        prompt = f"""Generate a concise semester performance remark based on the data below.

Student Data:
{subjects_block}

Instructions:
1. Do NOT write subject-wise sentences.
2. Generate exactly TWO lines only.
3. First line must be:
   Overall performance: <summary of overall marks trend> and <overall attendance trend>.
   - The attendance trend should mention if attendance was lower in some subjects (e.g., "attendance was lower in a few subjects").
4. Second line must follow one of these formats:

   If there are subjects with marks below 50 and/or attendance below 85%:
   Improvement needed in <number> subjects and attendance improvement required in <number> subjects.

   If there are NO subjects with marks below 50:
   Good academic performance across all subjects.

   If there are NO subjects with attendance below 85%:
   Consistent attendance maintained across all subjects.

   If both academic performance and attendance are satisfactory:
   Good academic performance across all subjects and consistent attendance maintained across all subjects.

5. Determine low scores as marks below 50.
6. Determine low attendance as attendance below 85%.
7. Do NOT list subject names.
8. Do NOT display numeric marks or percentages.
9. No motivational language or advice.
10. No blank lines.

Output only the two lines exactly as specified."""
        return prompt.strip()
