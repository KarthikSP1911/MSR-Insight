from pydantic import BaseModel


class ChatRequest(BaseModel):
    proctor_id: str
    message: str


class ConfirmRequest(BaseModel):
    proctor_id: str
    approved: bool
