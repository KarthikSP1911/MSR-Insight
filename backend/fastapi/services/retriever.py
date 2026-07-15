import psycopg2
import json
from typing import List
from langchain_core.documents import Document
from langchain_classic.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from config.settings import settings
from .chunker import detect_chunk_types, build_chunks_for_student

def get_ensemble_retriever(query: str, proctor_id: str, vector_store) -> EnsembleRetriever:
    """Gets an ensemble retriever combining PGVector (Semantic) and BM25 (Keyword)."""
    print(f"Retrieving documents for query: {query}...")
    
    chunk_types = detect_chunk_types(query)
    retriever_list = []
    weights = []

    # 1. Fetch all docs for this proctor directly from Postgres for BM25
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.usn, s.name, s.current_year, s.details,
                   p.proctor_id, p.academic_year
            FROM students s
            JOIN proctor_student_map p ON s.usn = p.student_id
            WHERE p.proctor_id = %s
        """, (proctor_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        all_proctor_docs = []
        for usn, name, current_year, details, p_id, academic_year in rows:
            if isinstance(details, str):
                details = json.loads(details)
            student_chunks = build_chunks_for_student(
                usn, name, current_year, details, p_id, academic_year
            )
            all_proctor_docs.extend(student_chunks)

        if all_proctor_docs:
            bm25_retriever = BM25Retriever.from_documents(all_proctor_docs)
            bm25_retriever.k = 5
            retriever_list.append(bm25_retriever)
            weights.append(0.3)  # Weight for BM25
            print(f"Added BM25 Retriever with {len(all_proctor_docs)} proctor documents.")
    except Exception as e:
        print(f"Error setting up BM25 Retriever: {e}")

    # 2. Setup Semantic Retrievers
    if chunk_types:
        for ctype in chunk_types:
            semantic_retriever = vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={
                    "k": 5,
                    "filter": {"$and": [
                        {"proctor_id": {"$eq": proctor_id}},
                        {"chunk_type": {"$eq": ctype}},
                    ]},
                },
            )
            retriever_list.append(semantic_retriever)
            weights.append(0.7 / len(chunk_types))
    else:
        semantic_retriever = vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 5,
                "filter": {"proctor_id": {"$eq": proctor_id}},
            },
        )
        retriever_list.append(semantic_retriever)
        weights.append(0.7)

    # 3. Ensemble them
    if len(retriever_list) > 1:
        total_w = sum(weights)
        norm_weights = [w / total_w for w in weights]
        return EnsembleRetriever(
            retrievers=retriever_list,
            weights=norm_weights,
        )
    elif len(retriever_list) == 1:
        return retriever_list[0]
    
    return None
