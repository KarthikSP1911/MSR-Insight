from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """Graph state for the Agentic AI chatbot. Independent of the RAG chatbot's state."""
    messages: Annotated[list, add_messages]
    proctor_id: str
