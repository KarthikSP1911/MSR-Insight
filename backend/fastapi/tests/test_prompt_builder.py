from services.prompt_builder import PromptBuilder

def test_build_remark_prompt():
    data = {
        "subjects": [
            {"name": "Math", "code": "M1", "marks": 80, "attendance": 90},
            {"name": "Science", "code": "S1", "marks": 40, "attendance": 80}
        ]
    }
    
    prompt = PromptBuilder.build_remark_prompt(data)
    
    assert "Generate a concise semester performance remark" in prompt
    assert "- M1 - Math: Marks=80, Attendance=90%" in prompt
    assert "- S1 - Science: Marks=40, Attendance=80%" in prompt
    assert "Overall performance:" in prompt
