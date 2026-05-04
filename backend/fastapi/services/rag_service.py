import os
import json
import psycopg2
from typing import Any, List, Dict
from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

from langchain_core.runnables import RunnableLambda
from config.settings import settings
import logging
import gc
import shutil
import threading

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# CHUNKING STRATEGY
# ─────────────────────────────────────────────
# Each student's JSONB is split into topic-specific chunks:
#
#  Chunk 1 — Identity      → name, USN, year, branch
#  Chunk 2 — Academics     → SGPA, CGPA, backlogs, subject-wise marks
#  Chunk 3 — Attendance    → subject-wise attendance %
#  Chunk 4 — Achievements  → internships, projects, certifications
#  Chunk 5 — Conduct/Misc  → warnings, counselling notes, extra info
#
# Every chunk carries {usn, name, proctor_id, chunk_type} as metadata
# so we can filter and cite sources later.
# ─────────────────────────────────────────────


def _safe_str(val) -> str:
    """Convert any value to a clean string."""
    if val is None:
        return "N/A"
    if isinstance(val, (dict, list)):
        return json.dumps(val, indent=2)
    return str(val)


def build_chunks_for_student(
    usn: str,
    name: str,
    current_year: int,
    details: dict,
    proctor_id: str,
    academic_year: str,
) -> List[Document]:
    """
    Converts one student record into multiple semantically coherent chunks.
    Matches the actual schema: subjects[], exam_history[], cgpa, class_details.
    """
    base_meta = {
        "usn": usn,
        "name": name,
        "proctor_id": proctor_id,
        "academic_year": academic_year,
    }

    chunks: List[Document] = []

    # ── Chunk 1: Identity ──────────────────────────────────────────────
    class_info = details.get("class_details", "N/A")
    identity_text = (
        f"Student Identity — {name} ({usn})\n"
        f"Name: {name}\n"
        f"USN: {usn}\n"
        f"Current Year: {current_year}\n"
        f"Class/Section: {class_info}\n"
        f"Academic Year: {academic_year}\n"
    )
    chunks.append(Document(page_content=identity_text, metadata={**base_meta, "chunk_type": "identity"}))

    # ── Chunk 2: Current Academics & Marks ─────────────────────────────
    subjects = details.get("subjects", [])
    cgpa = details.get("cgpa", "N/A")
    
    marks_lines = []
    for sub in subjects:
        s_name = sub.get("name", "Unknown")
        s_code = sub.get("code", "")
        s_marks = sub.get("marks", 0)
        assessments = sub.get("assessments", [])
        ass_str = ", ".join([f"{a['type']}: {a['obtained_marks']}" for a in assessments if a.get('obtained_marks', 0) > 0])
        marks_lines.append(f"  - {s_name} ({s_code}): Marks {s_marks}/30 | Details: {ass_str if ass_str else 'No T1/T2 recorded'}")

    academics_text = (
        f"Current Academic Marks — {name} ({usn})\n"
        f"Overall CGPA: {cgpa}\n"
        f"Subject-wise Performance (Current):\n"
        + "\n".join(marks_lines) if marks_lines else "  No subject data available."
    )
    chunks.append(Document(page_content=academics_text, metadata={**base_meta, "chunk_type": "academics"}))

    # ── Chunk 3: Attendance ────────────────────────────────────────────
    att_lines = []
    for sub in subjects:
        s_name = sub.get("name", "Unknown")
        s_pct = sub.get("attendance", 0)
        att_det = sub.get("attendance_details", {})
        present = att_det.get("present", 0)
        absent = att_det.get("absent", 0)
        flag = " [⚠ ATTENDANCE SHORTAGE]" if s_pct > 0 and s_pct < 75 else ""
        att_lines.append(f"  - {s_name}: {s_pct}%{flag} (Present: {present}, Absent: {absent})")

    attendance_text = (
        f"Attendance Record — {name} ({usn})\n"
        f"Current Semester Attendance:\n"
        + "\n".join(att_lines) if att_lines else "  No attendance data available."
    )
    chunks.append(Document(page_content=attendance_text, metadata={**base_meta, "chunk_type": "attendance"}))

    # ── Chunk 4: Exam History (Past Semesters) ─────────────────────────
    history = details.get("exam_history", [])
    hist_lines = []
    for sem in history:
        s_label = sem.get("semester", "Unknown Sem")
        s_sgpa = sem.get("sgpa", "N/A")
        hist_lines.append(f"  - {s_label}: SGPA {s_sgpa}")

    history_text = (
        f"Previous Exam History — {name} ({usn})\n"
        + "\n".join(hist_lines) if hist_lines else "  No past history available."
    )
    chunks.append(Document(page_content=history_text, metadata={**base_meta, "chunk_type": "history"}))

    # ── Chunk 5: Conduct & Remarks ─────────────────────────────────────
    remarks = details.get("remarks", "None")
    conduct_text = (
        f"Conduct & Proctor Remarks — {name} ({usn})\n"
        f"General Remarks: {remarks}\n"
    )
    chunks.append(Document(page_content=conduct_text, metadata={**base_meta, "chunk_type": "conduct"}))

    # ── Chunk 6: Catch-all for other info ──────────────────────────
    known_keys = {"subjects", "exam_history", "cgpa", "class_details", "remarks"}
    leftover = {k: v for k, v in details.items() if k not in known_keys}
    if leftover:
        misc_text = (
            f"Miscellaneous Details — {name} ({usn})\n"
            + "\n".join([f"{k}: {v}" for k, v in leftover.items()])
        )
        chunks.append(Document(page_content=misc_text, metadata={**base_meta, "chunk_type": "misc"}))

    return chunks


# ─────────────────────────────────────────────
# INTENT DETECTION (lightweight, no extra LLM call)
# ─────────────────────────────────────────────

CHUNK_KEYWORDS: Dict[str, List[str]] = {
    "academics":  [
        "marks", "grade", "backlog", "fail", "score", "performance", "result", 
        "internal", "test", "t1", "t2", "t3", "t4", "assignment", "quiz", 
        "aq1", "aq2", "aq3", "obtained", "pass", "subject", "courses"
    ],
    "attendance": [
        "attendance", "absent", "present", "shortage", "bunk", "percentage", 
        "pct", "classes", "missed", "held", "regular", "irregular", "attendance details"
    ],
    "history":    [
        "sgpa", "cgpa", "history", "past", "previous", "semester", "sem", 
        "overall", "total", "credits", "gpa", "academic record", "exam history"
    ],
    "conduct":    [
        "warning", "counsell", "conduct", "remark", "behav", "issue", 
        "notes", "proctor", "meeting", "discipline", "attitude", "character"
    ],
    "identity":   [
        "who is", "about", "details", "branch", "section", "usn", "identity", 
        "year", "contact", "phone", "email", "student", "person", "profile", "class"
    ],
}

def detect_chunk_types(question: str) -> List[str]:
    """Returns the chunk_types most relevant to the question (empty = search all)."""
    q = question.lower()
    matched = [ctype for ctype, kws in CHUNK_KEYWORDS.items() if any(kw in q for kw in kws)]
    return matched if matched else []  # empty → no filter → search everything


# ─────────────────────────────────────────────
# RAG SERVICE
# ─────────────────────────────────────────────

class RAGService:
    def __init__(self):
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.GEMINI_API_KEY,
        )

        base_url = settings.OLLAMA_API_URL
        if base_url.endswith("/api/generate"):
            base_url = base_url.replace("/api/generate", "")

        # Local Ollama Embedding Model
        # self.embeddings = OllamaEmbeddings(
        #     model="qwen3-embedding:0.6b",
        #     base_url=base_url
        # )

        # self.llm = ChatOllama(
        #     model=settings.OLLAMA_MODEL,
        #     base_url=base_url,
        #     temperature=0.1 # Stop immediately if it starts reasoning
        # )

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-3.1-flash-lite-preview",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.1,          # more factual for academic queries
        )

        self._vector_store = None
        self._is_syncing = False
        self._sync_lock = threading.Lock()
        self._last_sync_time = None
        self._last_sync_result = None
        
        # DEBUG: Verify embeddings
        try:
            sample = self.embeddings.embed_query("test")
            print(f"--- RAG Service Initialized (Embedding Dim: {len(sample)}) ---")
        except Exception as e:
            print(f"--- RAG Service Initialized (Embedding Error: {e}) ---")

    @property
    def is_syncing(self):
        return self._is_syncing

    @property
    def vector_store(self):
        if self._vector_store is None:
            print(f"Initializing ChromaDB with collection: student_data_v2")
            self._vector_store = Chroma(
                collection_name="student_data_v2",
                embedding_function=self.embeddings,
                persist_directory=settings.CHROMA_PERSIST_DIR,
            )
        return self._vector_store

    # ──────────────────────────────────────────
    # SYNC
    # ──────────────────────────────────────────

    def sync_data(self) -> dict:
        """Fetch all student records from Postgres and upsert chunked docs into ChromaDB."""
        if self._is_syncing:
            print("--- Sync already in progress, skipping ---")
            return {"status": "already_syncing"}

        with self._sync_lock:
            self._is_syncing = True
            try:
                print("\n--- Starting Data Sync ---")
                if not settings.DATABASE_URL:
                    raise ValueError("DATABASE_URL is not set.")

                conn = psycopg2.connect(settings.DATABASE_URL)
                cursor = conn.cursor()
                print(f"Connected to Database: {settings.DATABASE_URL.split('@')[1].split('/')[0]}")

                cursor.execute("""
                    SELECT s.usn, s.name, s.current_year, s.details,
                           p.proctor_id, p.academic_year
                    FROM students s
                    JOIN proctor_student_map p ON s.usn = p.student_id
                """)
                rows = cursor.fetchall()
                print(f"Fetched {len(rows)} student records from Postgres")
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
                
                print(f"Generated {len(all_documents)} total chunks")

                if all_documents:
                    print("Updating Vector Store (ChromaDB)...")
                    
                    try:
                        # Try to clear existing data
                        try:
                            existing_data = self.vector_store.get()
                            if existing_data and existing_data['ids']:
                                print(f"Clearing {len(existing_data['ids'])} existing chunks...")
                                self.vector_store.delete(ids=existing_data['ids'])
                        except Exception:
                            pass # Might be new or incompatible

                        # Add new documents
                        self.vector_store.add_documents(all_documents)
                    except Exception as e:
                        # If dimension mismatch (e.g. switching from Gemini to Ollama)
                        if "dimension" in str(e).lower():
                            print(f"Dimension mismatch detected ({e}). Resetting ChromaDB...")
                            self._vector_store = None
                            if os.path.exists(settings.CHROMA_PERSIST_DIR):
                                import shutil
                                shutil.rmtree(settings.CHROMA_PERSIST_DIR)
                            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
                            # Re-add to a fresh store
                            self.vector_store.add_documents(all_documents)
                        else:
                            raise e

                from datetime import datetime
                self._last_sync_time = datetime.now().isoformat()
                self._last_sync_result = {
                    "students": len(rows),
                    "chunks": len(all_documents),
                    "timestamp": self._last_sync_time
                }
                print("--- Sync Completed Successfully ---")
                logger.info(f"Synced {len(rows)} students → {len(all_documents)} chunks")
                return {
                    "status": "success",
                    **self._last_sync_result
                }

            except Exception as e:
                logger.exception("sync_data failed")
                raise RuntimeError(f"Failed to sync data: {e}")
            finally:
                self._is_syncing = False

    # ──────────────────────────────────────────
    # QUERY
    # ──────────────────────────────────────────

    def query_chatbot(self, question: str, proctor_id: str) -> str:
        """Answer a question using intent-aware RAG, scoped to the proctor's students."""
        print(f"\n--- New Chat Query ---")
        print(f"Original Question: {question}")
        print(f"Proctor ID: {proctor_id}")

        # 1. Query Rewriting to fix spelling/grammar
        print("Rewriting query...")
        rewrite_prompt = PromptTemplate.from_template("""
You are a strict text normalizer.

Rules:
1. Correct spelling and grammar ONLY.
2. DO NOT add extra words, explanations, or sentences.
3. DO NOT change meaning.
4. DO NOT answer the question.
5. Output ONLY the corrected query.

Input:
{question}

Output:
""")
        rewrite_chain = rewrite_prompt | self.llm | StrOutputParser()
        clean_question = rewrite_chain.invoke({"question": question}).strip()
        print(f"Cleaned Question: {clean_question}")

        chunk_types = detect_chunk_types(clean_question)
        print(f"Detected Intent(s): {chunk_types if chunk_types else 'General'}")

        def get_docs(query: str) -> List[Document]:
            print(f"Retrieving documents for query: {query}...")
            
            retriever_list = []
            weights = []

            # 2. Fetch all docs for this proctor for BM25
            try:
                collection_data = self.vector_store.get(where={"proctor_id": proctor_id})
                if collection_data and collection_data['documents']:
                    all_proctor_docs = [
                        Document(page_content=doc, metadata=meta)
                        for doc, meta in zip(collection_data['documents'], collection_data['metadatas'])
                    ]
                    
                    bm25_retriever = BM25Retriever.from_documents(all_proctor_docs)
                    bm25_retriever.k = 5
                    retriever_list.append(bm25_retriever)
                    weights.append(0.3)  # Weight for BM25
                    print(f"Added BM25 Retriever with {len(all_proctor_docs)} proctor documents.")
            except Exception as e:
                print(f"Error setting up BM25 Retriever: {e}")

            # 3. Setup Semantic Retrievers
            if chunk_types:
                for ctype in chunk_types:
                    semantic_retriever = self.vector_store.as_retriever(
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
                    # Distribute the remaining weight among semantic chunk intents
                    weights.append(0.7 / len(chunk_types))
            else:
                semantic_retriever = self.vector_store.as_retriever(
                    search_type="similarity",
                    search_kwargs={
                        "k": 5,
                        "filter": {"proctor_id": {"$eq": proctor_id}},
                    },
                )
                retriever_list.append(semantic_retriever)
                weights.append(0.7)

            # 4. Ensemble them
            if len(retriever_list) > 1:
                total_w = sum(weights)
                norm_weights = [w / total_w for w in weights]
                ensemble = EnsembleRetriever(
                    retrievers=retriever_list,
                    weights=norm_weights,
                )
                return ensemble.invoke(query)
            elif len(retriever_list) == 1:
                return retriever_list[0].invoke(query)
            else:
                return []


        # ── Prompt ────────────────────────────────────────────────────
        print("Constructing RAG Chain...")
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

        def format_docs(docs: List[Document]) -> str:
            if not docs:
                return "No relevant student data found."
            seen = set()
            unique_docs = []
            for d in docs:
                # Deduplicate by (usn, chunk_type)
                key = (d.metadata.get("usn"), d.metadata.get("chunk_type"))
                if key not in seen:
                    seen.add(key)
                    unique_docs.append(d)
            
            print(f"Retrieved {len(unique_docs)} unique context chunks")
            return "\n\n---\n\n".join(d.page_content for d in unique_docs)

        # ── RAG Chain (LCEL Format) ───────────────────────────────────
        def log_prompt(p):
            print("\n=== FINAL PROMPT TO LLM ===")
            print(p.to_string())
            print("===========================\n")
            return p

        rag_chain = (
            {
                "context": RunnableLambda(lambda q: format_docs(get_docs(q))),
                "question": RunnablePassthrough()
            }
            | prompt
            | RunnableLambda(log_prompt)
            | self.llm
            | StrOutputParser()
        )

        print("Invoking RAG Chain...")
        response = rag_chain.invoke(clean_question)
        print("--- Query Finished ---")
        return response