from services.chunker import build_chunks_for_student, detect_chunk_types

def test_build_chunks_for_student():
    details = {
        "class_details": "B.E. SEM 06",
        "cgpa": "9.2",
        "subjects": [
            {
                "code": "CS601",
                "name": "Software Engineering",
                "marks": 36,
                "attendance": 75,
                "attendance_details": {"present": 30, "absent": 10},
                "assessments": [
                    {"type": "T1", "obtained_marks": 25},
                    {"type": "T2", "obtained_marks": 28}
                ]
            }
        ],
        "exam_history": [
            {"semester": "SEM 5", "sgpa": "9.1"}
        ],
        "remarks": "Good conduct"
    }

    chunks = build_chunks_for_student(
        usn="1MS21CS001",
        name="John Doe",
        current_year=3,
        details=details,
        proctor_id="P123",
        academic_year="2027"
    )

    assert len(chunks) == 5
    
    types = [c.metadata["chunk_type"] for c in chunks]
    assert "identity" in types
    assert "academics" in types
    assert "attendance" in types
    assert "history" in types
    assert "conduct" in types

    # Check identity
    id_chunk = next(c for c in chunks if c.metadata["chunk_type"] == "identity")
    assert "John Doe" in id_chunk.page_content
    assert "SEM 06" in id_chunk.page_content

    # Check academics
    acad_chunk = next(c for c in chunks if c.metadata["chunk_type"] == "academics")
    assert "9.2" in acad_chunk.page_content
    assert "T1: 25" in acad_chunk.page_content

    # Check attendance
    att_chunk = next(c for c in chunks if c.metadata["chunk_type"] == "attendance")
    assert "75%" in att_chunk.page_content

def test_detect_chunk_types():
    assert "academics" in detect_chunk_types("what is his marks?")
    assert "attendance" in detect_chunk_types("does he have attendance shortage?")
    assert "history" in detect_chunk_types("past sgpa")
    assert "conduct" in detect_chunk_types("proctor remarks")
    assert "identity" in detect_chunk_types("which branch")
    
    # Multiple intents
    multi = detect_chunk_types("marks and attendance")
    assert "academics" in multi
    assert "attendance" in multi

    # No match
    assert len(detect_chunk_types("how is the weather")) == 0
