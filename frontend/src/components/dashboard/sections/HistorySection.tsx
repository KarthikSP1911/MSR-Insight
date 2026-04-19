"use client";

import React from "react";
import { History } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface HistorySectionProps {
    studentName: string;
    examHistory: any[];
    selectedHistoryIdx: number;
    setSelectedHistoryIdx: (idx: number) => void;
    GRADE_COLORS: Record<string, string>;
}

const HistorySection: React.FC<HistorySectionProps> = ({
    studentName,
    examHistory,
    selectedHistoryIdx,
    setSelectedHistoryIdx,
    GRADE_COLORS
}) => {
    if (examHistory.length === 0) {
        return (
            <div className="tab-content">
                <DashboardHeader name={studentName} sectionTitle="Exam History" sectionSubtitle="Complete record of your academic performance" />
                <div className="empty-history">
                    <History size={48} color="var(--text-muted)" />
                    <h3>No exam history available</h3>
                </div>
            </div>
        );
    }

    const reversedHistory = [...examHistory].reverse();

    return (
        <div className="tab-content">
            <DashboardHeader name={studentName} sectionTitle="Exam History" sectionSubtitle="Complete record of your academic performance" />

            <div className="history-tab-container">
                {/* Mobile Semester Selector */}
                <div className="mobile-history-selector">
                    <label htmlFor="sem-select" className="stat-label" style={{ paddingLeft: '4px', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Select Semester</label>
                    <select 
                        id="sem-select"
                        className="sem-history-select" 
                        value={selectedHistoryIdx}
                        onChange={(e) => setSelectedHistoryIdx(parseInt(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none',
                            appearance: 'none'
                        }}
                    >
                        {reversedHistory.map((sem: any, idx: number) => (
                            <option key={idx} value={idx}>
                                {sem.semester} (SGPA: {sem.sgpa})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="history-grid">
                    {reversedHistory.map((sem: any, idx: number) => (
                        <div key={idx} className={`chart-card history-card ${selectedHistoryIdx === idx ? 'mobile-show' : 'mobile-hide'}`}>
                            <div className="chart-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <div>
                                    <span className="pill" style={{ marginBottom: '8px', display: 'inline-block' }}>Semester {examHistory.length - idx}</span>
                                    <h3 className="chart-title" style={{ margin: 0 }}>{sem.semester}</h3>
                                </div>
                                <div className="history-sgpa-badge" style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div className="stat-label" style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SGPA</div>
                                    <div className="stat-value" style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)', lineHeight: 1 }}>{sem.sgpa}</div>
                                </div>
                            </div>
                            <div className="dashboard-table-container">
                                <table className="dashboard-table">
                                    <thead><tr><th>Code</th><th>Course</th><th style={{ textAlign: 'right' }}>Grade</th></tr></thead>
                                    <tbody>
                                        {sem.courses?.map((c: any, i: number) => (
                                            <tr key={i}>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{c.code}</td>
                                                <td style={{ fontSize: '13px' }}>{c.name}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: GRADE_COLORS[c.grade] || 'var(--text-primary)' }}>{c.grade}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HistorySection;
