"""Reminder tools. Internal-only records (no outside party is contacted), so
these auto-execute like the read-only tools -- no proctor confirmation needed."""
import json
from datetime import datetime
from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState

from ..state import AgentState
from ..db import get_connection, is_proctor_owner_of_student
from .logging import log_action


@tool
def create_reminder(title: str, due_date: str, state: Annotated[AgentState, InjectedState], usn: str | None = None) -> str:
    """Create a reminder for the proctor, e.g. 'follow up with a student's
    parent next week'. `due_date` must be an ISO date (YYYY-MM-DD). `usn` is
    optional -- include it only if the reminder is about one of your specific
    students (it will be checked against your assigned students)."""
    proctor_id = state["proctor_id"]

    if usn and not is_proctor_owner_of_student(proctor_id, usn):
        log_action(proctor_id, "create_reminder", "failed", student_usn=usn,
                    payload={"title": title, "due_date": due_date, "usn": usn},
                    result={"error": "not_authorized"})
        return f"Not authorized: {usn} is not one of your assigned students."

    try:
        parsed_due = datetime.fromisoformat(due_date)
    except ValueError:
        return "due_date must be an ISO date, e.g. 2026-09-01."

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO agent_reminders (proctor_id, student_usn, title, due_date) VALUES (%s, %s, %s, %s) RETURNING id",
            (proctor_id, usn, title, parsed_due),
        )
        reminder_id = cur.fetchone()[0]
        conn.commit()
    finally:
        conn.close()

    log_action(proctor_id, "create_reminder", "completed", student_usn=usn,
                payload={"title": title, "due_date": due_date}, result={"reminder_id": reminder_id})
    return f"Reminder created: \"{title}\" due {due_date}."


@tool
def list_reminders(state: Annotated[AgentState, InjectedState]) -> str:
    """List the proctor's pending reminders."""
    proctor_id = state["proctor_id"]
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT title, due_date, student_usn FROM agent_reminders WHERE proctor_id = %s AND status = 'pending' ORDER BY due_date",
            (proctor_id,),
        )
        rows = cur.fetchall()
    finally:
        conn.close()

    log_action(proctor_id, "list_reminders", "completed", result={"count": len(rows)})

    if not rows:
        return "You have no pending reminders."
    lines = [f"- {title} (due {due_date.date()})" + (f" -- re: {usn}" if usn else "") for title, due_date, usn in rows]
    return "Pending reminders:\n" + "\n".join(lines)
