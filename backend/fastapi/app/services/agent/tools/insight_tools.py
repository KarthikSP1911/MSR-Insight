"""Weekly proctor insights. There's no historical snapshot table in this schema,
so 'weekly insights' is a best-effort prioritized summary of current risk
signals (reusing risk_tools' evidence-scoring), not a diff against last week --
that's documented in the tool description so the agent doesn't overclaim."""
from typing import Annotated

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState

from ..state import AgentState
from .risk_tools import _fetch_proctor_students, compute_risks
from .logging import log_action

SEVERITY_WEIGHT = {"high": 2, "medium": 1, "low": 0.5}


@tool
def generate_weekly_insights(state: Annotated[AgentState, InjectedState]) -> str:
    """Generate a prioritized weekly summary of the requesting proctor's
    students: who most needs attention right now, ranked by severity of
    attendance/CGPA/SGPA signals, plus a count of students currently on track.
    This reflects the students' current recorded state, not a week-over-week
    diff. Use this when the proctor asks for a weekly summary, overview, or
    "what should I focus on"."""
    proctor_id = state["proctor_id"]
    cid = state.get("conversation_id")
    students = _fetch_proctor_students(proctor_id)

    scored = []
    on_track = 0
    for student in students:
        findings = compute_risks(student)
        if not findings:
            on_track += 1
            continue
        score = sum(SEVERITY_WEIGHT.get(f["severity"], 0) for f in findings)
        scored.append({"usn": student["usn"], "name": student["name"], "findings": findings, "score": score})

    scored.sort(key=lambda e: e["score"], reverse=True)
    top = scored[:5]

    log_action(proctor_id, "weekly_insights", "completed",
               result={"flagged_count": len(scored), "on_track_count": on_track}, conversation_id=cid)

    if not scored:
        return f"All {on_track} of your students currently show no risk signals. Nothing urgent this week."

    lines = [f"Weekly priority summary ({len(scored)} student(s) need attention, {on_track} on track):"]
    for entry in top:
        lines.append(f"\n{entry['name']} ({entry['usn']}) -- priority score {entry['score']}:")
        for f in entry["findings"]:
            lines.append(f"  - [{f['severity'].upper()}] {f['message']}")
    if len(scored) > len(top):
        lines.append(f"\n...and {len(scored) - len(top)} more student(s) with lower-priority signals.")
    return "\n".join(lines)
