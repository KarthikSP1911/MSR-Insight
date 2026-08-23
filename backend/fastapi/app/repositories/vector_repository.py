"""Raw PGVector connection/setup for the RAG chatbot's vector store.

Pulled out of the RAG service so connection-string handling and store
construction (a data-access concern) live separately from the service's
business logic (sync orchestration, retrieval chains).
"""
from langchain_postgres.vectorstores import PGVector
from app.core.config import settings

COLLECTION_NAME = "student_data_v2"


def build_vector_store(embeddings) -> PGVector:
    db_url = settings.DATABASE_URL
    if db_url and db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    return PGVector(
        connection=db_url,
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        use_jsonb=True,
    )
