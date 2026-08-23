from pydantic import BaseModel


class ChatRequest(BaseModel):
    proctor_id: str
    message: str
    conversation_id: str | None = None


class ConfirmRequest(BaseModel):
    proctor_id: str
    approved: bool
    subject: str | None = None
    message: str | None = None
    conversation_id: str | None = None
