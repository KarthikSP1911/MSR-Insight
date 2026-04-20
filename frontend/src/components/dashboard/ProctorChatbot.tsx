"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import "@/styles/ProctorChatbot.css";

interface Message {
  text: string;
  isUser: boolean;
}

interface ProctorChatbotProps {
  proctorId: string;
}

export default function ProctorChatbot({ proctorId }: ProctorChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I am your AI assistant. You can ask me academic questions about your assigned students.", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue("");
    setMessages(prev => [...prev, { text: userText, isUser: true }]);
    setIsLoading(true);

    try {
      const sessionId = localStorage.getItem("proctorSessionId");
      
      const response = await axios.post(`${API_BASE_URL}/api/proctor/${proctorId}/chat`, {
        message: userText
      }, {
        headers: { "x-session-id": sessionId || "" }
      });

      if (response.data.success) {
        setMessages(prev => [...prev, { text: response.data.data.text, isUser: false }]);
      } else {
        setMessages(prev => [...prev, { text: "Sorry, I couldn't process that request properly.", isUser: false }]);
      }
    } catch (err: any) {
      console.error("Chat API Error:", err);
      setMessages(prev => [...prev, { text: "Network error or API is unavailable. Please check your connection or try again later.", isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Smart line-by-line parser for local SLM output
  const renderMessage = (text: string) => {
    const lines = text.split('\n');
    const htmlLines: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        htmlLines.push('<div class="chat-spacer"></div>');
        return;
      }

      // Inline bold: **...**
      const inlineBold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // 1. Bold-only heading line e.g. "**AJAY KUMAR**"
      if (/^\*\*.*\*\*$/.test(trimmed)) {
        htmlLines.push(`<div class="chat-heading">${inlineBold(trimmed)}</div>`);
        return;
      }

      // 2. Dash bullet ending with ":" (with or without ** bold) → section label
      // Handles: "- Attendance:" AND "- **Attendance:**"
      const stripped = trimmed.replace(/\*\*/g, '');
      if (/^- .+:$/.test(stripped)) {
        const label = inlineBold(trimmed.slice(2));
        htmlLines.push(`<div class="chat-section-label">${label}</div>`);
        return;
      }

      // 3. Normal dash bullet e.g. "- Machine Learning: 88%"
      if (/^- /.test(trimmed)) {
        const content = inlineBold(trimmed.slice(2));
        htmlLines.push(`<div class="chat-bullet">• ${content}</div>`);
        return;
      }

      // 4. Numbered list e.g. "1. Observation"
      if (/^\d+\.\s/.test(trimmed)) {
        const content = inlineBold(trimmed.replace(/^\d+\.\s/, ''));
        htmlLines.push(`<div class="chat-bullet">${content}</div>`);
        return;
      }

      // 5. Plain text
      htmlLines.push(`<div class="chat-line">${inlineBold(trimmed)}</div>`);
    });

    return <div dangerouslySetInnerHTML={{ __html: htmlLines.join('') }} />;
  };

  return (
    <div className="chatbot-wrapper">
      <div className={`chatbot-window ${isOpen ? "open" : ""}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-title">
            <div className="pulse-dot"></div>
            Insight AI
          </div>
          <button className="close-btn" onClick={handleToggle} title="Close Chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="chatbot-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chatbot-message ${msg.isUser ? "user" : "bot"}`}>
              {msg.isUser ? msg.text : renderMessage(msg.text)}
            </div>
          ))}
          {isLoading && (
            <div className="chatbot-message bot">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            className="chatbot-input" 
            placeholder="Type a message..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit" 
            className="chatbot-send-btn" 
            disabled={!inputValue.trim() || isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>

      <button className="chatbot-toggle-btn" onClick={handleToggle} title="Open Insight AI Chat">
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        )}
      </button>
    </div>
  );
}
