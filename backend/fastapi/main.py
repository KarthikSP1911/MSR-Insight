import json
import os
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from services.ai_service import AIService
from services.data_normalizer import DataNormalizer

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
