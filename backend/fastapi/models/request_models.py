from pydantic import BaseModel

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
