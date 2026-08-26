"""LangGraph persistent state for the Agentic AI chatbot.

Uses its own connection pool + tables (checkpoints, checkpoint_writes,
checkpoint_blobs) managed entirely by langgraph-checkpoint-postgres — separate
from Prisma's tables, but the same Postgres/Neon instance. The RAG chatbot's
vector store lives in Chroma Cloud, a different service entirely.
"""
import logging
from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver
from app.core.config import settings

logger = logging.getLogger(__name__)

_pool: ConnectionPool | None = None
_checkpointer: PostgresSaver | None = None


def get_checkpointer() -> PostgresSaver:
    global _pool, _checkpointer
    if _checkpointer is None:
        if not settings.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set.")
        _pool = ConnectionPool(
            conninfo=settings.DATABASE_URL,
            max_size=10,
            kwargs={"autocommit": True, "prepare_threshold": 0},
        )
        _checkpointer = PostgresSaver(_pool)
        _checkpointer.setup()
        logger.info("Agent checkpointer initialized (Postgres-backed).")
    return _checkpointer
