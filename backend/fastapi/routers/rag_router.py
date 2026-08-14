import logging

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from services.rag_service import RAGService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/rag", tags=["RAG"])
rag_service = RAGService()

class ChatRequest(BaseModel):
    question: str
    proctor_id: str

@router.post("/sync")
async def sync_rag_data(background_tasks: BackgroundTasks):
    """Starts a background sync task."""
    if rag_service.is_syncing:
        return {"status": "Sync already in progress"}
    
    background_tasks.add_task(rag_service.sync_data)
    return {"status": "Sync started in background"}

@router.get("/sync/status")
def get_sync_status():
    """Checks the status of the RAG sync."""
    return {
        "is_syncing": rag_service.is_syncing,
        "last_sync": getattr(rag_service, "_last_sync_time", None),
        "last_result": getattr(rag_service, "_last_sync_result", None)
    }

@router.post("/chat")
def chat_with_rag(request: ChatRequest):
    """Chats with the RAG model."""
    try:
        answer = rag_service.query_chatbot(request.question, request.proctor_id)
        return {"answer": answer}
    except Exception as e:
        logger.exception("RAG chat query failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate response from RAG")
