"""At-risk student analysis. Scoped entirely to the requesting proctor's
students (no usn argument, no way for the LLM to point this at anyone else's
students)."""
import json
import math
from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState

from ..state import AgentState
from app.repositories.agent_repository import get_connection, is_proctor_owner_of_student
from .logging import log_action
from .student_tools import _load_student_row

CGPA_RISK_THRESHOLD = 6.0
ATTENDANCE_RISK_THRESHOLD = 75
SGPA_DROP_THRESHOLD = 1.0


def _fetch_proctor_students(proctor_id: str):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT s.usn, s.name, s.details
            FROM students s
            JOIN proctor_student_map p ON s.usn = p.student_id
            WHERE p.proctor_id = %s
            """,
            (proctor_id,),
        )
        rows = cur.fetchall()
    finally:
        conn.close()

    students = []
    for usn, name, details in rows:
        if isinstance(details, str):
            details = json.loads(details)
        students.append({"usn": usn, "name": name, "details": details or {}})
    return students


def _existing_unresolved_risk_types(conn, usn: str, proctor_id: str) -> set:
    cur = conn.cursor()
    cur.execute(
        "SELECT risk_type FROM agent_alerts WHERE student_usn = %s AND proctor_id = %s AND resolved = false",
        (usn, proctor_id),
    )
    return {row[0] for row in cur.fetchall()}


def _insert_alert(conn, usn, proctor_id, risk_type, severity, evidence, message):
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO agent_alerts (student_usn, proctor_id, risk_type, severity, evidence, message)
        VALUES (%s, %s, %s, %s, %s::jsonb, %s)
        """,
        (usn, proctor_id, risk_type, severity, json.dumps(evidence), message),
    )


def compute_risks(student: dict) -> list[dict]:
    """Pure function: student dict -> list of risk findings. Kept separate from
    DB/tool wiring so it's easy to unit test and reuse from insight_tools."""
    details = student["details"]
    findings = []

    subjects = details.get("subjects", [])
    low_attendance = [
        {"subject": s.get("name"), "attendance": s.get("attendance")}
        for s in subjects
        if isinstance(s.get("attendance"), (int, float)) and 0 < s["attendance"] < ATTENDANCE_RISK_THRESHOLD
    ]
    if low_attendance:
        severity = "high" if any(s["attendance"] < 65 for s in low_attendance) else "medium"
        findings.append({
            "risk_type": "attendance",
            "severity": severity,
            "evidence": {"low_attendance_subjects": low_attendance},
            "message": f"Attendance below {ATTENDANCE_RISK_THRESHOLD}% in {len(low_attendance)} subject(s): "
                       + ", ".join(f"{s['subject']} ({s['attendance']}%)" for s in low_attendance),
        })

    cgpa = details.get("cgpa")
    if isinstance(cgpa, (int, float)) and cgpa < CGPA_RISK_THRESHOLD:
        findings.append({
            "risk_type": "cgpa",
            "severity": "high" if cgpa < 5.0 else "medium",
            "evidence": {"cgpa": cgpa, "threshold": CGPA_RISK_THRESHOLD},
            "message": f"CGPA {cgpa} is below the {CGPA_RISK_THRESHOLD} risk threshold.",
        })

    exam_history = details.get("exam_history", [])
    if len(exam_history) >= 2:
        prev_sgpa = exam_history[-2].get("sgpa")
        last_sgpa = exam_history[-1].get("sgpa")
        if isinstance(prev_sgpa, (int, float)) and isinstance(last_sgpa, (int, float)):
            drop = prev_sgpa - last_sgpa
            if drop >= SGPA_DROP_THRESHOLD:
                findings.append({
                    "risk_type": "sgpa_drop",
                    "severity": "high" if drop >= 2.0 else "medium",
                    "evidence": {
                        "previous_semester": exam_history[-2].get("semester"), "previous_sgpa": prev_sgpa,
                        "latest_semester": exam_history[-1].get("semester"), "latest_sgpa": last_sgpa,
                    },
                    "message": f"SGPA dropped from {prev_sgpa} ({exam_history[-2].get('semester')}) to "
                               f"{last_sgpa} ({exam_history[-1].get('semester')}).",
                })

    return findings


@tool
def analyze_at_risk_students(state: Annotated[AgentState, InjectedState]) -> str:
    """Analyze all of the requesting proctor's students for risk signals:
    attendance shortage (<75% in any subject), low CGPA, or a significant SGPA
    drop between the last two semesters. Returns evidence for each finding and
    records new alerts. Use this when the proctor asks who is at risk, who
    needs attention, or similar."""
    proctor_id = state["proctor_id"]
    students = _fetch_proctor_students(proctor_id)

    conn = get_connection()
    at_risk = []
    try:
        for student in students:
            findings = compute_risks(student)
            if not findings:
                continue
            existing = _existing_unresolved_risk_types(conn, student["usn"], proctor_id)
            for f in findings:
                if f["risk_type"] not in existing:
                    _insert_alert(conn, student["usn"], proctor_id, f["risk_type"], f["severity"], f["evidence"], f["message"])
            at_risk.append({"usn": student["usn"], "name": student["name"], "findings": findings})
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    log_action(proctor_id, "risk_analysis", "completed", result={"at_risk_count": len(at_risk)})

    if not at_risk:
        return "No students currently show attendance, CGPA, or SGPA-drop risk signals."

    lines = [f"{len(at_risk)} student(s) flagged as at risk:"]
    for entry in at_risk:
        lines.append(f"\n{entry['name']} ({entry['usn']}):")
        for f in entry["findings"]:
            lines.append(f"  - [{f['severity'].upper()}] {f['message']}")
    return "\n".join(lines)


@tool
def calculate_attendance_recovery(usn: str, subject_code: str, state: Annotated[AgentState, InjectedState]) -> str:
    """Calculate the minimum number of additional classes a student must
    attend, out of the classes remaining in a specific subject, to reach 75%
    overall attendance in that subject. `usn` and `subject_code` must be real
    values you already learned (e.g. via get_student_profile) -- never guess
    them. If even attending every remaining class can't reach 75%, say so
    explicitly rather than returning a number that implies otherwise."""
    proctor_id = state["proctor_id"]
    if not is_proctor_owner_of_student(proctor_id, usn):
        return f"Not authorized: {usn} is not one of your assigned students."

    student = _load_student_row(usn)
    if not student:
        return f"No student record found for {usn}."

    subjects = student["details"].get("subjects", [])
    subject = next((s for s in subjects if s.get("code") == subject_code), None)
    if not subject:
        return f"No subject with code {subject_code} found for {usn}."

    ad = subject.get("attendance_details") or {}
    present = ad.get("present")
    absent = ad.get("absent")
    remaining = ad.get("remaining")
    if not all(isinstance(v, (int, float)) for v in (present, absent, remaining)):
        return f"Attendance breakdown (present/absent/remaining) is not available for {subject.get('name', subject_code)}."

    total = present + absent + remaining
    if total <= 0:
        return f"No classes recorded yet for {subject.get('name', subject_code)}."

    needed = 0.75 * total - present
    max_possible = (present + remaining) / total * 100

    if needed <= 0:
        return f"{subject.get('name', subject_code)}: already at or above 75% attendance."

    if needed > remaining:
        return (
            f"{subject.get('name', subject_code)}: even attending all {remaining} remaining classes only "
            f"reaches {max_possible:.1f}%, which is below the 75% requirement. 75% is not achievable this semester."
        )

    classes_needed = math.ceil(needed)
    return (
        f"{subject.get('name', subject_code)}: must attend at least {classes_needed} of the remaining "
        f"{remaining} class(es) to reach 75% attendance."
    )
