"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_BASE_URL } from "@/config/api.config";
import "@/styles/AgentPanel.css";

interface PendingAction {
  action_type: string;
  usn?: string;
  subject?: string;
  message?: string;
  pdf_base64?: string;
  include_proctor_remarks?: boolean;
  proctor_remarks?: string | null;
}

interface ChatEntry {
  kind: "text" | "pending" | "resolved-pending";
  role?: "user" | "assistant";
  text?: string;
  action?: PendingAction;
  resolution?: "approved" | "rejected";
}

interface AgentAlert {
  id: number;
  student_usn: string;
  risk_type: string;
  severity: string;
  message: string;
}

interface AgentPanelProps {
  proctorId: string;
  isOpen: boolean;
  onClose: () => void;
  onAlertCountChange?: (count: number) => void;
}

const sessionHeaders = () => ({
  "x-session-id": typeof window !== "undefined" ? localStorage.getItem("proctorSessionId") : null,
});

const ACTION_LABELS: Record<string, string> = {
  send_email: "Send Email",
  send_whatsapp: "Send WhatsApp Message",
  send_report_email: "Email Student Report",
};

const GREETING = "Hi, I'm your Agentic AI assistant. I can analyze at-risk students, summarize your week, look things up, and draft or send parent communications (with your approval first). What would you like to do?";

// Parses one "event: name\ndata: {...}\ndata: {...}" SSE frame (already
// split on the blank-line frame separator by the caller).
const parseSSEEvent = (raw: string): { event: string | null; data: any } => {
  let event: string | null = null;
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  let data: any = {};
  try {
    data = dataLines.length ? JSON.parse(dataLines.join("\n")) : {};
  } catch {
    data = {};
  }
  return { event, data };
};

export default function AgentPanel({ proctorId, isOpen, onClose, onAlertCountChange }: AgentPanelProps) {
  const [entries, setEntries] = useState<ChatEntry[]>([
    { kind: "text", role: "assistant", text: GREETING },
  ]);
  const [conversationId, setConversationId] = useState<string>(() =>
    typeof window !== "undefined" ? crypto.randomUUID() : ""
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedMessage, setEditedMessage] = useState("");
  const [editedProctorRemarks, setEditedProctorRemarks] = useState("");
  const [alerts, setAlerts] = useState<AgentAlert[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [digestShown, setDigestShown] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      fetchAlerts();
    }
  }, [entries, isOpen]);

  useEffect(() => {
    if (isOpen && !digestShown) {
      setDigestShown(true);
      fetchDigest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchDigest = async () => {
    try {
      const [alertsRes, remindersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/agent/${proctorId}/alerts`, { headers: sessionHeaders() }),
        axios.get(`${API_BASE_URL}/api/agent/${proctorId}/reminders/due-today`, { headers: sessionHeaders() }),
      ]);
      const alertCount = alertsRes.data?.data?.length || 0;
      const reminderCount = remindersRes.data?.data?.length || 0;
      if (alertCount === 0 && reminderCount === 0) return;

      const parts: string[] = [];
      if (reminderCount > 0) parts.push(`${reminderCount} reminder${reminderCount > 1 ? "s" : ""} due today`);
      if (alertCount > 0) parts.push(`${alertCount} flagged alert${alertCount > 1 ? "s" : ""}`);
      setEntries((prev) => [...prev, { kind: "text", role: "assistant", text: `Heads up -- you have ${parts.join(" and ")}.` }]);
    } catch (err) {
      console.error("Failed to fetch agent digest:", err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/agent/${proctorId}/alerts`, { headers: sessionHeaders() });
      const data: AgentAlert[] = res.data?.data || [];
      setAlerts(data);
      onAlertCountChange?.(data.length);
    } catch (err) {
      console.error("Failed to fetch agent alerts:", err);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setEntries((prev) => [...prev, { kind: "text", role: "user", text }, { kind: "text", role: "assistant", text: "" }]);
    setInputValue("");
    setIsLoading(true);

    // The placeholder assistant entry we just pushed is always the last
    // entry while a stream is in flight (isLoading blocks a second send).
    const replaceLastEntry = (entry: ChatEntry) =>
      setEntries((prev) => [...prev.slice(0, -1), entry]);

    let streamedText = "";
    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/${proctorId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": sessionHeaders()["x-session-id"] || "" },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      });
      if (!res.ok || !res.body) throw new Error(`Agent stream request failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const { event, data } = parseSSEEvent(rawEvent);
          if (!event) continue;

          if (event === "token") {
            streamedText += data.text || "";
            replaceLastEntry({ kind: "text", role: "assistant", text: streamedText });
          } else if (event === "status") {
            if (data.status === "pending_confirmation" && data.action) {
              replaceLastEntry({ kind: "pending", action: data.action });
              setPendingAction(data.action);
              setEditedSubject(data.action.subject || "");
              setEditedMessage(data.action.message || "");
              setEditedProctorRemarks(data.action.proctor_remarks || "");
            } else if (data.status === "ok") {
              replaceLastEntry({ kind: "text", role: "assistant", text: data.reply || streamedText });
              fetchAlerts();
            } else {
              replaceLastEntry({ kind: "text", role: "assistant", text: "Sorry, I couldn't process that request." });
            }
          } else if (event === "error") {
            replaceLastEntry({ kind: "text", role: "assistant", text: data.message || "Sorry, something went wrong." });
          }
        }
      }
    } catch (err) {
      replaceLastEntry({ kind: "text", role: "assistant", text: "Sorry, I couldn't reach the agent service. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentResponse = (data: any) => {
    if (data?.status === "pending_confirmation" && data.action) {
      setPendingAction(data.action);
      setEditedSubject(data.action.subject || "");
      setEditedMessage(data.action.message || "");
      setEditedProctorRemarks(data.action.proctor_remarks || "");
      setEntries((prev) => [...prev, { kind: "pending", action: data.action }]);
    } else if (data?.status === "ok") {
      setEntries((prev) => [...prev, { kind: "text", role: "assistant", text: data.reply || "" }]);
      fetchAlerts();
    } else {
      setEntries((prev) => [...prev, { kind: "text", role: "assistant", text: "Sorry, I couldn't process that request." }]);
    }
  };

  const resolveConfirmation = async (approved: boolean) => {
    if (!pendingAction || isLoading) return;
    setIsLoading(true);
    const isReport = pendingAction.action_type === "send_report_email";
    const finalAction = approved
      ? { ...pendingAction, subject: editedSubject, message: editedMessage, proctor_remarks: isReport ? editedProctorRemarks : pendingAction.proctor_remarks }
      : pendingAction;
    setEntries((prev) =>
      prev.map((e) => (e.kind === "pending" && e.action === pendingAction ? { ...e, action: finalAction, kind: "resolved-pending", resolution: approved ? "approved" : "rejected" } : e))
    );
    setPendingAction(null);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/agent/${proctorId}/confirm`,
        approved
          ? {
              approved,
              subject: editedSubject || undefined,
              message: editedMessage || undefined,
              proctor_remarks: isReport ? editedProctorRemarks || undefined : undefined,
              conversation_id: conversationId,
            }
          : { approved, conversation_id: conversationId },
        { headers: sessionHeaders() },
      );
      handleAgentResponse(res.data);
    } catch (err) {
      setEntries((prev) => [...prev, { kind: "text", role: "assistant", text: "Sorry, I couldn't reach the agent service to confirm that action." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendMessage(inputValue);
  };

  const quickAction = (prompt: string) => sendMessage(prompt);

  const startNewConversation = () => {
    if (isLoading) return;
    setConversationId(crypto.randomUUID());
    setEntries([{ kind: "text", role: "assistant", text: GREETING }]);
    setPendingAction(null);
    setInputValue("");
  };

  return (
    <>
      <div className={`agent-overlay ${isOpen ? "active" : ""}`} onClick={onClose}></div>
      <div className={`agent-panel ${isOpen ? "open" : ""}`}>
        <div className="agent-panel-header">
          <div className="agent-panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8" />
              <rect width="16" height="12" x="4" y="8" rx="2" />
              <path d="M2 14h2" />
              <path d="M20 14h2" />
              <path d="M15 13v2" />
              <path d="M9 13v2" />
            </svg>
            <span>Agentic AI</span>
          </div>
          <div className="agent-panel-header-actions">
            <button className="agent-new-conversation-btn" onClick={startNewConversation} disabled={isLoading} title="Start a new conversation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New
            </button>
            <button className="agent-panel-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="agent-alerts-section">
            <button className="agent-alerts-toggle" onClick={() => setAlertsOpen(!alertsOpen)}>
              <span>{alerts.length} student{alerts.length > 1 ? "s" : ""} flagged</span>
              <span className={`agent-alerts-chevron ${alertsOpen ? "open" : ""}`}>▾</span>
            </button>
            {alertsOpen && (
              <div className="agent-alerts-list">
                {alerts.map((a) => (
                  <div key={a.id} className={`agent-alert-card severity-${a.severity}`}>
                    <span className="agent-alert-usn">{a.student_usn}</span>
                    <span className="agent-alert-message">{a.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="agent-quick-actions">
          <button onClick={() => quickAction("Which of my students are at risk right now? Show evidence.")}>At-risk students</button>
          <button onClick={() => quickAction("Give me this week's priority insights.")}>Weekly insights</button>
        </div>

        <div className="agent-messages">
          {entries.map((entry, idx) => {
            if (entry.kind === "text") {
              return (
                <div key={idx} className={`agent-message ${entry.role}`}>
                  {entry.role === "assistant" ? (
                    <div className="markdown-container">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.text || ""}</ReactMarkdown>
                    </div>
                  ) : (
                    entry.text
                  )}
                </div>
              );
            }
            if (entry.kind === "pending" || entry.kind === "resolved-pending") {
              const action = entry.action!;
              const resolved = entry.kind === "resolved-pending";
              return (
                <div key={idx} className={`agent-approval-card ${resolved ? `resolved ${entry.resolution}` : ""}`}>
                  <div className="agent-approval-header">
                    <span className="agent-approval-badge">Approval needed</span>
                    <span className="agent-approval-type">{ACTION_LABELS[action.action_type] || action.action_type}</span>
                  </div>
                  <div className="agent-approval-body">
                    {action.usn && <div><strong>Student:</strong> {action.usn}</div>}
                    {!resolved && action.subject !== undefined && (
                      <div>
                        <strong>Subject:</strong>
                        <input
                          type="text"
                          className="agent-approval-edit-input"
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                    {!resolved && action.message !== undefined && (
                      <div>
                        <strong>Message:</strong>
                        <textarea
                          className="agent-approval-edit-textarea"
                          value={editedMessage}
                          onChange={(e) => setEditedMessage(e.target.value)}
                          disabled={isLoading}
                          rows={4}
                        />
                      </div>
                    )}
                    {resolved && action.subject && <div><strong>Subject:</strong> {action.subject}</div>}
                    {resolved && action.message && <div className="agent-approval-message">{action.message}</div>}
                    {action.action_type === "send_report_email" && action.pdf_base64 && (
                      <div>
                        <strong>Report preview:</strong>
                        <iframe
                          className="agent-approval-pdf-preview"
                          src={`data:application/pdf;base64,${action.pdf_base64}`}
                          title="Report preview"
                        />
                      </div>
                    )}
                    {action.action_type === "send_report_email" && action.include_proctor_remarks && !resolved && (
                      <div>
                        <strong>Proctor remarks:</strong>
                        <textarea
                          className="agent-approval-edit-textarea"
                          value={editedProctorRemarks}
                          onChange={(e) => setEditedProctorRemarks(e.target.value)}
                          disabled={isLoading}
                          rows={3}
                        />
                      </div>
                    )}
                    {action.action_type === "send_report_email" && action.include_proctor_remarks && resolved && action.proctor_remarks && (
                      <div className="agent-approval-message">{action.proctor_remarks}</div>
                    )}
                  </div>
                  {!resolved ? (
                    <div className="agent-approval-actions">
                      <button className="agent-approve-btn" onClick={() => resolveConfirmation(true)} disabled={isLoading}>Confirm</button>
                      <button className="agent-reject-btn" onClick={() => resolveConfirmation(false)} disabled={isLoading}>Reject</button>
                    </div>
                  ) : (
                    <div className={`agent-approval-outcome ${entry.resolution}`}>
                      {entry.resolution === "approved" ? "Confirmed" : "Rejected"}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
          {isLoading && (
            <div className="agent-progress-chip">
              <span className="agent-progress-dot"></span>
              Agent is working...
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="agent-input-area" onSubmit={handleSubmit}>
          <input
            type="text"
            className="agent-input"
            placeholder="Ask the agent to look something up or take an action..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="agent-send-btn" disabled={!inputValue.trim() || isLoading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}
