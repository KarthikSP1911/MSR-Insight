from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
    proctor_id: str
