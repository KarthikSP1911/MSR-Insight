"""Student report PDF generation and email. Like communication_tools.py, this
is gated by interrupt() since the final step emails a real parent -- the
proctor previews the rendered PDF in AgentPanel.tsx before confirming.

The AI remark reuses AIService.generate_remark() in-process (same subsystem,
not a network round trip); the PDF itself is rendered server-side by Express
(Puppeteer) via the generate-report-pdf internal route, first in preview mode
then, on confirmation, in send mode."""
from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from langgraph.types import interrupt

from ..state import AgentState
from app.repositories.agent_repository import is_proctor_owner_of_student
from app.services.remarks.service import AIService
from .express_client import call_express_internal
from .logging import log_action
from .student_tools import _load_student_row

_ai_service = AIService()


@tool
def generate_report_pdf(
    usn: str,
    include_proctor_remarks: bool,
    state: Annotated[AgentState, InjectedState],
    proctor_remarks: str | None = None,
) -> str:
    """Generate a student performance report PDF and, once the proctor
    confirms the preview, email it to the student's parent(s). Call
    get_student_profile first so you're grounded in real data. Before calling
    this, ask the proctor in plain text whether they'd like to add proctor
    remarks or skip that section. If they provide remarks, pass their text
    here in `proctor_remarks` **verbatim** -- never paraphrase or rewrite it,
    it's their own authored text. If they decline, call this with
    include_proctor_remarks=False and proctor_remarks=None; the
    proctor-remarks section is then omitted from the PDF entirely, not left
    blank. `usn` must be a real USN you already learned -- never guess it."""
    proctor_id = state["proctor_id"]
    cid = state.get("conversation_id")
    if not is_proctor_owner_of_student(proctor_id, usn):
        return f"Not authorized: {usn} is not one of your assigned students."

    student = _load_student_row(usn)
    if not student:
        return f"No student record found for {usn}."

    details = student["details"]
    remark_data = {
        "name": student["name"],
        "usn": student["usn"],
        "class_details": details.get("class_details"),
        "cgpa": details.get("cgpa"),
        "last_updated": details.get("last_updated"),
        "subjects": details.get("subjects", []),
    }
    try:
        ai_remark = _ai_service.generate_remark(remark_data)["ai_remark"]
    except Exception as e:
        return f"Could not generate the report: AI remark generation failed ({e})."

    effective_remarks = proctor_remarks if include_proctor_remarks else None
    payload = {
        "proctor_id": proctor_id,
        "usn": usn,
        "include_proctor_remarks": include_proctor_remarks,
        "proctor_remarks": effective_remarks,
        "ai_remark": ai_remark,
        "mode": "preview",
    }
    try:
        preview = call_express_internal("generate-report-pdf", payload)
    except Exception as e:
        return f"Failed to generate the report PDF: {e}"

    decision = interrupt({
        "action_type": "send_report_email",
        "usn": usn,
        "pdf_base64": preview.get("pdf_base64"),
        "include_proctor_remarks": include_proctor_remarks,
        "proctor_remarks": effective_remarks,
    })

    if not decision.get("approved"):
        log_action(proctor_id, "generate_report_pdf", "rejected", student_usn=usn,
                    payload={"include_proctor_remarks": include_proctor_remarks}, conversation_id=cid)
        return "The proctor did not approve sending this report. It was not sent."

    # The proctor may have edited the proctor-remarks text in the approval
    # card before confirming; their edited text takes precedence.
    final_remarks = decision.get("proctor_remarks")
    if final_remarks is None:
        final_remarks = effective_remarks
    payload["proctor_remarks"] = final_remarks if include_proctor_remarks else None
    payload["mode"] = "send"

    # Re-check ownership at execute time too (defense in depth).
    if not is_proctor_owner_of_student(proctor_id, usn):
        return f"Not authorized: {usn} is not one of your assigned students."

    try:
        result = call_express_internal("generate-report-pdf", payload)
        log_action(proctor_id, "generate_report_pdf", "completed", student_usn=usn,
                    payload={"include_proctor_remarks": include_proctor_remarks}, result=result, conversation_id=cid)
        if result.get("sent", 0) == 0:
            return f"No report email was sent: {result.get('message', 'no parent email on file.')}"
        return f"Report emailed to {result.get('sent')} parent(s)."
    except Exception as e:
        log_action(proctor_id, "generate_report_pdf", "failed", student_usn=usn,
                    payload={"include_proctor_remarks": include_proctor_remarks}, result={"error": str(e)}, conversation_id=cid)
        return f"Failed to send report email: {e}"
