import logging

from fastapi import APIRouter, HTTPException, Header, Depends
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.schemas.agent import ChatRequest, ConfirmRequest
from app.services.agent.service import AgentService, format_sse_event
from app.services.agent.tools.student_tools import get_student_profile, list_proctor_students
from app.services.agent.tools.risk_tools import (
    analyze_at_risk_students,
    calculate_attendance_recovery,
    explain_alert,
    summarize_risk_by_subject,
)
from app.services.agent.tools.insight_tools import generate_weekly_insights
from app.services.agent.tools.reminder_tools import create_reminder, list_reminders
from app.services.agent.tools.communication_tools import send_email, send_whatsapp
from app.services.agent.tools.report_tools import generate_report_pdf

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agent", tags=["Agentic AI"])

agent_service = AgentService(tools=[
    get_student_profile,
    list_proctor_students,
    analyze_at_risk_students,
    calculate_attendance_recovery,
    explain_alert,
    summarize_risk_by_subject,
    generate_weekly_insights,
    create_reminder,
    list_reminders,
    send_email,
    send_whatsapp,
    generate_report_pdf,
])


def verify_gateway_secret(x_agent_gateway_secret: str = Header(default="")):
    """Only Express (which has already verified the proctor's session) is meant
    to call this API. Unlike the RAG chatbot, this router does not trust a bare
    proctor_id from an unauthenticated caller."""
    if not settings.AGENT_GATEWAY_SECRET:
        raise HTTPException(status_code=500, detail="Agent gateway secret not configured")
    if x_agent_gateway_secret != settings.AGENT_GATEWAY_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid agent gateway secret")


@router.post("/chat", dependencies=[Depends(verify_gateway_secret)])
def chat_with_agent(request: ChatRequest):
    try:
        return agent_service.chat(request.proctor_id, request.message, request.conversation_id)
    except Exception as e:
        logger.exception("Agent chat failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to process agent request")


@router.post("/chat/stream", dependencies=[Depends(verify_gateway_secret)])
def chat_with_agent_stream(request: ChatRequest):
    """Same conversation turn as /chat, but streams the assistant's reply as
    Server-Sent Events (see AgentService.chat_stream). /confirm is unchanged
    and stays synchronous."""
    def event_source():
        try:
            yield from agent_service.chat_stream(request.proctor_id, request.message, request.conversation_id)
        except Exception as e:
            logger.exception("Agent chat stream failed: %s", e)
            yield format_sse_event("error", {"message": "Failed to process agent request"})

    return StreamingResponse(event_source(), media_type="text/event-stream")


@router.post("/confirm", dependencies=[Depends(verify_gateway_secret)])
def confirm_agent_action(request: ConfirmRequest):
    try:
        return agent_service.confirm(
            request.proctor_id, request.approved, request.subject, request.message,
            request.conversation_id, request.proctor_remarks,
        )
    except Exception as e:
        logger.exception("Agent confirm failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to process agent confirmation")
