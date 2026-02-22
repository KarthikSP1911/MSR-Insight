from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from services.ai_service import AIService

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = AIService()


class RemarkRequest(BaseModel):
    marks: dict
    attendance: dict


@app.get("/")
def read_root():
    return {"message": "FastAPI server running"}


@app.post("/generate-remark")
def generate_remark(request: RemarkRequest):
    try:
        result = ai_service.generate_remark(request.dict())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/generate-remark-dummy")
def generate_remark_dummy():
    """Endpoint with dummy data for testing"""
    dummy_data = {
        "marks": {
            "Data Structures": 85,
            "Database Systems": 78,
            "Web Development": 92,
            "Algorithms": 88,
            "Operating Systems": 61
        },
        "attendance": {
            "Data Structures": 95,
            "Database Systems": 68,
            "Web Development": 92,
            "Algorithms": 85,
            "Operating Systems": 90
        }
    }
    
    try:
        result = ai_service.generate_remark(dummy_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
