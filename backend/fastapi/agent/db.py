"""Raw Postgres access for the Agentic AI chatbot.

Deliberately independent from the RAG chatbot's DB access (services/db_sync.py) —
no shared connection helper, so the two systems can evolve without coupling.
"""
import psycopg2
from config.settings import settings


def get_connection():
    if not settings.DATABASE_URL:
        raise ValueError("DATABASE_URL is not set.")
    return psycopg2.connect(settings.DATABASE_URL)


def is_proctor_owner_of_student(proctor_id: str, usn: str) -> bool:
    """The authorization check every student-touching tool must call before acting.
    Never trust a USN supplied by the LLM — always verify against proctor_student_map."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM proctor_student_map WHERE proctor_id = %s AND student_id = %s LIMIT 1",
            (proctor_id, usn),
        )
        return cur.fetchone() is not None
    finally:
        conn.close()
