"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, Cell, CartesianGrid
} from "recharts";
import {
    Target, History, Award, TrendingUp, BookOpen,
    Calendar, BarChart3, Menu, X, RefreshCw, CheckCircle2, AlertCircle
} from "lucide-react";
import "@/styles/StudentDashboard.css";
import { API_BASE_URL } from "@/config/api.config";
import SubjectDetail from "./SubjectDetail";

const GRADE_COLORS: Record<string, string> = {
    'O': '#8b5cf6',
    'A+': '#3b82f6',
    'A': '#10b981',
    'B+': '#f59e0b',
    'B': '#f97316',
    'C': '#ef4444',
};

export default function StudentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [detailedData, setDetailedData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('performance');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });
    const [selectedSubject, setSelectedSubject] = useState<any>(null);

    const showToast = (message: string, type = "info") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const sessionId = localStorage.getItem("studentSessionId");
            const usn = localStorage.getItem("studentUsn");

            if (!sessionId || !usn) {
                router.push("/student-login");
                return;
            }

            try {
                const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
                    headers: { "x-session-id": sessionId },
                });

                if (response.data.success) {
                    setStudent(response.data.data);
                }

                const detailedResp = await axios.get(`${API_BASE_URL}/api/report/student/${usn}`, {
                    headers: { "x-session-id": sessionId },
                });

                if (detailedResp.data.success && detailedResp.data.data) {
                    setDetailedData(detailedResp.data.data);

                    if (detailedResp.data.source === "scraper") {
                        showToast("Fresh data scraped and saved to database!", "success");
                    }
                }

            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.clear();
                    router.push("/student-login");
                } else if (err.response?.status === 503) {
                    showToast("Scraping service is unavailable. Please try again later.", "error");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        closeMobileMenu();
    };

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            const sessionId = localStorage.getItem("studentSessionId");
            const usn = localStorage.getItem("studentUsn");

            const updateResp = await axios.post(`${API_BASE_URL}/api/report/update`, { usn }, {
                headers: { "x-session-id": sessionId },
            });

            if (updateResp.data.success && updateResp.data.data) {
                setDetailedData(updateResp.data.data);
                showToast("Dashboard updated successfully!", "success");
            } else {
                showToast("Update finished, but no new data received.", "warning");
            }
        } catch (err) {
            console.error("Failed to update report:", err);
            showToast("Failed to run update in background. Please try again later.", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return (
        <div className="dashboard-loading">
            <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">Loading your dashboard...</p>
        </div>
    );

    // Derived Data
    const detailsBlob = detailedData?.details || detailedData || {};
    const currentSem = detailsBlob.subjects || detailsBlob.current_semester || [];
    const examHistory = detailsBlob.exam_history || [];

    const overallAttendance = currentSem.length
        ? Math.round(currentSem.reduce((acc: any, curr: any) => acc + (curr.attendance || 0), 0) / currentSem.length)
        : 0;

    const overallCIE = currentSem.length
        ? Math.round(currentSem.reduce((acc: any, curr: any) => acc + (curr.marks || 0), 0) / currentSem.length)
        : 0;

    const sgpaTrendData = [...examHistory].reverse().map(sem => ({
        name: sem.semester.split(' ')[0] + ' ' + (sem.semester.split(' ')[2]?.substring(2) || ''),
        sgpa: parseFloat(sem.sgpa),
        credits: parseInt(sem.credits_earned || 0)
    }));

    const totalCredits = examHistory.reduce((acc: any, sem: any) => acc + parseInt(sem.credits_earned || 0), 0);
    const latestSGPA = examHistory.length > 0 ? parseFloat(examHistory[0].sgpa) : 0;
    const prevSGPA = examHistory.length > 1 ? parseFloat(examHistory[1].sgpa) : 0;
    const sgpaDiff = (latestSGPA - prevSGPA).toFixed(2);
    const isImproved = prevSGPA === 0 || parseFloat(sgpaDiff) >= 0;

    const allGrades = examHistory.flatMap((sem: any) => sem.courses?.map((c: any) => c.grade) || []);
    const gradeDistribution = allGrades.reduce((acc: any, grade: string) => {
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
    }, {});

    const gradeChartData = Object.entries(gradeDistribution)
        .map(([grade, count]) => ({ grade, count, color: (GRADE_COLORS[grade] || '#64748b') as string }))
        .sort((a, b) => (b.count as number) - (a.count as number));

    return (
        <div className="student-dashboard-container">
            {/* Custom Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 9999, padding: '12px 24px', borderRadius: '8px',
                    background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#f59e0b',
                    color: '#ffffff', fontWeight: 500, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    animation: 'slideInRight 0.3s ease-out forwards'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>

            {/* Mobile Menu Toggle Button */}
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            <div className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={closeMobileMenu}></div>

            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <nav className="sidebar-navigation">
                    <button className={`nav-button ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => handleTabChange('performance')}>
                        <Target size={20} /> <span>Current Semester</span>
                    </button>
                    <button className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => handleTabChange('analytics')}>
                        <BarChart3 size={20} /> <span>Analytics</span>
                    </button>
                    <button className={`nav-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleTabChange('history')}>
                        <History size={20} /> <span>Exam History</span>
                    </button>
                    <button className="nav-button" onClick={handleUpdate} disabled={isUpdating}>
                        <RefreshCw size={20} className={isUpdating ? "spinning" : ""} />
                        <span>{isUpdating ? "Updating Data..." : "Update Dashboard"}</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main-content">
                <div className="content-wrapper">
                    {/* SUBJECT DETAIL VIEW */}
                    {selectedSubject && (
                        <SubjectDetail subject={selectedSubject} onBack={() => setSelectedSubject(null)} />
                    )}

                    {/* CURRENT SEMESTER PERFORMANCE TAB */}
                    {!selectedSubject && activeTab === 'performance' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <div className="header-content">
                                    <h1 className="page-title">Current Semester Performance</h1>
                                    <p className="page-subtitle">Detailed breakdown of your ongoing semester</p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Overall Attendance</span>
                                        <Calendar className="stat-icon" />
                                    </div>
                                    <div className="stat-value">{overallAttendance}<span className="stat-max">%</span></div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${overallAttendance}%`, background: overallAttendance >= 75 ? 'var(--success)' : 'var(--error)' }}></div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Average CIE</span>
                                        <Target className="stat-icon" />
                                    </div>
                                    <div className="stat-value">{overallCIE}<span className="stat-max">/50</span></div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${(overallCIE / 50) * 100}%`, background: '#f59e0b' }}></div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Latest SGPA</span>
                                        <Award className="stat-icon" />
                                    </div>
                                    <div className="stat-value">{latestSGPA}</div>
                                    <div className={`trend-badge ${isImproved ? 'positive' : 'negative'}`}>
                                        {isImproved ? <TrendingUp size={14} /> : <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />}
                                        {sgpaDiff} from last sem
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Credits Earned</span>
                                        <BookOpen className="stat-icon" />
                                    </div>
                                    <div className="stat-value">{totalCredits}<span className="stat-max">/160</span></div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${(totalCredits / 160) * 100}%`, background: '#8b5cf6' }}></div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                {/* Attendance Pie Chart */}
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Attendance Overview</h3>
                                            <p className="chart-subtitle">Subject-wise attendance distribution</p>
                                        </div>
                                    </div>
                                    <div className="chart-body" style={{ display: 'flex', flexDirection: 'row', gap: '32px', height: '380px', width: '100%', alignItems: 'center' }}>
                                        <div style={{ flex: '1', height: '100%', minWidth: 0 }}>
                                            <ResponsiveContainer width="100%" height={380}>
                                                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={10} data={currentSem.map((entry: any, index: number) => ({ ...entry, fill: ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6'][index % 8] }))}>
                                                    <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }} dataKey="attendance" cornerRadius={10} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }} formatter={(val) => [`${val}%`, '']} />
                                                </RadialBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', minWidth: 0 }}>
                                            {currentSem.map((subject: any, index: number) => (
                                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6'][index % 8], flexShrink: 0 }}></div>
                                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subject.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* CIE Marks Chart */}
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Internal Marks (CIE)</h3>
                                            <p className="chart-subtitle">Subject-wise CIE scores out of 50</p>
                                        </div>
                                    </div>
                                    <div className="chart-body" style={{ height: '380px' }}>
                                        <ResponsiveContainer width="100%" height={380}>
                                            <BarChart data={currentSem} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="code" stroke="#64748b" style={{ fontSize: '11px' }} />
                                                <YAxis domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} stroke="#64748b" style={{ fontSize: '12px' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }} formatter={(val) => [`${val}/50`, 'Marks']} />
                                                <Bar dataKey="marks" radius={[8, 8, 0, 0]} barSize={35} fill="#f97316" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Subjects Table */}
                                <div className="dashboard-table-container">
                                    <table className="dashboard-table">
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Subject Name</th>
                                                <th>Attendance</th>
                                                <th>CIE Score</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentSem.map((subject: any, idx: number) => {
                                                const attPct = Math.round(subject.attendance || 0);
                                                const attLevel = attPct >= 85 ? 'success' : attPct >= 75 ? 'warning' : 'error';
                                                const ciePct = ((subject.marks || 0) / 50) * 100;
                                                const cieLevel = ciePct >= 80 ? 'success' : ciePct >= 60 ? 'warning' : 'error';
                                                let status = "Excellent";
                                                if (attLevel === 'error' || cieLevel === 'error') status = "Needs Work";
                                                else if (attLevel === 'warning' || cieLevel === 'warning') status = "Good";

                                                return (
                                                    <tr key={idx} onClick={() => setSelectedSubject(subject)} style={{ cursor: 'pointer' }} className="hover-row">
                                                        <td style={{ color: 'var(--text-muted)' }}>{subject.code || '-'}</td>
                                                        <td style={{ fontWeight: 500 }}>{subject.name}</td>
                                                        <td><span className={`pill ${attLevel}`}>{attPct}%</span></td>
                                                        <td><span className={`pill ${cieLevel}`}>{subject.marks || 0} / 50</span></td>
                                                        <td><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{status}</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {!selectedSubject && activeTab === 'analytics' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <div className="header-content">
                                    <h1 className="page-title">Academic Analytics</h1>
                                    <p className="page-subtitle">Deep insights into your academic journey</p>
                                </div>
                            </div>

                            <div className="charts-grid">
                                <div className="chart-card wide-chart">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Attendance vs Internal Marks Correlation</h3>
                                            <p className="chart-subtitle">Analyzing the relationship between attendance and performance</p>
                                        </div>
                                        <div className="chart-legend">
                                            <div className="legend-item"><div className="legend-color attendance-color"></div><span>Attendance %</span></div>
                                            <div className="legend-item"><div className="legend-color cie-color"></div><span>CIE Score</span></div>
                                        </div>
                                    </div>
                                    <div className="chart-body" style={{ height: '400px' }}>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={currentSem.map((s: any) => ({ ...s, ciePct: ((s.marks || 0) / 50) * 100 }))} margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="code" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }} />
                                                <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                                <Bar dataKey="ciePct" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Grade Distribution */}
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3 className="chart-title">Grade Distribution</h3>
                                    </div>
                                    <div className="chart-body">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={gradeChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="grade" stroke="#64748b" />
                                                <YAxis stroke="#64748b" />
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }} />
                                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                                    {gradeChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Credits Progress */}
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3 className="chart-title">Credits Progress</h3>
                                    </div>
                                    <div className="chart-body">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={sgpaTrendData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="name" stroke="#64748b" />
                                                <YAxis stroke="#64748b" />
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }} />
                                                <Bar dataKey="credits" fill="#10b981" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Insights */}
                            <div className="chart-card wide-chart" style={{ marginTop: '24px' }}>
                                <div className="chart-header"><h3 className="chart-title">Performance Insights</h3></div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                    <div className="insight-item">
                                        <TrendingUp className="insight-icon success" />
                                        <div>
                                            <div className="insight-label">Academic Standing</div>
                                            <div className="insight-value">Your CGPA is {detailedData?.cgpa || latestSGPA}. {isImproved && sgpaDiff > "0" ? `Improved by ${sgpaDiff}!` : ""}</div>
                                        </div>
                                    </div>
                                    <div className="insight-item">
                                        <Calendar className="insight-icon" style={{ color: overallAttendance >= 75 ? 'var(--success)' : 'var(--error)' }} />
                                        <div>
                                            <div className="insight-label">Attendance Analysis</div>
                                            <div className="insight-value">{overallAttendance >= 85 ? 'Excellent!' : overallAttendance >= 75 ? 'Adequate.' : 'Needs improvement!'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {!selectedSubject && activeTab === 'history' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <h1 className="page-title">Exam History</h1>
                                <p className="page-subtitle">Complete record of your academic performance</p>
                            </div>

                            {examHistory.length === 0 ? (
                                <div className="empty-history">
                                    <History size={48} color="var(--text-muted)" />
                                    <h3>No exam history available</h3>
                                </div>
                            ) : (
                                <div className="history-grid">
                                    {[...examHistory].reverse().map((sem: any, idx: number) => (
                                        <div key={idx} className="chart-card">
                                            <div className="chart-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '16px' }}>
                                                <div>
                                                    <span className="pill" style={{ marginBottom: '8px' }}>Semester {examHistory.length - idx}</span>
                                                    <h3 className="chart-title">{sem.semester}</h3>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div className="stat-label">SGPA</div>
                                                    <div className="stat-value" style={{ fontSize: '24px' }}>{sem.sgpa}</div>
                                                </div>
                                            </div>
                                            <table className="dashboard-table">
                                                <thead><tr><th>Code</th><th>Course</th><th style={{ textAlign: 'right' }}>Grade</th></tr></thead>
                                                <tbody>
                                                    {sem.courses?.map((c: any, i: number) => (
                                                        <tr key={i}>
                                                            <td style={{ color: 'var(--text-muted)' }}>{c.code}</td>
                                                            <td>{c.name}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: GRADE_COLORS[c.grade] || 'var(--text-primary)' }}>{c.grade}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <style jsx>{`
                .insight-item { padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 8px; display: flex; gap: 12px; }
                .insight-icon { color: var(--accent-primary); flex-shrink: 0; }
                .insight-label { font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; }
                .insight-value { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
                .empty-history { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-subtle); text-align: center; gap: 16px; width: 100%; grid-column: 1/-1; }
                .hover-row:hover { background: rgba(255,255,255,0.03); }
            `}</style>
        </div>
    );
}
