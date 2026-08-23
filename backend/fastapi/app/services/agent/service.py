"""Orchestration layer between the FastAPI router and the LangGraph graph.

proctor_id always arrives here as an explicit parameter supplied by the caller
(Express, which has already verified the session) — it is never parsed out of
LLM output, and is the only source of truth threaded into tool authorization
checks via graph state.
"""
import logging
from langchain_core.messages import HumanMessage
from langgraph.types import Command

from .graph import build_graph
from .checkpointer import get_checkpointer
from .ids import thread_id_for

logger = logging.getLogger(__name__)


def _extract_text(content) -> str:
    """Gemini responses can come back as a string or a list of content blocks
    (e.g. [{"type": "text", "text": "...", "extras": {...}}]) — normalize to
    plain text for API consumers."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return "".join(parts)
    return str(content)


class AgentService:
    def __init__(self, tools: list | None = None):
        self._tools = tools or []
        self._graph = None

    def _get_graph(self):
        if self._graph is None:
            self._graph = build_graph(self._tools, get_checkpointer())
        return self._graph

    def _format_result(self, result: dict) -> dict:
        if "__interrupt__" in result and result["__interrupt__"]:
            action = result["__interrupt__"][0].value
            return {"status": "pending_confirmation", "action": action}
        last = result["messages"][-1]
        return {"status": "ok", "reply": _extract_text(last.content)}

    def chat(self, proctor_id: str, message: str) -> dict:
        graph = self._get_graph()
        config = {"configurable": {"thread_id": thread_id_for(proctor_id)}}
        result = graph.invoke(
            {"messages": [HumanMessage(content=message)], "proctor_id": proctor_id},
            config=config,
        )
        return self._format_result(result)

    def confirm(self, proctor_id: str, approved: bool, subject: str | None = None,
                message: str | None = None) -> dict:
        """Resumes a graph paused on interrupt() inside send_email/send_whatsapp
        (see tools/communication_tools.py). Same thread_id as chat() so this
        resumes the exact paused run, not a new conversation. subject/message
        carry the proctor's edits to the drafted content, if any."""
        graph = self._get_graph()
        config = {"configurable": {"thread_id": thread_id_for(proctor_id)}}
        result = graph.invoke(
            Command(resume={"approved": approved, "subject": subject, "message": message}),
            config=config,
        )
        return self._format_result(result)
