import json
from typing import List, Dict
from langchain_core.documents import Document

# ─────────────────────────────────────────────
# CHUNKING STRATEGY
# ─────────────────────────────────────────────
# Each student's JSONB is split into topic-specific chunks:
#
#  Chunk 1 — Identity      → name, USN, year, branch
#  Chunk 2 — Academics     → SGPA, CGPA, backlogs, subject-wise marks
#  Chunk 3 — Attendance    → subject-wise attendance %
#  Chunk 4 — Achievements  → internships, projects, certifications
#  Chunk 5 — Conduct/Misc  → warnings, counselling notes, extra info
#
# Every chunk carries {usn, name, proctor_id, chunk_type} as metadata
# so we can filter and cite sources later.
# ─────────────────────────────────────────────

def _safe_str(val) -> str:
    """Convert any value to a clean string."""
    if val is None:
        return "N/A"
    if isinstance(val, (dict, list)):
        return json.dumps(val, indent=2)
    return str(val)


def build_chunks_for_student(
    usn: str,
    name: str,
    current_year: int,
    details: dict,
    proctor_id: str,
    academic_year: str,
) -> List[Document]:
    """
    Converts one student record into multiple semantically coherent chunks.
    Matches the actual schema: subjects[], exam_history[], cgpa, class_details.
    """
    base_meta = {
        "usn": usn,
        "name": name,
        "proctor_id": proctor_id,
        "academic_year": academic_year,
    }

    chunks: List[Document] = []

    # ── Chunk 1: Identity ──────────────────────────────────────────────
    class_info = details.get("class_details", "N/A")
    identity_text = (
        f"Student Identity — {name} ({usn})\n"
        f"Name: {name}\n"
        f"USN: {usn}\n"
        f"Current Year: {current_year}\n"
        f"Class/Section: {class_info}\n"
        f"Academic Year: {academic_year}\n"
    )
    chunks.append(Document(page_content=identity_text, metadata={**base_meta, "chunk_type": "identity"}))

    # ── Chunk 2: Current Academics & Marks ─────────────────────────────
    subjects = details.get("subjects", [])
    cgpa = details.get("cgpa", "N/A")
    
    marks_lines = []
    for sub in subjects:
        s_name = sub.get("name", "Unknown")
        s_code = sub.get("code", "")
        s_marks = sub.get("marks", 0)
        assessments = sub.get("assessments", [])
        ass_str = ", ".join([f"{a['type']}: {a['obtained_marks']}" for a in assessments if a.get('obtained_marks', 0) > 0])
        marks_lines.append(f"  - {s_name} ({s_code}): Marks {s_marks}/30 | Details: {ass_str if ass_str else 'No T1/T2 recorded'}")

    academics_text = (
        f"Current Academic Marks — {name} ({usn})\n"
        f"Overall CGPA: {cgpa}\n"
        f"Subject-wise Performance (Current):\n"
        + ("\n".join(marks_lines) if marks_lines else "  No subject data available.")
    )
    chunks.append(Document(page_content=academics_text, metadata={**base_meta, "chunk_type": "academics"}))

    # ── Chunk 3: Attendance ────────────────────────────────────────────
    att_lines = []
    for sub in subjects:
        s_name = sub.get("name", "Unknown")
        s_pct = sub.get("attendance", 0)
        att_det = sub.get("attendance_details", {})
        present = att_det.get("present", 0)
        absent = att_det.get("absent", 0)
        flag = " [⚠ ATTENDANCE SHORTAGE]" if s_pct > 0 and s_pct < 75 else ""
        att_lines.append(f"  - {s_name}: {s_pct}%{flag} (Present: {present}, Absent: {absent})")

    attendance_text = (
        f"Attendance Record — {name} ({usn})\n"
        f"Current Semester Attendance:\n"
        + ("\n".join(att_lines) if att_lines else "  No attendance data available.")
    )
    chunks.append(Document(page_content=attendance_text, metadata={**base_meta, "chunk_type": "attendance"}))

    # ── Chunk 4: Exam History (Past Semesters) ─────────────────────────
    history = details.get("exam_history", [])
    hist_lines = []
    for sem in history:
        s_label = sem.get("semester", "Unknown Sem")
        s_sgpa = sem.get("sgpa", "N/A")
        hist_lines.append(f"  - {s_label}: SGPA {s_sgpa}")

    history_text = (
        f"Previous Exam History — {name} ({usn})\n"
        + ("\n".join(hist_lines) if hist_lines else "  No past history available.")
    )
    chunks.append(Document(page_content=history_text, metadata={**base_meta, "chunk_type": "history"}))

    # ── Chunk 5: Conduct & Remarks ─────────────────────────────────────
    remarks = details.get("remarks", "None")
    conduct_text = (
        f"Conduct & Proctor Remarks — {name} ({usn})\n"
        f"General Remarks: {remarks}\n"
    )
    chunks.append(Document(page_content=conduct_text, metadata={**base_meta, "chunk_type": "conduct"}))

    # ── Chunk 6: Catch-all for other info ──────────────────────────
    known_keys = {"subjects", "exam_history", "cgpa", "class_details", "remarks"}
    leftover = {k: v for k, v in details.items() if k not in known_keys}
    if leftover:
        misc_text = (
            f"Miscellaneous Details — {name} ({usn})\n"
            + "\n".join([f"{k}: {v}" for k, v in leftover.items()])
        )
        chunks.append(Document(page_content=misc_text, metadata={**base_meta, "chunk_type": "misc"}))

    return chunks


CHUNK_KEYWORDS: Dict[str, List[str]] = {
    "academics":  [
        "marks", "grade", "backlog", "fail", "score", "performance", "result", 
        "internal", "test", "t1", "t2", "t3", "t4", "assignment", "quiz", 
        "aq1", "aq2", "aq3", "obtained", "pass", "subject", "courses"
    ],
    "attendance": [
        "attendance", "absent", "present", "shortage", "bunk", "percentage", 
        "pct", "classes", "missed", "held", "regular", "irregular", "attendance details"
    ],
    "history":    [
        "sgpa", "cgpa", "history", "past", "previous", "semester", "sem", 
        "overall", "total", "credits", "gpa", "academic record", "exam history"
    ],
    "conduct":    [
        "warning", "counsell", "conduct", "remark", "behav", "issue", 
        "notes", "proctor", "meeting", "discipline", "attitude", "character"
    ],
    "identity":   [
        "who is", "about", "details", "branch", "section", "usn", "identity", 
        "year", "contact", "phone", "email", "student", "person", "profile", "class"
    ],
}

def detect_chunk_types(question: str) -> List[str]:
    """Returns the chunk_types most relevant to the question (empty = search all)."""
    q = question.lower()
    matched = [ctype for ctype, kws in CHUNK_KEYWORDS.items() if any(kw in q for kw in kws)]
    return matched if matched else []
