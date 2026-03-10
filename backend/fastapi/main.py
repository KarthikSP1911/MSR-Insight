import json
import os
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from services.ai_service import AIService
from services.data_normalizer import DataNormalizer
from services.scraping import get_complete_student_data, parse_and_save_data

load_dotenv()

app = FastAPI()

# Path to the data files
SCRAPED_DATA_PATH = "all_students_report.json"
NORMALIZED_DATA_PATH = "normalized_data.json"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = AIService()


class SubjectItem(BaseModel):
    code: str
    name: str
    marks: int | float
    attendance: int | float


class RemarkRequest(BaseModel):
    subjects: list[SubjectItem]


class ScrapeRequest(BaseModel):
    usn: str
    dob: str  # Format: YYYY-MM-DD


@app.get("/")
def read_root():
    return {"message": "FastAPI server running"}


@app.get("/get-normalized-report/{usn}")
def get_normalized_report(usn: str):
    """Retrieves normalized data for a specific student."""
    try:
        # Re-run normalization to ensure we have the latest data
        normalized_dict = DataNormalizer.normalize_all_data(SCRAPED_DATA_PATH, NORMALIZED_DATA_PATH)
        
        if usn not in normalized_dict:
            raise HTTPException(status_code=404, detail="Student record not found")
            
        return normalized_dict[usn]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/student/{usn}")
def get_student_report(usn: str):
    """Retrieves raw scraping data directly from json file to match frontend expectations."""
    try:
        if not os.path.exists(SCRAPED_DATA_PATH):
            raise HTTPException(status_code=404, detail="Scraped data file not found.")

        with open(SCRAPED_DATA_PATH, "r") as f:
            scraped_data = json.load(f)

        if usn not in scraped_data:
            raise HTTPException(status_code=404, detail=f"No record found for USN: {usn}")

        return {"success": True, "data": scraped_data[usn]}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error decoding data file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scrape")
def trigger_scrape(request: ScrapeRequest):
    """Triggers the Selenium scraper for a given USN and DOB."""
    try:
        # Standardize USN to uppercase
        request.usn = request.usn.upper()
        
        # DOB is expected in YYYY-MM-DD format
        parts = request.dob.split("-")
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid DOB format. Expected YYYY-MM-DD.")
            
        year, month, day = parts
        # Remove leading zeros if necessary, or keep as is. The scraper uses string formats.
        # The frontend sends YYYY-MM-DD where MM and DD might have leading zeros.
        # Let's clean them to match what the portal expects (e.g. '08' -> '8' for some dropdowns).
        # Wait, the scraper script does: day = day, month = month, year = year directly.
        # But wait, does MSRIT portal expect "02" or "2"? Let's assume the frontend passes correctly 
        # as a standard date picker or string. We'll strip leading zero for day and month just in case 
        # it expects pure numbers as dropdown values for some months. Wait, the frontend sends 1-31 as "01" or "1"?
        # Actually in scraping.py, DD, MM, YYYY = "20", "10", "2005" are passed.
        # So strings are fine. We will strip leading zero from day as most dropdowns use '1' not '01'.
        # For month, let's keep it as is, or remove leading 0 depending on the portal. Let's just pass them.
        day = str(int(day))
        month = str(int(month))
        year = str(int(year))

        full_data = get_complete_student_data(request.usn, day, month, year)
        
        if not full_data:
            raise HTTPException(status_code=500, detail="Failed to scrape data. Check credentials or portal status.")

        parse_and_save_data(full_data)
        
        # After saving, return the latest data from the JSON file
        with open(SCRAPED_DATA_PATH, "r") as f:
            scraped_data = json.load(f)
            
        if request.usn not in scraped_data:
             raise HTTPException(status_code=404, detail="Scrape successful but data not found in DB immediately.")
             
        return {"success": True, "message": "Scraping completed successfully", "data": scraped_data[request.usn]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping error: {str(e)}")


@app.get("/generate-remark/{usn}")
def generate_remark_by_usn(usn: str):
    """Loads scraped data for the given USN, normalizes it, and returns AI-generated remarks."""
    try:
        if not os.path.exists(SCRAPED_DATA_PATH):
            raise HTTPException(status_code=404, detail="Scraped data file not found.")

        with open(SCRAPED_DATA_PATH, "r") as f:
            scraped_data = json.load(f)

        if usn not in scraped_data:
            raise HTTPException(status_code=404, detail=f"No record found for USN: {usn}")

        normalized = DataNormalizer.normalize_student_record(scraped_data[usn])
        result = ai_service.generate_remark(normalized)
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-remark")
def generate_remark(request: RemarkRequest):
    try:
        # Use model_dump() for Pydantic v2 compatibility
        result = ai_service.generate_remark(request.model_dump())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/generate-remark-dummy")
def generate_remark_dummy():
    """Endpoint with dummy data for testing"""
    dummy_data = {
        "subjects": [
            {"code": "23IS62", "name": "Machine Learning", "marks": 45, "attendance": 80},
            {"code": "23IS61", "name": "Management", "marks": 85, "attendance": 90},
            {"code": "23ISE644", "name": "Cloud Computing", "marks": 30, "attendance": 70}
        ]
    }
    
    try:
        result = ai_service.generate_remark(dummy_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
