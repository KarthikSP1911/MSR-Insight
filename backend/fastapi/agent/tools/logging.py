"""Writes every tool call to agent_action_log for audit purposes.

Not to be confused with Python's logging module (imported as py_logging here to
avoid the name clash, since this module is itself called `logging`).
"""
import json
import logging as py_logging

from ..db import get_connection
from ..ids import thread_id_for

logger = py_logging.getLogger(__name__)


def log_action(
    proctor_id: str,
    action_type: str,
    status: str,
    student_usn: str | None = None,
    payload: dict | None = None,
    result: dict | None = None,
    mark_executed: bool = True,
) -> None:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO agent_action_log
                (proctor_id, thread_id, action_type, status, student_usn, payload, result, executed_at)
            VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, CASE WHEN %s THEN now() ELSE NULL END)
            """,
            (
                proctor_id,
                thread_id_for(proctor_id),
                action_type,
                status,
                student_usn,
                json.dumps(payload or {}),
                json.dumps(result) if result is not None else None,
                mark_executed,
            ),
        )
        conn.commit()
    except Exception:
        logger.exception("Failed to write agent_action_log row for action_type=%s", action_type)
        conn.rollback()
    finally:
        conn.close()
