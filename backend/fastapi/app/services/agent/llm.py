"""LLM client for the Agentic AI chatbot.

Own instance, not imported from services/rag_service.py — the two chatbots must
stay independently configurable. Gemini was chosen over Groq after a standalone
smoke test confirmed reliable tool-calling with the model already used by RAG
(see plan doc); Groq's tool-calling support was not verified and is not used here.
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings


def get_agent_llm():
    return ChatGoogleGenerativeAI(
        model=settings.AGENT_LLM_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.2,
    )
