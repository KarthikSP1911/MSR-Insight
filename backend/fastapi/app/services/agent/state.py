from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """Graph state for the Agentic AI chatbot. Independent of the RAG chatbot's state."""
    messages: Annotated[list, add_messages]
    proctor_id: str
    conversation_id: str | None
