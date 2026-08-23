import os
import threading
import logging
from typing import List
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnableLambda

from app.core.config import settings
from app.repositories.vector_repository import build_vector_store
from .db_sync import fetch_and_sync_documents
from .retriever import get_ensemble_retriever
from .chunker import detect_chunk_types

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.GEMINI_API_KEY,
        )

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-3.1-flash-lite",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.1,
        )

        self._vector_store = None
        self._is_syncing = False
        self._sync_lock = threading.Lock()
        self._last_sync_time = None
        self._last_sync_result = None
        
        try:
            sample = self.embeddings.embed_query("test")
            logger.info(f"RAG service initialized (embedding dim: {len(sample)})")
        except Exception as e:
            logger.error(f"RAG service initialized with embedding error: {e}")

    @property
    def is_syncing(self):
        return self._is_syncing

    @property
    def vector_store(self):
        if self._vector_store is None:
            logger.info("Initializing PGVector with collection: student_data_v2")
            self._vector_store = build_vector_store(self.embeddings)
        return self._vector_store

    def sync_data(self) -> dict:
        """Fetch all student records from Postgres and upsert chunked docs into VectorStore."""
        if self._is_syncing:
            return {"status": "already_syncing"}

        from datetime import datetime
        with self._sync_lock:
            self._is_syncing = True
            try:
                result = fetch_and_sync_documents(self.vector_store)
                self._last_sync_time = datetime.now().isoformat()
                self._last_sync_result = result
                # Ensure the vector store refreshes its connection on the next access
                self._vector_store = None 
                return result
            except Exception as e:
                self._last_sync_time = datetime.now().isoformat()
                self._last_sync_result = {"status": "error", "message": str(e)}
                raise e
            finally:
                self._is_syncing = False

    def query_chatbot(self, question: str, proctor_id: str) -> str:
        """Answer a question using intent-aware RAG, scoped to the proctor's students."""
        logger.info(f"New chat query from proctor {proctor_id}: {question!r}")

        logger.debug("Rewriting query")
        rewrite_prompt = PromptTemplate.from_template("""
You are a strict text normalizer.
Rules:
1. Correct spelling and grammar ONLY.
2. DO NOT add extra words, explanations, or sentences.
3. DO NOT change meaning.
4. DO NOT answer the question.
5. Output ONLY the corrected query.
Input: {question}
Output: """)
        rewrite_chain = rewrite_prompt | self.llm | StrOutputParser()
        clean_question = rewrite_chain.invoke({"question": question}).strip()
        logger.debug(f"Cleaned question: {clean_question}")

        def format_docs(docs: List[Document]) -> str:
            if not docs:
                return "No relevant student data found."
            seen = set()
            unique_docs = []
            for d in docs:
                key = (d.metadata.get("usn"), d.metadata.get("chunk_type"))
                if key not in seen:
                    seen.add(key)
                    unique_docs.append(d)
            
            logger.debug(f"Retrieved {len(unique_docs)} unique context chunks")
            return "\n\n---\n\n".join(d.page_content for d in unique_docs)

        def get_docs(query: str):
            retriever = get_ensemble_retriever(query, proctor_id, self.vector_store)
            if retriever:
                return retriever.invoke(query)
            return []

        template ="""You are an academic assistant helping a faculty proctor review their students.
Student Data (retrieved):
{context}
Guidelines:
- For greetings or general questions, respond warmly and briefly.
- For student-related questions, answer ONLY from the context above.
- If specific data is missing from the context, say so clearly — do not guess.
- When listing multiple students, use a structured format (e.g., bullet points or a table).
- Keep answers concise, factual, and professional.
Question: {question}
Answer:"""
        prompt = PromptTemplate.from_template(template)

        rag_chain = (
            {
                "context": RunnableLambda(lambda q: format_docs(get_docs(q))),
                "question": RunnablePassthrough()
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )

        logger.debug("Invoking RAG chain")
        response = rag_chain.invoke(clean_question)
        logger.info("Chat query finished")
        return response