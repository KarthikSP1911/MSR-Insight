"use client";

import React, { useState } from "react";
import { Briefcase, User, Calendar, CheckCircle, Clock, ExternalLink, RefreshCw, ChevronDown } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface PlacementSectionProps {
    studentName: string;
    placementData?: {
        profile?: Record<string, string>;
        eligibilityEvents?: any[];
        inProgressEvents?: any[];
        completedEvents?: any[];
    } | null;
    handleUpdate: () => void;
    updateStatus: "loading" | "success" | "error" | null;
    isCooldownActive: boolean;
    formatTime: string;
}

interface ParsedEvent {
    company: string;
    type: string;
    appliedDate: string | null;
    eventDate: string | null;
    ctc: string | null;
    status: string;
    actionLink?: string;
    raw: any;
}

// Robust Date Parser
const parseDate = (str: string): Date | null => {
    if (!str) return null;
    const cleaned = str.replace(/-/g, "/").trim();
    const parts = cleaned.split("/");
    if (parts.length === 3) {
        if (parts[2].length === 4) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

// Calculate relative counters like (3 days ago) or (19 days left)
const getRelativeDateString = (dateStr: string | null): { text: string; color: string } | null => {
    if (!dateStr) return null;
    try {
        const d = parseDate(dateStr);
        if (!d) return null;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        
        const diffTime = d.getTime() - now.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return { text: "(Today)", color: "var(--accent-primary, #00ADB5)" };
        } else if (diffDays < 0) {
            const absDays = Math.abs(diffDays);
            if (absDays === 1) return { text: "(1 day ago)", color: "#10b981" };
            return { text: `(${absDays} days ago)`, color: "#10b981" };
        } else {
            if (diffDays === 1) return { text: "(1 day left)", color: "#ef4444" };
            return { text: `(${diffDays} days left)`, color: "#ef4444" };
        }
    } catch (e) {
        return null;
    }
};

// Parser to extract fields from unstructured Contineo scrapings
const parseEventData = (event: any): ParsedEvent => {
    const title = event.title || "";
    let company = title;
    let type = "Placement Event";
    
    const typeMatch = title.match(/^([^(]+)\(([^)]+)\)/);
    if (typeMatch) {
        company = typeMatch[1].trim();
        type = typeMatch[2].trim();
    } else {
        const text = event.textContent || "";
        const typeLook = text.match(/\b(Service|Product|Core|Direct|Internship)\b/i);
        if (typeLook) {
            type = typeLook[0];
        }
    }

    let appliedDate: string | null = null;
    let eventDate: string | null = null;
    let ctc: string | null = null;
    let status = "Open";

    const allText = [event.title, event.textContent, ...(event.details || [])].join(" ");

    const appliedMatch = allText.match(/(?:Applied\s+On|Applied\s+Date|Applied|Apply\s+Before)[:\s]+([0-9a-zA-Z\s\-/: ]+)/i);
    if (appliedMatch) {
        const rawDate = appliedMatch[1].trim();
        const dateOnlyMatch = rawDate.match(/\b\d{1,2}[-/\s]\d{1,2}[-/\s]\d{4}\b/);
        appliedDate = dateOnlyMatch ? dateOnlyMatch[0] : rawDate.split(/(?:\s{2,}|,|\.|\()/)[0].trim();
    }

    const eventDateMatch = allText.match(/(?:Event\s+Date|Date\s+of\s+Event|Event)[:\s]+([0-9a-zA-Z\s\-/: ]+)/i);
    if (eventDateMatch) {
        const rawDate = eventDateMatch[1].trim();
        const dateOnlyMatch = rawDate.match(/\b\d{1,2}[-/\s]\d{1,2}[-/\s]\d{4}\b/);
        eventDate = dateOnlyMatch ? dateOnlyMatch[0] : rawDate.split(/(?:\s{2,}|,|\.|\()/)[0].trim();
    }

    const ctcMatch = allText.match(/(?:₹?\s*\d+(?:\.\d+)?\s*(?:LPA|Lakhs|L)|CTC[:\s]+₹?\s*\d+(?:\.\d+)?\s*(?:LPA|Lakhs|L))/i);
    if (ctcMatch) {
        ctc = ctcMatch[0].replace(/CTC[:\s]+/i, "").trim();
        if (!ctc.startsWith("₹")) ctc = "₹" + ctc;
    }

    const statusMatch = allText.match(/(?:Status)[:\s]+([a-zA-Z\s]+)/i);
    if (statusMatch) {
        status = statusMatch[1].trim();
    } else {
        if (/under\s*progress/i.test(allText)) status = "Under Progress";
        else if (/registered/i.test(allText)) status = "Registered";
        else if (/eligible/i.test(allText)) status = "Eligible";
        else if (/applied/i.test(allText)) status = "Applied";
        else if (/selected/i.test(allText)) status = "Selected";
        else if (/rejected/i.test(allText)) status = "Rejected";
    }

    return {
        company,
        type,
        appliedDate,
        eventDate,
        ctc,
        status,
        actionLink: event.actionLink,
        raw: event
    };
};

const PlacementSection: React.FC<PlacementSectionProps> = ({
    studentName,
    placementData,
    handleUpdate,
    updateStatus,
    isCooldownActive,
    formatTime,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<"profile" | "eligibility" | "in_progress" | "completed">("eligibility");
    const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);
    const [eligibilityFilter, setEligibilityFilter] = useState<"active" | "exhausted">("active");

    const handleSubTabChange = (tab: "profile" | "eligibility" | "in_progress" | "completed") => {
        setActiveSubTab(tab);
        setSelectedEventIndex(0);
        setEligibilityFilter("active");
    };

    const profile = placementData?.profile || {};
    const eligibilityEvents = placementData?.eligibilityEvents || [];
    const inProgressEvents = placementData?.inProgressEvents || [];
    const completedEvents = placementData?.completedEvents || [];

    // Helper to identify exhausted/expired registration events
    const isEventExhausted = (parsed: ParsedEvent): boolean => {
        const statusLower = (parsed.status || "").toLowerCase();
        const rawLower = JSON.stringify(parsed.raw).toLowerCase();
        if (statusLower.includes("closed") || rawLower.includes("registration closed") || rawLower.includes("closed")) {
            return true;
        }
        if (parsed.appliedDate) {
            const d = parseDate(parsed.appliedDate);
            if (d) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                d.setHours(0, 0, 0, 0);
                if (d.getTime() < today.getTime()) {
                    return true;
                }
            }
        }
        return false;
    };

    const activeEligibilityEvents = eligibilityEvents.filter(e => !isEventExhausted(parseEventData(e)));
    const exhaustedEligibilityEvents = eligibilityEvents.filter(e => isEventExhausted(parseEventData(e)));

    const currentEligibilityEvents = eligibilityFilter === "active" ? activeEligibilityEvents : exhaustedEligibilityEvents;

    const isProfileEmpty = Object.keys(profile).length === 0;
    const hasAnyData = !isProfileEmpty || eligibilityEvents.length > 0 || inProgressEvents.length > 0 || completedEvents.length > 0;

    // Match fields case-insensitively
    const getFieldValue = (fieldKeys: string[]): string => {
        for (const k of fieldKeys) {
            const foundKey = Object.keys(profile).find(pk => pk.toLowerCase() === k.toLowerCase());
            if (foundKey && profile[foundKey]) {
                return profile[foundKey];
            }
        }
        return "N/A";
    };

    // Prepare categorized lists
    const generalFields: { label: string; val: string }[] = [
        { label: "Name", val: getFieldValue(['name', 'student name', 'candidate name']) },
        { label: "USN", val: getFieldValue(['usn', 'roll no', 'registration no']) },
        { label: "Department", val: getFieldValue(['department', 'dept', 'branch']) },
        { label: "Gender", val: getFieldValue(['gender', 'sex']) },
        { label: "Email", val: getFieldValue(['email', 'email id']) },
        { label: "Phone", val: getFieldValue(['phone', 'mobile', 'phone number', 'mobile number']) }
    ].filter(f => f.val !== "N/A");

    const academicFields: { label: string; val: string }[] = [
        { label: "Degree", val: getFieldValue(['degree', 'degree cgpa', 'cgpa', 'be/btech', 'degree %']) },
        { label: "Diploma %", val: getFieldValue(['diploma %', 'diploma', 'diploma percentage']) },
        { label: "PUC %", val: getFieldValue(['puc %', 'puc', '12th %', '12th percentage', '12th']) },
        { label: "SSLC %", val: getFieldValue(['sslc %', 'sslc', '10th %', '10th percentage', '10th']) }
    ].filter(f => f.val !== "N/A");

    // Collect any other unmapped fields
    const mappedKeys = new Set([
        'name', 'student name', 'candidate name', 'usn', 'roll no', 'registration no', 'gender', 'sex', 
        'department', 'dept', 'branch', 'email', 'email id', 'phone', 'mobile', 'phone number', 'mobile number',
        'degree', 'degree cgpa', 'cgpa', 'be/btech', 'degree %', 'diploma %', 'diploma', 'diploma percentage',
        'puc %', 'puc', '12th %', '12th percentage', '12th', 'sslc %', 'sslc', '10th %', '10th percentage', '10th'
    ]);
    
    Object.entries(profile).forEach(([key, val]) => {
        if (!mappedKeys.has(key.toLowerCase()) && val) {
            generalFields.push({ label: key, val });
        }
    });

    const renderEventsList = (events: any[], typeLabel: string, emptyIcon: React.ReactNode) => {
        if (events.length === 0) {
            return (
                <div className="empty-history" style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border-subtle, rgba(255, 255, 255, 0.1))", borderRadius: "16px", marginTop: "16px" }}>
                    <div style={{ marginBottom: "16px", opacity: 0.5 }}>{emptyIcon}</div>
                    <h4 style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>No {typeLabel} available</h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
                        There are currently no placement events listed in this category.
                    </p>
                </div>
            );
        }

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "24px" }}>
                {/* Stepper responsive stylesheets */}
                <style dangerouslySetInnerHTML={{ __html: `
                    .placement-stepper-container {
                        display: flex;
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: stretch;
                        gap: 16px;
                        position: relative;
                        z-index: 1;
                        width: 100%;
                    }
                    .placement-stepper-line {
                        position: absolute;
                        top: 50%;
                        left: 10%;
                        right: 10%;
                        height: 2px;
                        background: linear-gradient(90deg, rgba(0, 173, 181, 0.2) 0%, rgba(167, 139, 250, 0.4) 50%, rgba(0, 173, 181, 0.2) 100%);
                        transform: translateY(-50%);
                        z-index: 0;
                        width: 80%;
                    }
                    .desktop-step-card {
                        flex: 1 1 200px;
                        background: var(--bg-secondary, #1B2333);
                        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
                        border-radius: 12px;
                        padding: 20px 16px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        z-index: 1;
                    }
                    .desktop-avatar {
                        width: 48px;
                        height: 48px;
                        border-radius: 14px;
                        background: rgba(244, 63, 94, 0.15);
                        color: #f43f5e;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 22px;
                        font-weight: 800;
                        margin-bottom: 12px;
                    }
                    .desktop-step-title {
                        margin: 0 0 4px 0;
                        font-size: 15px;
                        font-weight: 700;
                        color: var(--text-primary);
                    }
                    .desktop-step-subtitle {
                        font-size: 11px;
                        color: var(--text-muted);
                        text-transform: uppercase;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .desktop-step-label {
                        font-size: 12px;
                        color: var(--text-muted);
                        margin-bottom: 10px;
                        font-weight: 600;
                    }
                    .desktop-step-value {
                        font-size: 14px;
                        font-weight: 700;
                        color: var(--text-primary);
                        margin-bottom: 6px;
                    }
                    .placement-desktop-timeline {
                        display: block;
                    }
                    .placement-mobile-stepper {
                        display: none;
                    }
                    .company-mobile-dropdown {
                        display: none !important;
                    }
                    @media (max-width: 900px) {
                        .placement-desktop-timeline {
                            display: none !important;
                        }
                        .placement-mobile-stepper {
                            display: flex !important;
                            flex-direction: column;
                            gap: 0;
                            width: 100%;
                        }
                        .mobile-step-card {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            background: var(--bg-secondary, #1B2333);
                            border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
                            border-radius: 10px;
                            padding: 8px 12px;
                            width: 100%;
                        }
                        .mobile-step-avatar {
                            width: 32px;
                            height: 32px;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 14px;
                            font-weight: 800;
                            flex-shrink: 0;
                        }
                        .mobile-step-content {
                            flex: 1;
                            min-width: 0;
                        }
                        .mobile-step-title {
                            margin: 0 0 2px 0;
                            font-size: 13px;
                            font-weight: 700;
                            color: var(--text-primary);
                        }
                        .mobile-step-subtitle {
                            font-size: 11px;
                            color: var(--text-muted);
                            display: block;
                        }
                        .mobile-step-arrow {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            color: var(--accent-primary, #00ADB5);
                            opacity: 0.7;
                            margin: 2px 0;
                        }
                        .company-mobile-dropdown {
                            display: flex !important;
                        }
                        .placement-event-item {
                            display: none !important;
                        }
                        .placement-event-item.mobile-active {
                            display: block !important;
                        }
                    }
                `}} />

                {/* Mobile Dropdown for switching Events */}
                {events.length > 1 && (
                    <div className="company-mobile-dropdown" style={{ marginBottom: "16px", gap: "10px", alignItems: "center", width: "100%" }}>
                        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                            <select
                                value={selectedEventIndex}
                                onChange={(e) => setSelectedEventIndex(parseInt(e.target.value, 10))}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    background: "var(--bg-secondary, #1B2333)",
                                    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                                    borderRadius: "10px",
                                    color: "var(--text-primary)",
                                    outline: "none",
                                    cursor: "pointer",
                                    appearance: "none",
                                    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg fill='%2300ADB5' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>\")",
                                    backgroundRepeat: "no-repeat",
                                    backgroundPosition: "right 12px center",
                                    paddingRight: "32px"
                                }}
                            >
                                {events.map((event, idx) => {
                                    const parsed = parseEventData(event);
                                    return (
                                        <option key={idx} value={idx}>
                                            {parsed.company} ({parsed.status})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div style={{
                            background: "rgba(0, 173, 181, 0.1)",
                            color: "var(--accent-primary, #00ADB5)",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: "700",
                            border: "1px solid rgba(0, 173, 181, 0.2)",
                            whiteSpace: "nowrap"
                        }}>
                            {events.length} {events.length === 1 ? "Event" : "Events"}
                        </div>
                    </div>
                )}

                {events.map((event, idx) => {
                    const parsed = parseEventData(event);
                    const appliedRelative = getRelativeDateString(parsed.appliedDate);
                    const eventRelative = getRelativeDateString(parsed.eventDate);

                    return (
                        <div 
                            key={idx} 
                            className={`placement-event-item ${events.length <= 1 || selectedEventIndex === idx ? 'mobile-active' : ''}`}
                            style={{ 
                                background: "var(--bg-card, #131A26)", 
                                border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                                borderRadius: "16px",
                                padding: "24px",
                                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
                            }}
                        >
                            {/* Card Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                                <span style={{ 
                                    fontSize: "12px", 
                                    fontWeight: "700", 
                                    color: "var(--accent-primary, #00ADB5)", 
                                    textTransform: "uppercase",
                                    letterSpacing: "1px"
                                }}>
                                    {typeLabel}
                                </span>
                                
                                {parsed.actionLink && (
                                    <a 
                                        href={parsed.actionLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ 
                                            padding: "8px 16px", 
                                            fontSize: "13px", 
                                            fontWeight: "600",
                                            display: "inline-flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: "8px",
                                            background: "rgba(0, 173, 181, 0.1)",
                                            color: "var(--accent-primary, #00ADB5)",
                                            border: "1px solid rgba(0, 173, 181, 0.2)",
                                            borderRadius: "8px",
                                            textDecoration: "none",
                                            transition: "all 0.2s ease"
                                        }}
                                        className="placement-action-btn"
                                    >
                                        Register <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>

                            <div style={{ position: "relative", width: "100%" }}>
                                {/* Desktop Stepper layout */}
                                <div className="placement-desktop-timeline">
                                    <div className="placement-stepper-line" />
                                    <div className="placement-stepper-container">
                                        {/* 1. Company Logo & Details */}
                                        <div className="desktop-step-card">
                                            <div className="desktop-avatar">
                                                {parsed.company.charAt(0).toUpperCase()}
                                            </div>
                                            <h4 className="desktop-step-title">{parsed.company}</h4>
                                            <span className="desktop-step-subtitle">{parsed.type}</span>
                                        </div>

                                        {/* 2. Applied Date */}
                                        <div className="desktop-step-card">
                                            <span className="desktop-step-label">
                                                {typeLabel.toLowerCase().includes("register") ? "Apply Before" : "Applied On"}
                                            </span>
                                            <span className="desktop-step-value">{parsed.appliedDate || "TBD"}</span>
                                            {appliedRelative ? (
                                                <span style={{ fontSize: "11px", color: appliedRelative.color, fontWeight: "600" }}>{appliedRelative.text}</span>
                                            ) : (
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>-</span>
                                            )}
                                        </div>

                                        {/* 3. Event Date */}
                                        <div className="desktop-step-card">
                                            <span className="desktop-step-label">Event Date</span>
                                            <span className="desktop-step-value">{parsed.eventDate || "TBD"}</span>
                                            {eventRelative ? (
                                                <span style={{ fontSize: "11px", color: eventRelative.color, fontWeight: "600" }}>{eventRelative.text}</span>
                                            ) : (
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>-</span>
                                            )}
                                        </div>

                                        {/* 4. Status & CTC */}
                                        <div className="desktop-step-card">
                                            <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--accent-primary, #00ADB5)", marginBottom: "10px" }}>{parsed.ctc || "CTC: TBD"}</span>
                                            <span style={{ 
                                                fontSize: "15px", 
                                                fontWeight: "800", 
                                                color: parsed.status.toLowerCase().includes("progress") ? "#a78bfa" : 
                                                       parsed.status.toLowerCase().includes("selected") ? "#10b981" : 
                                                       parsed.status.toLowerCase().includes("rejected") ? "#ef4444" : "var(--text-primary)"
                                            }}>{parsed.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Stepper layout */}
                                <div className="placement-mobile-stepper">
                                    {/* Step 1: Company */}
                                    <div className="mobile-step-card">
                                        <div className="mobile-step-avatar" style={{ background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e" }}>
                                            {parsed.company.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="mobile-step-content">
                                            <h4 className="mobile-step-title">{parsed.company}</h4>
                                            <span className="mobile-step-subtitle">{parsed.type}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mobile-step-arrow">
                                        <ChevronDown size={14} />
                                    </div>

                                    {/* Step 2: Applied Date */}
                                    <div className="mobile-step-card">
                                        <div className="mobile-step-avatar" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                            A
                                        </div>
                                        <div className="mobile-step-content">
                                            <h4 className="mobile-step-title">
                                                {typeLabel.toLowerCase().includes("register") ? "Apply Before" : "Applied On"}
                                            </h4>
                                            <span className="mobile-step-subtitle">
                                                {parsed.appliedDate || "TBD"}{appliedRelative && ` • ${appliedRelative.text}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mobile-step-arrow">
                                        <ChevronDown size={14} />
                                    </div>

                                    {/* Step 3: Event Date */}
                                    <div className="mobile-step-card">
                                        <div className="mobile-step-avatar" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                                            E
                                        </div>
                                        <div className="mobile-step-content">
                                            <h4 className="mobile-step-title">Event Date</h4>
                                            <span className="mobile-step-subtitle">
                                                {parsed.eventDate || "TBD"}{eventRelative && ` • ${eventRelative.text}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mobile-step-arrow">
                                        <ChevronDown size={14} />
                                    </div>

                                    {/* Step 4: Status & CTC */}
                                    <div className="mobile-step-card">
                                        <div className="mobile-step-avatar" style={{ 
                                            background: "rgba(167, 139, 250, 0.15)", 
                                            color: "#a78bfa"
                                        }}>
                                            S
                                        </div>
                                        <div className="mobile-step-content">
                                            <h4 className="mobile-step-title" style={{ color: "var(--accent-primary, #00ADB5)" }}>
                                                {parsed.ctc || "CTC: TBD"}
                                            </h4>
                                            <span className="mobile-step-subtitle" style={{ 
                                                fontWeight: "700", 
                                                color: parsed.status.toLowerCase().includes("progress") ? "#a78bfa" : 
                                                       parsed.status.toLowerCase().includes("selected") ? "#10b981" : 
                                                       parsed.status.toLowerCase().includes("rejected") ? "#ef4444" : "var(--text-primary)"
                                            }}>
                                                {parsed.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <style dangerouslySetInnerHTML={{ __html: `
                .sync-btn {
                    transition: all 0.2s ease;
                }
                .placements-desktop-tabs {
                    display: flex !important;
                }
                .placements-mobile-dropdown-container {
                    display: none !important;
                }
                @media (max-width: 768px) {
                    .sync-btn {
                        display: inline-flex !important;
                        flex-direction: row !important;
                        align-items: center !important;
                        justify-content: center !important;
                        white-space: nowrap !important;
                        width: auto !important;
                        padding: 8px 18px !important;
                        font-size: 13px !important;
                        font-weight: 600 !important;
                        border-radius: 9999px !important;
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)) !important;
                        border: 1px solid rgba(0, 173, 181, 0.3) !important;
                        box-shadow: 0 4px 12px rgba(0, 173, 181, 0.15) !important;
                        color: var(--text-primary) !important;
                        gap: 8px !important;
                    }
                    .sync-btn:disabled {
                        opacity: 0.6 !important;
                        box-shadow: none !important;
                        cursor: not-allowed !important;
                    }
                    .dashboard-header-container {
                        margin-bottom: 12px !important;
                    }
                    .tab-content {
                        gap: 16px !important;
                    }
                    .placements-desktop-tabs {
                        display: none !important;
                    }
                    .placements-mobile-dropdown-container {
                        display: block !important;
                    }
                }
                @media (max-width: 600px) {
                    .placements-profile-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 10px !important;
                        width: 100% !important;
                    }
                    .placements-profile-grid > div {
                        padding: 10px 12px !important;
                        min-width: 0 !important;
                        overflow-wrap: break-word !important;
                        word-break: break-word !important;
                    }
                    .placements-profile-grid > div > div {
                        overflow-wrap: break-word !important;
                        word-break: break-word !important;
                    }
                }
                @media (max-width: 480px) {
                    .profile-btn-text {
                        display: none !important;
                    }
                }
            `}} />

            <DashboardHeader 
                name={studentName} 
                sectionTitle="Placement Portal" 
                sectionSubtitle="Track your job applications, profile eligibility, and registration opportunities" 
                actions={
                    <button 
                        onClick={handleUpdate} 
                        disabled={isCooldownActive || updateStatus === "loading"}
                        className="nav-button sync-btn"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 16px",
                            background: isCooldownActive ? "rgba(255, 255, 255, 0.05)" : "var(--accent-primary, #00ADB5)",
                            color: isCooldownActive ? "var(--text-muted)" : "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "14px",
                            cursor: (isCooldownActive || updateStatus === "loading") ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <RefreshCw size={16} className={updateStatus === "loading" ? "animate-spin" : ""} />
                        {updateStatus === "loading" ? "Syncing..." : isCooldownActive ? `Try in ${formatTime}` : "Sync Placements"}
                    </button>
                }
            />

            {!hasAnyData ? (
                <div className="chart-card" style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "16px" }}>
                    <div style={{ padding: "16px", borderRadius: "50%", background: "rgba(0, 173, 181, 0.1)", color: "var(--accent-primary, #00ADB5)" }}>
                        <Briefcase size={36} />
                    </div>
                    <div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>No Placement Data Found</h3>
                        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", maxWidth: "480px", lineHeight: "1.5" }}>
                            Your placement eligibility profile and events have not been cached yet. Click the **Sync Placements** button above to scrape the latest details from the college portal.
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Navigation bar with Sub-Tabs on Left and Profile Icon on Right */}
                    <div className="chart-card" style={{ padding: "24px" }}>
                        <div style={{ borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))", paddingBottom: "16px", display: "flex", gap: "12px", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                            {/* Left: Desktop Tabs / Mobile Dropdown */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Desktop Layout: Sub-Tab Buttons */}
                                <div className="placements-desktop-tabs">
                                    <div className="cn-tab-group-container" style={{ display: "flex", flex: 1, overflowX: "auto", paddingBottom: "2px" }}>
                                        <div className="uk-button-group cn-tab-group" style={{ display: "flex", gap: "4px", background: "var(--bg-secondary, rgba(0, 0, 0, 0.2))", padding: "4px", borderRadius: "10px" }}>
                                            {[
                                                { id: "eligibility", label: "Events to Register", count: eligibilityEvents.length },
                                                { id: "in_progress", label: "In Progress", count: inProgressEvents.length },
                                                { id: "completed", label: "Completed", count: completedEvents.length }
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => handleSubTabChange(tab.id as any)}
                                                    className={`placements-tab-btn ${activeSubTab === tab.id ? 'active' : ''}`}
                                                    style={{
                                                        padding: "8px 16px",
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        background: activeSubTab === tab.id ? "var(--bg-card, #1B2333)" : "transparent",
                                                        color: activeSubTab === tab.id ? "var(--accent-primary, #00ADB5)" : "var(--text-muted)",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        transition: "all 0.2s ease",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    {tab.label}
                                                    {tab.count > 0 && (
                                                        <span style={{ 
                                                            fontSize: "10px", 
                                                            padding: "2px 6px", 
                                                            borderRadius: "10px", 
                                                            background: activeSubTab === tab.id ? "var(--accent-primary, #00ADB5)" : "rgba(255,255,255,0.1)",
                                                            color: activeSubTab === tab.id ? "#fff" : "var(--text-primary)"
                                                        }}>
                                                            {tab.count}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Layout: Dropdown */}
                                <div className="placements-mobile-dropdown-container">
                                    <div style={{ position: "relative", width: "100%" }}>
                                        <select
                                            value={activeSubTab === "profile" ? "select" : activeSubTab}
                                            onChange={(e) => {
                                                if (e.target.value !== "select") {
                                                    handleSubTabChange(e.target.value as any);
                                                }
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "10px 14px",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                background: "var(--bg-secondary, #1B2333)",
                                                border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                                                borderRadius: "10px",
                                                color: "var(--text-primary)",
                                                outline: "none",
                                                cursor: "pointer",
                                                appearance: "none",
                                                backgroundImage: "url(\"data:image/svg+xml;utf8,<svg fill='%2300ADB5' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>\")",
                                                backgroundRepeat: "no-repeat",
                                                backgroundPosition: "right 12px center",
                                                paddingRight: "32px"
                                            }}
                                        >
                                            {activeSubTab === "profile" && (
                                                <option value="select" disabled>Select Event Category...</option>
                                            )}
                                            <option value="eligibility">Events to Register ({eligibilityEvents.length})</option>
                                            <option value="in_progress">Events In Progress ({inProgressEvents.length})</option>
                                            <option value="completed">Completed Events ({completedEvents.length})</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Profile Sub-Tab Button */}
                            {!isProfileEmpty && (
                                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                                    <button
                                        onClick={() => handleSubTabChange("profile")}
                                        className={`placements-tab-btn ${activeSubTab === "profile" ? 'profile-active' : ''}`}
                                        style={{
                                            padding: "8px 16px",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            border: "none",
                                            borderRadius: "8px",
                                            background: activeSubTab === "profile" ? "var(--accent-primary, #00ADB5)" : "var(--bg-secondary, rgba(0, 0, 0, 0.2))",
                                            color: activeSubTab === "profile" ? "#fff" : "var(--text-muted)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <User size={16} />
                                        <span className="profile-btn-text">Profile Details</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Profile Tab Details Render */}
                        {activeSubTab === "profile" && !isProfileEmpty && (
                            <div style={{ marginTop: "24px" }}>
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .profile-dual-columns {
                                        display: flex;
                                        gap: 24px;
                                        width: 100%;
                                    }
                                    .profile-column-card {
                                        flex: 1;
                                        background: var(--bg-card, #131A26);
                                        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
                                        border-radius: 12px;
                                        padding: 20px;
                                    }
                                    .profile-column-title {
                                        font-size: 15px;
                                        font-weight: 700;
                                        color: var(--accent-primary, #00ADB5);
                                        margin: 0 0 16px 0;
                                        text-transform: uppercase;
                                        letter-spacing: 0.5px;
                                        border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
                                        padding-bottom: 10px;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                    }
                                    @media (max-width: 900px) {
                                        .profile-dual-columns {
                                            flex-direction: column;
                                            gap: 16px;
                                        }
                                    }
                                `}} />

                                <div className="profile-dual-columns">
                                    {/* Left Column: Personal Information */}
                                    <div className="profile-column-card">
                                        <h4 className="profile-column-title">
                                            <User size={18} />
                                            General Information
                                        </h4>
                                        <div className="placements-profile-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                                            {generalFields.map(f => (
                                                <div 
                                                    key={f.label} 
                                                    style={{ 
                                                        padding: "12px 14px", 
                                                        background: "var(--bg-secondary, rgba(255, 255, 255, 0.02))", 
                                                        border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.04))",
                                                        borderRadius: "10px" 
                                                    }}
                                                >
                                                    <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.5px", marginBottom: "4px" }}>
                                                        {f.label}
                                                    </div>
                                                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                                                        {f.val}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Column: Academic Records */}
                                    <div className="profile-column-card">
                                        <h4 className="profile-column-title">
                                            <Briefcase size={18} />
                                            Academic Records
                                        </h4>
                                        <div className="placements-profile-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                                            {academicFields.map(f => (
                                                <div 
                                                    key={f.label} 
                                                    style={{ 
                                                        padding: "12px 14px", 
                                                        background: "var(--bg-secondary, rgba(255, 255, 255, 0.02))", 
                                                        border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.04))",
                                                        borderRadius: "10px" 
                                                    }}
                                                >
                                                    <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.5px", marginBottom: "4px" }}>
                                                        {f.label}
                                                    </div>
                                                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                                                        {f.val}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: "24px", fontSize: "12px", color: "#ef4444", fontWeight: "500" }}>
                                    * Contact Placement cell in case of any changes.
                                </div>
                            </div>
                        )}

                        {activeSubTab === "eligibility" && (
                            <>
                                {/* Segmented control / filter switcher */}
                                <div style={{ display: "flex", gap: "8px", marginBottom: "20px", marginTop: "16px" }}>
                                    <button
                                        onClick={() => { setEligibilityFilter("active"); setSelectedEventIndex(0); }}
                                        style={{
                                            padding: "8px 16px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            borderRadius: "20px",
                                            border: "none",
                                            background: eligibilityFilter === "active" ? "rgba(0, 173, 181, 0.15)" : "var(--bg-secondary, rgba(255, 255, 255, 0.02))",
                                            color: eligibilityFilter === "active" ? "var(--accent-primary, #00ADB5)" : "var(--text-muted)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        Active / Upcoming
                                        <span style={{
                                            background: eligibilityFilter === "active" ? "var(--accent-primary, #00ADB5)" : "rgba(255,255,255,0.08)",
                                            color: eligibilityFilter === "active" ? "#fff" : "var(--text-primary)",
                                            fontSize: "10px",
                                            padding: "2px 6px",
                                            borderRadius: "10px",
                                            fontWeight: "800"
                                        }}>
                                            {activeEligibilityEvents.length}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => { setEligibilityFilter("exhausted"); setSelectedEventIndex(0); }}
                                        style={{
                                            padding: "8px 16px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            borderRadius: "20px",
                                            border: "none",
                                            background: eligibilityFilter === "exhausted" ? "rgba(239, 68, 68, 0.15)" : "var(--bg-secondary, rgba(255, 255, 255, 0.02))",
                                            color: eligibilityFilter === "exhausted" ? "#ef4444" : "var(--text-muted)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        Exhausted
                                        <span style={{
                                            background: eligibilityFilter === "exhausted" ? "#ef4444" : "rgba(255,255,255,0.08)",
                                            color: eligibilityFilter === "exhausted" ? "#fff" : "var(--text-primary)",
                                            fontSize: "10px",
                                            padding: "2px 6px",
                                            borderRadius: "10px",
                                            fontWeight: "800"
                                        }}>
                                            {exhaustedEligibilityEvents.length}
                                        </span>
                                    </button>
                                </div>
                                {renderEventsList(currentEligibilityEvents, "events to register", <Calendar size={32} color="var(--text-muted)" />)}
                            </>
                        )}
                        {activeSubTab === "in_progress" && renderEventsList(inProgressEvents, "events in progress", <Clock size={32} color="var(--text-muted)" />)}
                        {activeSubTab === "completed" && renderEventsList(completedEvents, "completed events", <CheckCircle size={32} color="var(--text-muted)" />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlacementSection;
