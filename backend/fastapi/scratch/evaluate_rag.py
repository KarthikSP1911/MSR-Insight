import sys
import os
import json
import psycopg2
import traceback
from typing import List, Dict, Any

# Add base folder to import services
sys.path.append(os.getcwd())

from config.settings import settings
from services.rag_service import RAGService, build_chunks_for_student, detect_chunk_types
from langchain_core.documents import Document
from langchain_community.retrievers import BM25Retriever
from langchain_classic.retrievers import EnsembleRetriever
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

class RAGEvaluator:
    def __init__(self):
        print("Initializing RAG Evaluator...")
        self.service = RAGService()
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-3.1-flash-lite-preview",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.0
        )
        self.judge_llm = ChatGoogleGenerativeAI(
            model="gemini-3.1-flash-lite-preview",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.0
        )

    def get_ground_truth(self, proctor_id: str) -> str:
        """Fetch all raw Postgres records for this proctor to give the judge as Ground Truth."""
        try:
            conn = psycopg2.connect(settings.DATABASE_URL)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT s.usn, s.name, s.current_year, s.details, p.academic_year
                FROM students s
                JOIN proctor_student_map p ON s.usn = p.student_id
                WHERE p.proctor_id = %s
            """, (proctor_id,))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            ground_truth = []
            for r in rows:
                details = r[3]
                if isinstance(details, str):
                    details = json.loads(details)
                ground_truth.append({
                    "usn": r[0],
                    "name": r[1],
                    "current_year": r[2],
                    "academic_year": r[4],
                    "details": details
                })
            return json.dumps(ground_truth, indent=2)
        except Exception as e:
            return f"Error fetching ground truth: {e}"

    # ──────────────────────────────────────────────────────────
    # SETUP A: Baseline Vector Search (No metadata filters, no BM25)
    # ──────────────────────────────────────────────────────────
    def run_setup_a(self, question: str, proctor_id: str) -> tuple:
        # Standard dense retrieval across all students in DB
        retriever = self.service.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        docs = retriever.invoke(question)
        
        # Grounded generation prompt
        template = """You are an academic assistant.
Student Data:
{context}
Question: {question}
Answer:"""
        prompt = PromptTemplate.from_template(template)
        context_str = "\n\n".join(d.page_content for d in docs)
        
        chain = prompt | self.llm | StrOutputParser()
        answer = chain.invoke({"context": context_str, "question": question})
        return answer, docs

    # ──────────────────────────────────────────────────────────
    # SETUP B: Semantic Search with Multi-Tenant Filtering
    # ──────────────────────────────────────────────────────────
    def run_setup_b(self, question: str, proctor_id: str) -> tuple:
        # Metadata filtered dense search (only proctor's assigned students)
        retriever = self.service.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 5,
                "filter": {"proctor_id": {"$eq": proctor_id}}
            }
        )
        docs = retriever.invoke(question)
        
        template = """You are an academic assistant.
Student Data:
{context}
Question: {question}
Answer:"""
        prompt = PromptTemplate.from_template(template)
        context_str = "\n\n".join(d.page_content for d in docs)
        
        chain = prompt | self.llm | StrOutputParser()
        answer = chain.invoke({"context": context_str, "question": question})
        return answer, docs

    # ──────────────────────────────────────────────────────────
    # SETUP C: Our Code - Hybrid Ensemble RAG
    # ──────────────────────────────────────────────────────────
    def run_setup_c(self, question: str, proctor_id: str) -> tuple:
        # Runs the actual query_chatbot logic inside your rag_service.py
        # Which does: Intent detection -> Dynamic BM25 index on-the-fly -> PGVector filter -> Weighted Ensemble
        # We fetch the actual documents retrieved for this to inspect them
        
        # We mimic the retriever parts of query_chatbot here to capture retrieved docs
        chunk_types = detect_chunk_types(question)
        retriever_list = []
        weights = []

        # Setup local BM25 for this proctor's students
        try:
            conn = psycopg2.connect(settings.DATABASE_URL)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT s.usn, s.name, s.current_year, s.details, p.proctor_id, p.academic_year
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
                weights.append(0.3)
        except Exception as e:
            print("BM25 setup err:", e)

        # PGVector retriever
        if chunk_types:
            for ctype in chunk_types:
                semantic_retriever = self.service.vector_store.as_retriever(
                    search_type="similarity",
                    search_kwargs={
                        "k": 5,
                        "filter": {"$and": [
                            {"proctor_id": {"$eq": proctor_id}},
                            {"chunk_type": {"$eq": ctype}}
                        ]}
                    }
                )
                retriever_list.append(semantic_retriever)
                weights.append(0.7 / len(chunk_types))
        else:
            semantic_retriever = self.service.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={
                    "k": 5,
                    "filter": {"proctor_id": {"$eq": proctor_id}}
                }
            )
            retriever_list.append(semantic_retriever)
            weights.append(0.7)

        # Retrieve documents
        retrieved_docs = []
        if len(retriever_list) > 1:
            total_w = sum(weights)
            norm_weights = [w / total_w for w in weights]
            ensemble = EnsembleRetriever(retrievers=retriever_list, weights=norm_weights)
            retrieved_docs = ensemble.invoke(question)
        elif len(retriever_list) == 1:
            retrieved_docs = retriever_list[0].invoke(question)

        # Query actual chatbot logic to get the final answer
        answer = self.service.query_chatbot(question, proctor_id)
        return answer, retrieved_docs

    # ──────────────────────────────────────────────────────────
    # THE GEMINI-AS-A-JUDGE SCORING ROUTINE
    # ──────────────────────────────────────────────────────────
    def judge_answer(self, question: str, ground_truth: str, answer: str, setup_name: str) -> dict:
        prompt_text = """
You are an expert academic evaluator checking the answers generated by a university proctor chatbot.
Compare the generated answer to the absolute ground truth data.

Ground Truth Student Records (JSON):
{ground_truth}

Evaluated Setup: {setup_name}
User Question: {question}
Generated Answer to Evaluate:
"{answer}"

Grade this generated answer on two separate metrics on a scale of 1 to 5 (integers only):

1. FAITHFULNESS (1-5):
- 5: Absolute factual precision. No claims are made that cannot be proven directly by the Ground Truth.
- 3: Partially faithful, but makes minor assumptions or generalizes inaccurately.
- 1: Severe hallucination. Made up a grade, attendance percentage, or mixed up student profiles.

2. COMPLETENESS (1-5):
- 5: The answer fully answers all parts of the user question with all matching details found in the ground truth.
- 3: Answers the question partially but leaves out crucial student listings or details.
- 1: Completely missed the answer, said "no data found" when data is clearly there, or gave completely unrelated info.

Return your response in strict JSON format like this:
{{
  "faithfulness": 5,
  "completeness": 5,
  "reason": "Explain briefly why you gave these scores."
}}
Do not output anything else except the raw JSON.
"""
        try:
            prompt = PromptTemplate.from_template(prompt_text)
            chain = prompt | self.judge_llm | StrOutputParser()
            result_str = chain.invoke({
                "ground_truth": ground_truth,
                "setup_name": setup_name,
                "question": question,
                "answer": answer
            }).strip()
            
            # Clean JSON code fence
            if "```json" in result_str:
                result_str = result_str.split("```json")[1].split("```")[0].strip()
            elif "```" in result_str:
                result_str = result_str.split("```")[1].split("```")[0].strip()
                
            return json.loads(result_str)
        except Exception as e:
            print(f"Error parsing judge score: {e}")
            return {"faithfulness": 1, "completeness": 1, "reason": f"Parsing error: {e}"}

def run_evaluation_suite():
    # Synchronize vector db to make sure latest vector indices exist
    evaluator = RAGEvaluator()
    print("Pre-syncing database vector embeddings...")
    evaluator.service.sync_data()

    # Define 15 highly realistic questions referencing real students in your DB
    # We target Proctor P111 (has Ajay, Charan Kumar, Akshay R) 
    # and Proctor P000 (has Karthik, Akshay Kumar, Dikshith, Akash)
    queries = [
        # --- PROCTOR P111 Queries ---
        {"query": "Who has attendance below 75%?", "proctor_id": "P111"},
        {"query": "What is Ajay Kumar S's CGPA?", "proctor_id": "P111"},
        {"query": "Give me the SGPA of Akshay R in Semester 1", "proctor_id": "P111"},
        {"query": "Does Charan Kumar R have any attendance shortage?", "proctor_id": "P111"},
        {"query": "What are the subject marks for student 1MS24IS400?", "proctor_id": "P111"},
        {"query": "Are there any warning remarks from the proctor for Ajay Kumar S?", "proctor_id": "P111"},
        {"query": "Compare the CGPA of Charan Kumar R and Akshay R", "proctor_id": "P111"},
        {"query": "What section or class details belong to Ajay Kumar S?", "proctor_id": "P111"},
        
        # --- PROCTOR P000 Queries ---
        {"query": "What is the attendance percentage of Karthik S Poojary?", "proctor_id": "P000"},
        {"query": "List the third year students assigned to me.", "proctor_id": "P000"},
        {"query": "Show me the previous exam history of 1MS23IS051", "proctor_id": "P000"},
        {"query": "Who is the student with USN 1MS24IS402?", "proctor_id": "P000"},
        {"query": "Are there any subjects with attendance issues for Dikshith S?", "proctor_id": "P000"},
        {"query": "Does Akshay Kumar have any recorded proctor meetings?", "proctor_id": "P000"},
        {"query": "What is the overall performance of Akash K S?", "proctor_id": "P000"}
    ]

    # Pre-fetch Ground Truth profiles to save time
    gt_cache = {
        "P111": evaluator.get_ground_truth("P111"),
        "P000": evaluator.get_ground_truth("P000")
    }

    results = []
    
    # Run evaluation
    for i, item in enumerate(queries, 1):
        q = item["query"]
        p_id = item["proctor_id"]
        print(f"\n=======================================================")
        print(f"QUERY {i}/15: '{q}' (Proctor Scoped: {p_id})")
        print(f"=======================================================")
        
        ground_truth = gt_cache[p_id]
        
        # Setup A
        print("\n--> Running Setup A (Baseline Vector)...")
        ans_a, docs_a = evaluator.run_setup_a(q, p_id)
        scores_a = evaluator.judge_answer(q, ground_truth, ans_a, "Setup A: Baseline Vector Search")
        print(f"Setup A Scores - Faithfulness: {scores_a['faithfulness']}, Completeness: {scores_a['completeness']}")
        
        # Setup B
        print("\n--> Running Setup B (Semantic + Filter)...")
        ans_b, docs_b = evaluator.run_setup_b(q, p_id)
        scores_b = evaluator.judge_answer(q, ground_truth, ans_b, "Setup B: Scoped Semantic Search")
        print(f"Setup B Scores - Faithfulness: {scores_b['faithfulness']}, Completeness: {scores_b['completeness']}")
        
        # Setup C
        print("\n--> Running Setup C (Our Hybrid Ensemble)...")
        ans_c, docs_c = evaluator.run_setup_c(q, p_id)
        scores_c = evaluator.judge_answer(q, ground_truth, ans_c, "Setup C: Hybrid Ensemble (BM25 + Semantic + Intent)")
        print(f"Setup C Scores - Faithfulness: {scores_c['faithfulness']}, Completeness: {scores_c['completeness']}")
        
        results.append({
            "query_num": i,
            "query": q,
            "proctor_id": p_id,
            "setup_a": scores_a,
            "setup_b": scores_b,
            "setup_c": scores_c
        })

    # Save results to local JSON
    output_path = "/Users/ajaykumar/Downloads/mern projects/Mini Project/Smart-Report-Generator/backend/fastapi/scratch/evaluation_results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nWritten results to: {output_path}")

    # Compute averages
    avg_f_a = sum(r["setup_a"]["faithfulness"] for r in results) / len(results)
    avg_c_a = sum(r["setup_a"]["completeness"] for r in results) / len(results)
    
    avg_f_b = sum(r["setup_b"]["faithfulness"] for r in results) / len(results)
    avg_c_b = sum(r["setup_b"]["completeness"] for r in results) / len(results)
    
    avg_f_c = sum(r["setup_c"]["faithfulness"] for r in results) / len(results)
    avg_c_c = sum(r["setup_c"]["completeness"] for r in results) / len(results)

    # Output LaTeX and Markdown Table
    print("\n\n" + "="*50)
    print("FINAL EVALUATION RESULTS SUMMARY")
    print("="*50)
    
    markdown_table = f"""
| RAG Retrieval Configuration Setup | Avg Faithfulness (1-5) | Avg Completeness (1-5) | Perfect Answers (%) |
|---|---|---|---|
| **Setup A: Baseline Dense Vector Search** | {avg_f_a:.2f} | {avg_c_a:.2f} | {sum(1 for r in results if r['setup_a']['faithfulness'] == 5 and r['setup_a']['completeness'] == 5) / len(results) * 100:.1f}% |
| **Setup B: Scoped Semantic Search with Metadata** | {avg_f_b:.2f} | {avg_c_b:.2f} | {sum(1 for r in results if r['setup_b']['faithfulness'] == 5 and r['setup_b']['completeness'] == 5) / len(results) * 100:.1f}% |
| **Setup C: Our Hybrid Ensemble (BM25 + Semantic + Intent)** | {avg_f_c:.2f} | {avg_c_c:.2f} | {sum(1 for r in results if r['setup_c']['faithfulness'] == 5 and r['setup_c']['completeness'] == 5) / len(results) * 100:.1f}% |
"""
    print(markdown_table)
    
    latex_table = f"""
\\begin{{table}}[htbp]
\\caption{{Quantitative Evaluation of RAG Search Configurations}}
\\label{{tab:evaluation}}
\\begin{{center}}
\\begin{{tabular}}{{|l|c|c|c|}}
\\hline
\\textbf{{RAG Architecture Configuration}} & \\textbf{{Avg. Faithfulness}} & \\textbf{{Avg. Completeness}} & \\textbf{{Accuracy (\%)}} \\\\
\\hline
Setup A: Baseline Vector Search & {avg_f_a:.2f} & {avg_c_a:.2f} & {sum(1 for r in results if r['setup_a']['faithfulness'] == 5 and r['setup_a']['completeness'] == 5) / len(results) * 100:.1f}\\% \\\\
\\hline
Setup B: Scoped Semantic Vector Search & {avg_f_b:.2f} & {avg_c_b:.2f} & {sum(1 for r in results if r['setup_b']['faithfulness'] == 5 and r['setup_b']['completeness'] == 5) / len(results) * 100:.1f}\\% \\\\
\\hline
\\textbf{{Setup C: Our Hybrid Ensemble (BM25 + Vector)}} & \\textbf{{{avg_f_c:.2f}}} & \\textbf{{{avg_c_c:.2f}}} & \\textbf{{{sum(1 for r in results if r['setup_c']['faithfulness'] == 5 and r['setup_c']['completeness'] == 5) / len(results) * 100:.1f}\\%}} \\\\
\\hline
\\end{{tabular}}
\\end{{center}}
\\end{{table}}
"""
    print("LATEX TABLE CONTEXT:\n")
    print(latex_table)

if __name__ == "__main__":
    try:
        run_evaluation_suite()
    except Exception as e:
        traceback.print_exc()
