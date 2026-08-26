"""Chroma Cloud connection/setup for the RAG chatbot's vector store.

Pulled out of the RAG service so connection handling and store construction
(a data-access concern) live separately from the service's business logic
(sync orchestration, retrieval chains). This is a managed, persistent cloud
store -- a separate service from Postgres/Neon, not an embedded/on-disk store.
"""
from langchain_chroma import Chroma
from app.core.config import settings

COLLECTION_NAME = "student_data_v2"


def build_vector_store(embeddings) -> Chroma:
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        chroma_cloud_api_key=settings.CHROMA_API_KEY,
        tenant=settings.CHROMA_TENANT,
        database=settings.CHROMA_DATABASE,
    )
