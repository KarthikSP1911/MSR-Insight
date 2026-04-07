import traceback
from fastapi import APIRouter, HTTPException
from models.request_models import RemarkRequest
from services.ai_service import AIService
from config.settings import settings

router = APIRouter()
ai_service = AIService()

@router.post("/generate-remark")
def generate_ai_remark(request: dict):
    """Generates AI remarks from provided student data blob."""
    try:
        result = ai_service.generate_remark(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
