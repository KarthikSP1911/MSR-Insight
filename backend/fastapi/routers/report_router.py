import json
import os
from fastapi import APIRouter, HTTPException
from models.request_models import ScrapeRequest, RemarkRequest
from services.scraping_service import get_complete_student_data, parse_and_process_data
from services.normalization_service import DataNormalizer
from services.ai_service import AIService
from config.settings import settings

router = APIRouter()
ai_service = AIService()

@router.post("/api/scrape")
def trigger_scrape(request: ScrapeRequest):
    """Triggers the Selenium scraper and auto-syncs normalized data to PG JSONB."""
    try:
        request.usn = request.usn.upper()
        # Expecting DD-MM-YYYY format from Express backend
        parts = request.dob.split("-")
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid DOB format. Expected DD-MM-YYYY.")
        
        # Parse based on DD-MM-YYYY format
        day, month, year = map(str, map(int, parts))

        # Pass to Selenium scraper
        full_scraped_data = get_complete_student_data(request.usn, day, month, year)
        
        if not full_scraped_data:
            raise HTTPException(status_code=500, detail="Failed to scrape data from portal.")

        # Process and Sync to Express — normalized data is pushed to Express automatically
        normalized_data = parse_and_process_data(full_scraped_data)
              
        return {"success": True, "message": "Scraping and sync completed successfully", "data": normalized_data}
    except HTTPException:
        raise    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping error: {str(e)}")

@router.post("/generate-remark")
def generate_ai_remark(request: dict):
    """Generates AI remarks from provided student data blob."""
    try:
        result = ai_service.generate_remark(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
