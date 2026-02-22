class PromptBuilder:

    @staticmethod
    def build_remark_prompt(data: dict) -> str:
        marks = data.get("marks", {})
        attendance = data.get("attendance", {})

        marks_block = ""
        for subject, score in marks.items():
            marks_block += f"- {subject}: {score}\n"
        
        attendance_block = ""
        for subject, att_score in attendance.items():
            attendance_block += f"- {subject}: {att_score}%\n"

        prompt = f"""
Generate structured semester performance remarks.

Student Data:
Marks:
{marks_block}

Attendance:
{attendance_block}

Instructions:

1. Write exactly one sentence per subject.
2. Each sentence must be on a SINGLE LINE.
3. Format:
   <Subject>: <score-based phrase> and <attendance phrase>.
4. Performance phrases must refer only to marks, such as:
   - "scored well"
   - "achieved good marks"
   - "secured satisfactory marks"
   - "scored below expectations"
5. Attendance rule:
   - 85% or above → "maintained regular attendance".
   - Below 85% → "attendance below expected level".
6. Do NOT display numeric values.
7. Do NOT use student name.
8. No motivational language.

9. After subject sentences, add:
   Overall performance: <summary of scoring trend> and <overall attendance trend>.

10. Then add one final line:
    Improvement needed in <subjects with low scores> and attendance improvement required in <subjects with low attendance>.

11. The final improvement sentence must:
    - Mention subject names explicitly.
    - Be direct and factual.
    - Not include advice words like "should", "encouraged", "recommended".
    - Not include motivational phrases.

12. Output only the sentences separated by newline characters.
13. Do NOT insert blank lines.
"""
        return prompt.strip()