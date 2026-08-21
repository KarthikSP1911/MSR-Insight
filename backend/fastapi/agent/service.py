"""Orchestration layer between the FastAPI router and the LangGraph graph.

proctor_id always arrives here as an explicit parameter supplied by the caller
(Express, which has already verified the session) — it is never parsed out of
LLM output, and is the only source of truth threaded into tool authorization
checks via graph state.
"""
import logging
from langchain_core.messages import HumanMessage

from .graph import build_graph
from .checkpointer import get_checkpointer

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

    def _thread_id(self, proctor_id: str) -> str:
        return f"proctor:{proctor_id}"

    def chat(self, proctor_id: str, message: str) -> dict:
        graph = self._get_graph()
        config = {"configurable": {"thread_id": self._thread_id(proctor_id)}}
        result = graph.invoke(
            {"messages": [HumanMessage(content=message)], "proctor_id": proctor_id},
            config=config,
        )
        last = result["messages"][-1]
        return {"status": "ok", "reply": _extract_text(last.content)}
