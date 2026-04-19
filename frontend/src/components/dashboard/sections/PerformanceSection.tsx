"use client";

import React from "react";
import { Award, BookOpen, Layers, Calendar, TrendingUp } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { UpdateButton } from "@/components/dashboard/UpdateButton";

interface PerformanceSectionProps {
    student: any;
    currentSem: any[];
    overallAttendance: number;
    totalCredits: number;
    maxCredits: number;
    currentCgpa: string | null;
    onSelectSubject: (subject: any) => void;
    handleUpdate: () => void;
    updateStatus: 'loading' | 'success' | 'error' | null;
    isCooldownActive: boolean;
    formatTime: string;
    examHistory: any[];
    latestSGPA: number;
    sgpaDiff: string;
    isImproved: boolean;
}

const CHART_COLORS = [
    'var(--accent-primary)', '#6366F1', '#10b981', '#f59e0b', '#ef4444', 
    '#ec4899', '#3b82f6', '#14b8a6',
];

import { 
    RadialBarChart, RadialBar, Tooltip, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";

const AttendanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="custom-chart-tooltip" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <p className="tooltip-title">{data.name}</p>
                <div className="tooltip-divider"></div>
                <div className="tooltip-row">
                    <span className="tooltip-label">Code</span>
                    <span className="tooltip-value">{data.code}</span>
                </div>
                <div className="tooltip-row">
                    <span className="tooltip-label">Attendance</span>
                    <span className="tooltip-value" style={{ color: data.fill || 'var(--accent-primary)' }}>{data.attendance}%</span>
                </div>
            </div>
        );
    }
    return null;
};

const MarksTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="custom-chart-tooltip" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <p className="tooltip-title">{data.name}</p>
                <div className="tooltip-divider"></div>
                <div className="tooltip-row">
                    <span className="tooltip-label">Code</span>
                    <span className="tooltip-value">{data.code}</span>
                </div>
                <div className="tooltip-row">
                    <span className="tooltip-label">Internal Marks</span>
                    <span className="tooltip-value" style={{ color: 'var(--accent-primary)' }}>{data.marks} / 50</span>
                </div>
            </div>
        );
    }
    return null;
};

const PerformanceSection: React.FC<PerformanceSectionProps> = ({
    student,
    currentSem,
    overallAttendance,
    totalCredits,
    maxCredits,
    currentCgpa,
    onSelectSubject,
    handleUpdate,
    updateStatus,
    isCooldownActive,
    formatTime,
    examHistory,
    latestSGPA,
    sgpaDiff,
    isImproved
}) => {
    return (
        <div className="tab-content">
            <DashboardHeader
                name={student?.name}
                sectionTitle="Current Semester Performance"
                sectionSubtitle="A detailed breakdown of your ongoing academic progress"
                actions={
                    <UpdateButton
                        onClick={handleUpdate}
                        isLoading={updateStatus === 'loading'}
                        cooldownActive={isCooldownActive}
                        formattedCooldown={formatTime}
                    />
                }
            />

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Current CGPA</span>
                        <Award size={18} />
                    </div>
                    <div className="stat-value">{currentCgpa ?? "—"}{currentCgpa && <span className="stat-max">/10</span>}</div>
                    <p className="stat-footnote">Overall cumulative GPA</p>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Total Credits</span>
                        <BookOpen size={18} />
                    </div>
                    <div className="stat-value">{totalCredits}<span className="stat-max">/{maxCredits}</span></div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(totalCredits / maxCredits) * 100}%`, backgroundColor: 'var(--accent-primary)' }}></div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Active Courses</span>
                        <Layers size={18} />
                    </div>
                    <div className="stat-value">{currentSem.length}</div>
                    <p className="stat-footnote">This semester load</p>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Latest semester SGPA</span>
                        <TrendingUp className="stat-icon" />
                    </div>
                    <div className="stat-value">{examHistory.length > 0 ? latestSGPA : "—"}</div>
                    {examHistory.length > 1 ? (
                        <div className={`trend-badge ${isImproved ? 'positive' : 'negative'}`}>
                            {isImproved ? <TrendingUp size={14} /> : <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />}
                            {sgpaDiff} vs previous
                        </div>
                    ) : (
                        <p className="stat-footnote">
                            {examHistory.length === 1
                                ? "Compares once more history is available"
                                : "No semester results in history yet"}
                        </p>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Attendence Overview</h3>
                        <p className="chart-subtitle">Subject-wise attendance distribution</p>
                    </div>
                    <div className="chart-body attendance-chart-body">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={380}>
                                <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="100%" barSize={12} data={currentSem.map((s: any, i: number) => ({ ...s, fill: CHART_COLORS[i % CHART_COLORS.length] }))}>
                                    <RadialBar background={{ fill: 'var(--bg-primary)' }} dataKey="attendance" cornerRadius={20} onClick={(d: any) => onSelectSubject(d.payload)} />
                                    <Tooltip content={<AttendanceTooltip />} cursor={{ fill: 'var(--bg-primary)' }} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-legend-custom">
                            {currentSem.map((s: any, i: number) => (
                                <div key={i} className="legend-item-custom" onClick={() => onSelectSubject(s)}>
                                    <div className="legend-dot-custom" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                                    <span className="legend-label-custom">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

               
                <div className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Internal Marks (CIE)</h3>
                            <p className="chart-subtitle">Subject-wise CIE scores out of 50</p>
                        </div>
                    </div>
                    <div className="chart-body marks-chart-body">
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={currentSem} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.3} vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: '11px' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} stroke="var(--text-muted)" style={{ fontSize: '12px' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<MarksTooltip />} cursor={{ fill: 'var(--bg-primary)' }} />
                                <Bar 
                                    dataKey="marks" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={20} 
                                    fill="var(--accent-primary)" 
                                    onClick={(data: any) => data && onSelectSubject(data.payload)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="dashboard-table-container">
                    <table className="dashboard-table">
                        <thead>
                            <tr><th>Code</th><th>Course Name</th><th>Attendance</th><th>CIE Marks</th></tr>
                        </thead>
                        <tbody>
                            {currentSem.map((s: any, idx: number) => {
                                const att = Math.round(s.attendance || 0);
                                const attClass = att >= 85 ? 'success' : att >= 75 ? 'warning' : 'error';
                                return (
                                    <tr key={idx} onClick={() => onSelectSubject(s)} className="interactive-row">
                                        <td className="text-muted">{s.code}</td>
                                        <td className="font-semibold">{s.name}</td>
                                        <td><span className={`pill ${attClass}`}>{att}%</span></td>
                                        <td><span className={`pill ${s.marks >= 30 ? 'success' : 'warning'}`}>{s.marks} / 50</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PerformanceSection;
