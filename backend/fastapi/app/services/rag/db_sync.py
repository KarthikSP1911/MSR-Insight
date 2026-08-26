import json
import psycopg2
import logging
from datetime import datetime
from typing import List, Dict, Any
from langchain_core.documents import Document
from app.core.config import settings
from .chunker import build_chunks_for_student

logger = logging.getLogger(__name__)

def fetch_and_sync_documents(vector_store) -> Dict[str, Any]:
    """Fetch all student records from Postgres and upsert chunked docs into VectorStore."""
    try:
        logger.info("Starting data sync")
        if not settings.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set.")

        conn = psycopg2.connect(settings.DATABASE_URL)
        cursor = conn.cursor()
        logger.info(f"Connected to database: {settings.DATABASE_URL.split('@')[1].split('/')[0]}")

        cursor.execute("""
            SELECT s.usn, s.name, s.current_year, s.details,
                   p.proctor_id, p.academic_year
            FROM students s
            JOIN proctor_student_map p ON s.usn = p.student_id
        """)
        rows = cursor.fetchall()
        logger.info(f"Fetched {len(rows)} student records from Postgres")
        cursor.close()
        conn.close()

        all_documents: List[Document] = []
        for usn, name, current_year, details, proctor_id, academic_year in rows:
            if isinstance(details, str):
                details = json.loads(details)

            student_chunks = build_chunks_for_student(
                usn, name, current_year, details, proctor_id, academic_year
            )
            all_documents.extend(student_chunks)

        logger.info(f"Generated {len(all_documents)} total chunks")

        if all_documents:
            logger.info("Updating vector store (Chroma Cloud)")
            try:
                logger.debug("Resetting Chroma collection for a clean sync")
                vector_store.reset_collection()
            except Exception as e:
                logger.warning(f"Could not reset collection (might not exist yet): {e}")

            try:
                vector_store.add_documents(all_documents)
            except Exception as e:
                logger.error(f"Error adding documents to Chroma: {e}")
                raise e

        sync_time = datetime.now().isoformat()
        result = {
            "status": "success",
            "students": len(rows),
            "chunks": len(all_documents),
            "timestamp": sync_time
        }

        logger.info(f"Sync completed successfully: {len(rows)} students -> {len(all_documents)} chunks")
        return result

    except Exception as e:
        logger.exception("sync_data failed")
        raise RuntimeError(f"Failed to sync data: {e}")
