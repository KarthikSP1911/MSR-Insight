"""Orchestration layer between the FastAPI router and the LangGraph graph.

proctor_id always arrives here as an explicit parameter supplied by the caller
(Express, which has already verified the session) — it is never parsed out of
LLM output, and is the only source of truth threaded into tool authorization
checks via graph state.
"""
import json
import logging
from typing import Iterator

from langchain_core.messages import HumanMessage
from langgraph.types import Command

from .graph import build_graph
from .checkpointer import get_checkpointer
from .ids import thread_id_for

logger = logging.getLogger(__name__)


def format_sse_event(event: str, data: dict) -> str:
    """One Server-Sent Event frame. event names: "token" (a piece of the
    assistant's reply), "status" (terminal: ok | pending_confirmation, same
    shape as the non-streaming /chat response), "error"."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


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

    def chat(self, proctor_id: str, message: str, conversation_id: str | None = None) -> dict:
        graph = self._get_graph()
        config = {"configurable": {"thread_id": thread_id_for(proctor_id, conversation_id)}}
        result = graph.invoke(
            {"messages": [HumanMessage(content=message)], "proctor_id": proctor_id, "conversation_id": conversation_id},
            config=config,
        )
        return self._format_result(result)

    def chat_stream(self, proctor_id: str, message: str, conversation_id: str | None = None) -> Iterator[str]:
        """Same graph.invoke() call as chat(), but streams the assistant's
        reply token-by-token as SSE "token" events, then a final "status"
        event carrying exactly what the non-streaming /chat endpoint would
        have returned (ok+reply, or pending_confirmation+action). /confirm
        stays synchronous -- only the initial chat turn streams."""
        graph = self._get_graph()
        config = {"configurable": {"thread_id": thread_id_for(proctor_id, conversation_id)}}
        input_ = {"messages": [HumanMessage(content=message)], "proctor_id": proctor_id, "conversation_id": conversation_id}

        final_state = None
        for stream_mode, payload in graph.stream(input_, config=config, stream_mode=["messages", "values"]):
            if stream_mode == "messages":
                chunk, metadata = payload
                if metadata.get("langgraph_node") != "agent":
                    continue
                text = _extract_text(getattr(chunk, "content", ""))
                if text:
                    yield format_sse_event("token", {"text": text})
            elif stream_mode == "values":
                final_state = payload

        if final_state is None:
            yield format_sse_event("error", {"message": "The agent did not return a response."})
            return
        yield format_sse_event("status", self._format_result(final_state))

    def confirm(self, proctor_id: str, approved: bool, subject: str | None = None,
                message: str | None = None, conversation_id: str | None = None,
                proctor_remarks: str | None = None) -> dict:
        """Resumes a graph paused on interrupt() inside communication_tools.py
        or report_tools.py. Same thread_id as chat() so this resumes the exact
        paused run, not a new conversation. subject/message/proctor_remarks
        carry the proctor's edits to the drafted content, if any."""
        graph = self._get_graph()
        config = {"configurable": {"thread_id": thread_id_for(proctor_id, conversation_id)}}
        result = graph.invoke(
            Command(resume={
                "approved": approved, "subject": subject, "message": message,
                "proctor_remarks": proctor_remarks,
            }),
            config=config,
        )
        return self._format_result(result)
