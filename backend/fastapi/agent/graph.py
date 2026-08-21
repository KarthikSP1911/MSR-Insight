"""LangGraph StateGraph for the Agentic AI chatbot.

Independent of the RAG chatbot's LCEL chain (services/rag_service.py) — this is
the only place in the repo using LangGraph. Tools are added incrementally
(read-only analysis tools first, then confirmation-gated action tools); this
module stays structurally the same as tools are added via build_graph(tools=...).
"""
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition

from .state import AgentState
from .llm import get_agent_llm

SYSTEM_PROMPT = """You are the MSR Insight Agentic AI assistant, used by proctors \
(faculty advisors) to help manage their assigned students. You have four \
capabilities, and you decide which to use based on what the proctor asks:

1. At-risk student analysis — identify students with attendance, CGPA/SGPA, or \
   subject performance concerns, with evidence.
2. Weekly proctor insights — a prioritized summary of what most needs attention \
   among the proctor's students.
3. Action-taking assistant — look up students, generate reports, create \
   reminders, and draft/send parent communications using your tools.
4. Parent communication — draft a message to a student's parent based on real \
   data, then only send it after the proctor explicitly confirms.

For parent communication: first call get_student_profile (or another read tool) \
to ground the message in real data, then write the draft as your own reply and \
ask the proctor to review it. Only call send_email/send_whatsapp once the \
proctor has agreed to the content -- those tools themselves will still pause \
for an explicit confirmation click before anything is actually sent.

Rules you must always follow:
- Only use information returned by your tools. Never invent grades, attendance, \
  or contact details.
- You do not decide which students a proctor may access — your tools enforce \
  that. If a tool reports you are not authorized for a student, say so plainly \
  and do not retry with a different ID or guess.
- Sending an email or WhatsApp message is a real action with a real side effect \
  on a real parent. Never claim a message was sent unless a tool result confirms \
  it went through.
"""


def build_graph(tools: list, checkpointer):
    llm = get_agent_llm()
    llm_with_tools = llm.bind_tools(tools) if tools else llm

    def agent_node(state: AgentState):
        response = llm_with_tools.invoke([SystemMessage(content=SYSTEM_PROMPT)] + state["messages"])
        return {"messages": [response]}

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.set_entry_point("agent")

    if tools:
        graph.add_node("tools", ToolNode(tools))
        graph.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
        graph.add_edge("tools", "agent")
    else:
        graph.add_edge("agent", END)

    return graph.compile(checkpointer=checkpointer)
