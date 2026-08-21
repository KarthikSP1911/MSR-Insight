import logging

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel

from config.settings import settings
from agent.service import AgentService
from agent.tools.student_tools import get_student_profile, list_proctor_students
from agent.tools.risk_tools import analyze_at_risk_students
from agent.tools.insight_tools import generate_weekly_insights

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agent", tags=["Agentic AI"])

# Tool list grows in later steps (confirmation-gated action tools next) without
# changing this router's shape.
agent_service = AgentService(tools=[
    get_student_profile,
    list_proctor_students,
    analyze_at_risk_students,
    generate_weekly_insights,
])


def verify_gateway_secret(x_agent_gateway_secret: str = Header(default="")):
    """Only Express (which has already verified the proctor's session) is meant
    to call this API. Unlike the RAG chatbot, this router does not trust a bare
    proctor_id from an unauthenticated caller."""
    if not settings.AGENT_GATEWAY_SECRET:
        raise HTTPException(status_code=500, detail="Agent gateway secret not configured")
    if x_agent_gateway_secret != settings.AGENT_GATEWAY_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid agent gateway secret")


class ChatRequest(BaseModel):
    proctor_id: str
    message: str


@router.post("/chat", dependencies=[Depends(verify_gateway_secret)])
def chat_with_agent(request: ChatRequest):
    try:
        return agent_service.chat(request.proctor_id, request.message)
    except Exception as e:
        logger.exception("Agent chat failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to process agent request")
