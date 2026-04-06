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

import traceback

@router.post("/api/scrape")
def trigger_scrape(request: ScrapeRequest):
    """Triggers the Selenium scraper and auto-syncs normalized data to PG JSONB."""
    print(f"[*] Incoming Scrape Request: {request.dict()}")
    try:
        if not request.usn or not request.dob:
            raise HTTPException(status_code=400, detail="Missing required fields: usn and dob are mandatory.")

        request.usn = request.usn.upper()
        # Expecting DD-MM-YYYY or YYYY-MM-DD from frontend
        # The model says YYYY-MM-DD but the logic below splits by "-"
        print(f"[*] Processing USN: {request.usn}, DOB: {request.dob}")
        
        parts = request.dob.split("-")
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid DOB format. Expected DD-MM-YYYY or YYYY-MM-DD.")
        
        # Handle both YYYY-MM-DD and DD-MM-YYYY
        if len(parts[0]) == 4: # YYYY-MM-DD
            year, month, day = parts
        else: # DD-MM-YYYY
            day, month, year = parts

        day = str(int(day))
        month = str(int(month))
        year = str(int(year))

        print(f"[*] Structured DOB: Day={day}, Month={month}, Year={year}")

        # Pass to Selenium scraper
        full_scraped_data = get_complete_student_data(request.usn, day, month, year)
        
        if not full_scraped_data:
            print("[!] Scraper returned None - Login likely failed or timeout occurred.")
            raise HTTPException(status_code=500, detail="Failed to scrape data from portal. Check credentials or portal availability.")

        print("[*] Scraping successful, starting processing...")
        # Process and Sync to Express — normalized data is pushed to Express automatically
        normalized_data = parse_and_process_data(full_scraped_data)
        
        if not normalized_data:
             raise HTTPException(status_code=500, detail="Parsing failed: Could not extract data from the scraped HTML.")

        print("[*] Sync and normalization complete.")
        return {"success": True, "message": "Scraping and sync completed successfully", "data": normalized_data}
    
    except HTTPException as he:
        raise he
    except Exception as e:
        print("[X] CRITICAL ERROR IN SCRAPE ENDPOINT:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/generate-remark")
def generate_ai_remark(request: dict):
    """Generates AI remarks from provided student data blob."""
    try:
        result = ai_service.generate_remark(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
