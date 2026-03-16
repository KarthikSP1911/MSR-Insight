import json
import os
from fastapi import APIRouter, HTTPException
from models.request_models import ScrapeRequest, RemarkRequest
from services.scraping_service import get_complete_student_data, parse_and_save_data
from services.normalization_service import DataNormalizer
from services.ai_service import AIService
from config.settings import settings

router = APIRouter()
ai_service = AIService()

@router.get("/get-normalized-report/{usn}")
def get_normalized_report(usn: str):
    """Retrieves normalized data for a specific student."""
    try:
        normalized_dict = DataNormalizer.normalize_all_data(settings.SCRAPED_DATA_PATH, settings.NORMALIZED_DATA_PATH)
        
        if usn not in normalized_dict:
            raise HTTPException(status_code=404, detail=f"Student record not found for USN: {usn}")
            
        return normalized_dict[usn]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/api/report/student/{usn}")
def get_student_report(usn: str):
    """Retrieves raw scraping data directly from json file."""
    try:
        if not os.path.exists(settings.SCRAPED_DATA_PATH):
            raise HTTPException(status_code=404, detail="Scraped data file not found. Please trigger a scrape first.")

        with open(settings.SCRAPED_DATA_PATH, "r") as f:
            scraped_data = json.load(f)

        if usn not in scraped_data:
            raise HTTPException(status_code=404, detail=f"No record found for USN: {usn}. Data might not be scraped yet.")

        return {"success": True, "data": scraped_data[usn]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading report: {str(e)}")

@router.post("/api/scrape")
def trigger_scrape(request: ScrapeRequest):
    """Triggers the Selenium scraper for a given USN and DOB."""
    try:
        request.usn = request.usn.upper()
        parts = request.dob.split("-")
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid DOB format. Expected YYYY-MM-DD.")
            
        year, month, day = map(str, map(int, parts))

        full_data = get_complete_student_data(request.usn, day, month, year)
        
        if not full_data:
            raise HTTPException(status_code=500, detail="Failed to scrape data. Check credentials or portal status.")

        parse_and_save_data(full_data)
        
        if not os.path.exists(settings.SCRAPED_DATA_PATH):
             raise HTTPException(status_code=500, detail="File saved but not found immediately. Disk I/O error.")

        with open(settings.SCRAPED_DATA_PATH, "r") as f:
            scraped_data = json.load(f)
            
        if request.usn not in scraped_data:
             raise HTTPException(status_code=404, detail="Scrape successful but USN data not found in DB immediately.")
             
        return {"success": True, "message": "Scraping completed successfully", "data": scraped_data[request.usn]}
    except HTTPException:
        raise    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping error: {str(e)}")

@router.get("/generate-remark/{usn}")
def generate_remark_by_usn(usn: str):
    """Generates AI remarks for a specific student USN."""
    try:
        if not os.path.exists(settings.SCRAPED_DATA_PATH):
            raise HTTPException(status_code=404, detail="Scraped data file not found. Please scrape data first.")

        with open(settings.SCRAPED_DATA_PATH, "r") as f:
            scraped_data = json.load(f)

        if usn not in scraped_data:
            raise HTTPException(status_code=404, detail=f"No record found for USN: {usn}. AI cannot generate remarks without data.")

        normalized = DataNormalizer.normalize_student_record(scraped_data[usn])
        result = ai_service.generate_remark(normalized)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Remark generation error: {str(e)}")

@router.post("/generate-remark")
def generate_ai_remark(request: RemarkRequest):
    """Generates AI remarks from provided subject data."""
    try:
        result = ai_service.generate_remark(request.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
