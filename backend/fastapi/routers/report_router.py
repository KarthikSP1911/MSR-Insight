import logging

from fastapi import APIRouter, HTTPException
from models.request_models import RemarkRequest
from services.ai_service import AIService
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter()
ai_service = AIService()

@router.post("/generate-remark")
def generate_ai_remark(request: dict):
    """Generates AI remarks from provided student data blob."""
    try:
        result = ai_service.generate_remark(request)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.exception("AI remark generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Internal Server Error during AI remark generation")
