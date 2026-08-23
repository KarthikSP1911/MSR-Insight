def thread_id_for(proctor_id: str, conversation_id: str | None = None) -> str:
    """Single place defining the LangGraph thread id for a proctor's conversation,
    shared by service.py (which opens the graph) and tools (which log actions).
    A long-lived single thread per proctor was found to degrade reply quality
    over time, so callers scope by conversation_id (falling back to "default"
    for callers that don't pass one)."""
    return f"proctor:{proctor_id}:{conversation_id or 'default'}"
