"""Parent communication. send_email and send_whatsapp are the only two tools
in the whole agent that touch someone outside the system, so they're the only
ones gated by interrupt() -- the graph pauses here until the proctor confirms
via POST /api/agent/confirm, then this same function resumes and actually
calls Express. See agent/graph.py's build_graph docstring for why this lives
inside the tool rather than a separate graph node (LangGraph's documented
human-in-the-loop pattern)."""
import logging
from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from langgraph.types import interrupt

from ..state import AgentState
from app.repositories.agent_repository import is_proctor_owner_of_student
from .logging import log_action
from .express_client import call_express_internal

logger = logging.getLogger(__name__)


@tool
def send_email(usn: str, subject: str, message: str, state: Annotated[AgentState, InjectedState]) -> str:
    """Send an email to a student's parent(s). This has a real effect on a real
    person, so it always requires the proctor's explicit confirmation before it
    is sent -- do not tell the proctor it has been sent until you receive a
    tool result confirming that. Draft the `subject` and `message` yourself
    based on real data you already looked up (e.g. via get_student_profile);
    never invent grades, attendance, or names in the message. For a bulk
    request ("email all at-risk students' parents"), call this once per
    student -- each call pauses for its own separate approval, there is no
    "send to all" bypass."""
    proctor_id = state["proctor_id"]
    cid = state.get("conversation_id")
    if not is_proctor_owner_of_student(proctor_id, usn):
        return f"Not authorized: {usn} is not one of your assigned students."

    decision = interrupt({
        "action_type": "send_email",
        "usn": usn,
        "subject": subject,
        "message": message,
    })

    if not decision.get("approved"):
        log_action(proctor_id, "send_email", "rejected", student_usn=usn,
                    payload={"subject": subject, "message": message}, conversation_id=cid)
        return "The proctor did not approve this email. It was not sent."

    # The proctor may have edited the draft before confirming; their edited
    # text takes precedence over what the agent originally drafted.
    subject = decision.get("subject") or subject
    message = decision.get("message") or message

    # Re-check ownership at execute time too (defense in depth).
    if not is_proctor_owner_of_student(proctor_id, usn):
        return f"Not authorized: {usn} is not one of your assigned students."

    try:
        result = call_express_internal("send-email", {
            "proctor_id": proctor_id, "usn": usn, "subject": subject, "message": message,
        })
        log_action(proctor_id, "send_email", "completed", student_usn=usn,
                    payload={"subject": subject, "message": message}, result=result, conversation_id=cid)
        if result.get("sent", 0) == 0:
            return f"No email was sent: {result.get('message', 'no parent email on file.')}"
        return f"Email sent to {result.get('sent')} parent(s)."
    except Exception as e:
        logger.exception("send_email: Express call failed for %s", usn)
        log_action(proctor_id, "send_email", "failed", student_usn=usn,
                    payload={"subject": subject, "message": message}, result={"error": str(e)}, conversation_id=cid)
        return f"Failed to send email: {e}"


@tool
def send_whatsapp(usn: str, message: str, state: Annotated[AgentState, InjectedState]) -> str:
    """Send a WhatsApp message to a student's parent(s). This has a real effect
    on a real person, so it always requires the proctor's explicit confirmation
    before it is sent -- do not tell the proctor it has been sent until you
    receive a tool result confirming that. Base `message` on real data you
    already looked up; never invent details."""
    proctor_id = state["proctor_id"]
    cid = state.get("conversation_id")
    if not is_proctor_owner_of_student(proctor_id, usn):
        return f"Not authorized: {usn} is not one of your assigned students."

    decision = interrupt({
        "action_type": "send_whatsapp",
        "usn": usn,
        "message": message,
    })

    if not decision.get("approved"):
        log_action(proctor_id, "send_whatsapp", "rejected", student_usn=usn, payload={"message": message}, conversation_id=cid)
        return "The proctor did not approve this WhatsApp message. It was not sent."

    message = decision.get("message") or message

    if not is_proctor_owner_of_student(proctor_id, usn):
        return f"Not authorized: {usn} is not one of your assigned students."

    try:
        result = call_express_internal("send-whatsapp", {
            "proctor_id": proctor_id, "usn": usn, "message": message,
        })
        log_action(proctor_id, "send_whatsapp", "completed", student_usn=usn,
                    payload={"message": message}, result=result, conversation_id=cid)
        if result.get("sent", 0) == 0:
            return f"No WhatsApp message was sent: {result.get('message', 'no parent phone on file or Twilio not configured.')}"
        return f"WhatsApp message sent to {result.get('sent')} parent(s)."
    except Exception as e:
        logger.exception("send_whatsapp: Express call failed for %s", usn)
        log_action(proctor_id, "send_whatsapp", "failed", student_usn=usn,
                    payload={"message": message}, result={"error": str(e)}, conversation_id=cid)
        return f"Failed to send WhatsApp message: {e}"
