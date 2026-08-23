"""Student lookup tools.

Reads Student.details JSONB directly (own queries, not imported from RAG's
chunker.py) using the same field shape: subjects[] (name, code, marks,
attendance, attendance_details), cgpa, exam_history[] (semester, sgpa),
class_details, remarks, placement.
"""
import json
from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState

from ..state import AgentState
from app.repositories.agent_repository import get_connection, is_proctor_owner_of_student
from .logging import log_action


def _load_student_row(usn: str):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT usn, name, current_year, details FROM students WHERE usn = %s", (usn,))
        row = cur.fetchone()
        if not row:
            return None
        usn, name, current_year, details = row
        if isinstance(details, str):
            details = json.loads(details)
        return {"usn": usn, "name": name, "current_year": current_year, "details": details or {}}
    finally:
        conn.close()


@tool
def get_student_profile(usn: str, state: Annotated[AgentState, InjectedState]) -> str:
    """Look up one student's full profile: CGPA, subject-wise marks and
    attendance, past-semester SGPA history, and proctor remarks. Use this when
    the proctor asks about a specific student by name or USN. `usn` must be a
    real USN you learned from list_proctor_students or the conversation -- never
    guess one."""
    proctor_id = state["proctor_id"]
    cid = state.get("conversation_id")
    if not is_proctor_owner_of_student(proctor_id, usn):
        log_action(proctor_id, "get_student_profile", "failed", student_usn=usn, payload={"usn": usn},
                    result={"error": "not_authorized"}, conversation_id=cid)
        return f"Not authorized: {usn} is not one of your assigned students."

    student = _load_student_row(usn)
    if not student:
        log_action(proctor_id, "get_student_profile", "failed", student_usn=usn, payload={"usn": usn},
                    result={"error": "not_found"}, conversation_id=cid)
        return f"No student record found for {usn}."

    details = student["details"]
    subjects = details.get("subjects", [])
    subject_lines = []
    for s in subjects:
        # A subject with no classes held yet (e.g. Mini Project, Physical
        # Education early in the semester) has present=absent=0, which is
        # stored as 0% attendance -- indistinguishable from missing every
        # class unless we check the held-class count. Treat 0 held classes
        # as 100% (nothing missed) rather than showing a misleading 0%.
        ad = s.get("attendance_details") or {}
        held = (ad.get("present") or 0) + (ad.get("absent") or 0)
        att = s.get("attendance", 0) if held > 0 else 100
        flag = " (LOW ATTENDANCE)" if held > 0 and isinstance(att, (int, float)) and att < 75 else ""
        subject_lines.append(f"- {s.get('name', 'Unknown')} ({s.get('code', '')}): marks={s.get('marks', 'N/A')}, attendance={att}%{flag}")

    exam_history = details.get("exam_history", [])
    history_lines = [f"- {sem.get('semester', 'Unknown')}: SGPA {sem.get('sgpa', 'N/A')}" for sem in exam_history]

    summary = (
        f"Student: {student['name']} ({student['usn']}), Year {student['current_year']}\n"
        f"CGPA: {details.get('cgpa', 'N/A')}\n"
        f"Subjects:\n" + ("\n".join(subject_lines) if subject_lines else "  No subject data.") + "\n"
        f"Past semester SGPA history:\n" + ("\n".join(history_lines) if history_lines else "  No history.") + "\n"
        f"Proctor remarks: {details.get('remarks', 'None')}"
    )

    log_action(proctor_id, "get_student_profile", "completed", student_usn=usn, payload={"usn": usn}, conversation_id=cid)
    return summary


@tool
def list_proctor_students(state: Annotated[AgentState, InjectedState]) -> str:
    """List all students currently assigned to the requesting proctor, with
    their name, year, and CGPA. Use this first when the proctor asks something
    about "my students" in general, or when you need a USN and don't have one
    yet."""
    proctor_id = state["proctor_id"]
    cid = state.get("conversation_id")
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT s.usn, s.name, s.current_year, s.details
            FROM students s
            JOIN proctor_student_map p ON s.usn = p.student_id
            WHERE p.proctor_id = %s
            ORDER BY s.name
            """,
            (proctor_id,),
        )
        rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        log_action(proctor_id, "list_proctor_students", "completed", result={"count": 0}, conversation_id=cid)
        return "You have no students currently assigned."

    lines = []
    for usn, name, current_year, details in rows:
        if isinstance(details, str):
            details = json.loads(details)
        cgpa = (details or {}).get("cgpa", "N/A")
        lines.append(f"- {name} ({usn}), Year {current_year}, CGPA {cgpa}")

    log_action(proctor_id, "list_proctor_students", "completed", result={"count": len(rows)}, conversation_id=cid)
    return "Your assigned students:\n" + "\n".join(lines)
