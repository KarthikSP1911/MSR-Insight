def thread_id_for(proctor_id: str) -> str:
    """Single place defining the LangGraph thread id for a proctor's conversation,
    shared by service.py (which opens the graph) and tools (which log actions)."""
    return f"proctor:{proctor_id}"
