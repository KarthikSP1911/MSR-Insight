"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, Cell, CartesianGrid, ComposedChart, Line, Legend
} from "recharts";
import {
    Target, History, Award, TrendingUp, BookOpen,
    Calendar, BarChart3, Menu, X, RefreshCw, CheckCircle2, AlertCircle,
    Layers, Star, AlertTriangle, Gamepad2, Sparkles
} from "lucide-react";
import "@/styles/StudentDashboard.css";
import { API_BASE_URL } from "@/config/api.config";
import SubjectDetail from "./SubjectDetail";

const GRADE_COLORS: Record<string, string> = {
    'O': '#8b5cf6',
    'A+': '#3b82f6',
    'A': '#10b981',
    'B+': '#f59e0b',
    'B': 'var(--accent-primary)',
    'C': '#ef4444',
};

const CHART_COLORS = [
    'var(--accent-primary)', 
    '#6366F1', // Fixed: Working Indigo color instead of broken accent-dark
    '#10b981', 
    '#f59e0b', 
    '#ef4444', 
    '#ec4899', 
    '#3b82f6', 
    '#14b8a6',
];

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
    const [predictedGrades, setPredictedGrades] = useState<Record<string, string>>({});
    const [simulatedCredits, setSimulatedCredits] = useState<Record<string, number>>({});
    const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<any>(null);
    const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number>(0);

    // Scroll to top when subject changes
    useEffect(() => {
        if (selectedSubject) {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [selectedSubject]);

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

    const currentCgpa = (detailsBlob.cgpa ?? detailedData?.cgpa ?? "").toString().trim() || null;
    const sgpaTrendData = examHistory.map((sem: any) => ({
        name: sem.semester.split(' ')[0] + ' ' + (sem.semester.split(' ')[2]?.substring(2) || ''),
        sgpa: parseFloat(sem.sgpa),
        credits: parseInt(sem.credits_earned || 0)
    }));

    const totalCredits = examHistory.reduce((acc: any, sem: any) => acc + (parseInt(sem.credits_earned) || 0), 0);
    const latestSGPA = examHistory.length > 0 ? (parseFloat(examHistory[examHistory.length - 1].sgpa) || 0) : 0;
    const prevSGPA = examHistory.length > 1 ? (parseFloat(examHistory[examHistory.length - 2].sgpa) || 0) : 0;
    const sgpaDiffValue = latestSGPA - prevSGPA;
    const sgpaDiff = (sgpaDiffValue >= 0 ? "+" : "") + sgpaDiffValue.toFixed(2);
    const isImproved = latestSGPA >= prevSGPA;
    const usn = detailedData?.usn || detailsBlob.usn || "";
    const isLateralEntry = /4\d{2}$/.test(usn);
    const maxCredits = isLateralEntry ? 120 : 160;

    const allGrades = examHistory.flatMap((sem: any) => sem.courses?.map((c: any) => c.grade) || []);
    const gradeDistribution = allGrades.reduce((acc: any, grade: string) => {
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
    }, {});

    const gradeChartData = Object.entries(gradeDistribution)
        .map(([grade, count]) => ({ grade, count, color: (GRADE_COLORS[grade] || '#64748b') as string }))
        .sort((a, b) => (b.count as number) - (a.count as number));

    const internalComparisonData = currentSem.map((subj: any) => {
        const getScores = (type: string) => {
            const a = subj.assessments?.find((x: any) => x.type === type);
            return { me: a?.obtained_marks || 0, avg: a?.class_average || 0 };
        };

        const t1 = getScores('T1');
        const t2 = getScores('T2');
        const aq1 = getScores('AQ1');
        const aq2 = getScores('AQ2');

        const calcTotal = (s1: number, s2: number, q1: number, q2: number) => {
            const testAvg = (s1 > 0 && s2 > 0) ? Math.round((s1 + s2) / 2) : Math.max(s1, s2);
            return testAvg + q1 + q2;
        };

        return {
            code: subj.code,
            name: subj.name,
            studentScore: calcTotal(t1.me, t2.me, aq1.me, aq2.me),
            classAverage: calcTotal(t1.avg, t2.avg, aq1.avg, aq2.avg),
        };
    }).filter((d: any) => d.studentScore > 0 || d.classAverage > 0);

    const bestSubject = [...currentSem].filter(s => s.marks > 0 || (s.attendance && s.attendance > 0)).sort((a: any, b: any) => {
        const scoreA = ((a.marks || 0) * 2) + (a.attendance || 0);
        const scoreB = ((b.marks || 0) * 2) + (b.attendance || 0);
        return scoreB - scoreA;
    })[0];
    
    const weakestSubject = [...currentSem].filter(s => s.marks > 0 || (s.attendance && s.attendance > 0)).sort((a: any, b: any) => {
        const scoreA = ((a.marks || 0) * 2) + (a.attendance || 0);
        const scoreB = ((b.marks || 0) * 2) + (b.attendance || 0);
        return scoreA - scoreB;
    })[0];

    return (
        <div className="student-dashboard-container">
            {/* Custom Toast Notification */}
            {toast.show && (
                <div className={`dashboard-toast ${toast.type}`}>
                    <div className="toast-content">
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}


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
                    <button className={`nav-button ${activeTab === 'simulator' ? 'active' : ''}`} onClick={() => handleTabChange('simulator')}>
                        <Gamepad2 size={20} /> <span>Simulator</span>
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
                        <SubjectDetail 
                            subject={selectedSubject} 
                            allSubjects={currentSem}
                            onSubjectChange={setSelectedSubject}
                            onBack={() => setSelectedSubject(null)} 
                        />
                    )}

                    {/* CURRENT SEMESTER PERFORMANCE TAB */}
                    {!selectedSubject && activeTab === 'performance' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <div className="header-content">
                                    <h1 className="page-title">Current Semester Performance</h1>
                                    <p className="page-subtitle">Detailed breakdown of your ongoing semester</p>
                                    {typeof detailsBlob.class_details === "string" && detailsBlob.class_details.trim() ? (
                                        <p className="page-meta">{detailsBlob.class_details.trim().replace(/\s+/g, " ")}</p>
                                    ) : null}
                                    {detailsBlob.last_updated ? (
                                        <p className="page-meta page-meta--muted">Portal data synced: {detailsBlob.last_updated}</p>
                                    ) : null}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Current CGPA</span>
                                        <Award className="stat-icon" />
                                    </div>
                                    <div className="stat-value">
                                        {currentCgpa ?? "—"}
                                        {currentCgpa ? <span className="stat-max">/10</span> : null}
                                    </div>
                                    <p className="stat-footnote">Cumulative GPA from the portal</p>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Credits earned</span>
                                        <BookOpen className="stat-icon" />
                                    </div>
                                    <div className="stat-value">{totalCredits}<span className="stat-max">/{maxCredits}</span></div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${(totalCredits / maxCredits) * 100}%`, background: '#8b5cf6' }}></div>
                                    </div>
                                    <p className="stat-footnote">Total target is {maxCredits} for your entry type</p>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <span className="stat-label">Courses this semester</span>
                                        <Layers className="stat-icon" />
                                    </div>
                                    <div className="stat-value">{currentSem.length}</div>
                                    <p className="stat-footnote">Registered subjects (incl. labs &amp; electives)</p>
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                {/* Attendance Pie Chart */}
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Attendance Overview</h3>
                                            <p className="chart-subtitle">Subject-wise attendance distribution</p>
                                        </div>
                                    </div>
                                    <div className="chart-body attendance-chart-body">
                                        <div className="chart-container">
                                            <ResponsiveContainer width="100%" height={380}>
                                                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={10} data={currentSem.map((entry: any, index: number) => ({ ...entry, fill: CHART_COLORS[index % CHART_COLORS.length] }))}>
                                                    <RadialBar 
                                                        background={{ fill: 'var(--bg-primary)' }} 
                                                        dataKey="attendance" 
                                                        cornerRadius={10} 
                                                        onClick={(data: any) => data && setSelectedSubject(data.payload)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: 'var(--bg-secondary)', 
                                                            border: '1px solid var(--border-subtle)', 
                                                            borderRadius: '12px'
                                                        }} 
                                                        itemStyle={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500' }}
                                                        formatter={(val: any, name: any, props: any) => [`${val}%`, props.payload.name]}
                                                    />
                                                </RadialBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="chart-legend-custom">
                                            {currentSem.map((subject: any, index: number) => (
                                                <div key={index} className="legend-item-custom" onClick={() => setSelectedSubject(subject)} style={{ cursor: 'pointer' }}>
                                                    <div className="legend-dot-custom" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                                                    <div className="legend-label-custom">{subject.name}</div>
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
                                    <div className="chart-body marks-chart-body">
                                        <ResponsiveContainer width="100%" height={380}>
                                            <BarChart data={currentSem} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.3} vertical={false} />
                                                <XAxis dataKey="code" stroke="var(--text-muted)" style={{ fontSize: '11px' }} axisLine={false} tickLine={false} />
                                                <YAxis domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} stroke="var(--text-muted)" style={{ fontSize: '12px' }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)' }} formatter={(val) => [`${val}/50`, 'Marks']} cursor={{ fill: 'var(--bg-primary)', opacity: 0.4 }} />
                                                <Bar 
                                                    dataKey="marks" 
                                                    radius={[4, 4, 0, 0]} 
                                                    barSize={20} 
                                                    fill="var(--accent-primary)" 
                                                    onClick={(data: any) => data && setSelectedSubject(data.payload)}
                                                    style={{ cursor: 'pointer' }}
                                                />
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
                                                    <tr key={idx} onClick={() => setSelectedSubject(subject)} className="hover-row interactive-row">
                                                        <td className="text-muted">{subject.code || '-'}</td>
                                                        <td className="font-semibold">{subject.name}</td>
                                                        <td><span className={`pill ${attLevel}`}>{attPct}%</span></td>
                                                        <td><span className={`pill ${cieLevel}`}>{subject.marks || 0} / 50</span></td>
                                                        <td><span className="status-text">{status}</span></td>
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
                                            <h3 className="chart-title">Internal Marks Comparison: You vs Class</h3>
                                            <p className="chart-subtitle">Combined score (Avg of T1 &amp; T2 + Assessments) compared to class average</p>
                                        </div>
                                        <div className="chart-legend">
                                            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#00ADB5' }}></div><span>Your Score</span></div>
                                            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#64748B' }}></div><span>Class Average</span></div>
                                        </div>
                                    </div>
                                    <div className="chart-body">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={internalComparisonData} margin={{ top: 20, right: 10, bottom: 40, left: -20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="code" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" domain={[0, 50]} />
                                                <Tooltip 
                                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                                                    contentStyle={{ 
                                                        backgroundColor: 'var(--bg-secondary)', 
                                                        border: '1px solid var(--border-subtle)', 
                                                        borderRadius: '12px', 
                                                        color: 'var(--text-primary)' 
                                                    }} 
                                                    cursor={{ fill: 'var(--bg-primary)', opacity: 0.4 }}
                                                />
                                                <Bar 
                                                    dataKey="studentScore" 
                                                    name="Your Score" 
                                                    fill="#00ADB5" 
                                                    radius={[4, 4, 0, 0]} 
                                                    barSize={18} 
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={(data: any) => {
                                                        const subject = currentSem.find((s: any) => s.code === data.payload.code);
                                                        if (subject) setSelectedSubject(subject);
                                                    }}
                                                />
                                                <Bar 
                                                    dataKey="classAverage" 
                                                    name="Class Average" 
                                                    fill="#64748B" 
                                                    radius={[4, 4, 0, 0]} 
                                                    barSize={18} 
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={(data: any) => {
                                                        const subject = currentSem.find((s: any) => s.code === data.payload.code);
                                                        if (subject) setSelectedSubject(subject);
                                                    }}
                                                />
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
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={gradeChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="grade" stroke="#64748b" />
                                                <YAxis stroke="#64748b" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-subtle)',
                                                        borderRadius: '12px',
                                                        color: '#ffffff',
                                                    }}
                                                    labelStyle={{ color: '#ffffff' }}
                                                    itemStyle={{ color: '#ffffff' }}
                                                    cursor={{ fill: 'var(--bg-primary)', opacity: 0.4 }}
                                                />
                                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                                    {gradeChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* SGPA & Credits Trajectory */}
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3 className="chart-title">SGPA & Credits Trajectory</h3>
                                    </div>
                                    <div className="chart-body">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <ComposedChart data={sgpaTrendData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="name" stroke="#64748b" />
                                                <YAxis yAxisId="left" stroke="#64748b" />
                                                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" domain={[0, 10]} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'var(--bg-secondary)', 
                                                        border: '1px solid var(--border-subtle)', 
                                                        borderRadius: '12px', 
                                                        color: 'var(--text-primary)' 
                                                    }} 
                                                />
                                                <Legend verticalAlign="top" height={36} />
                                                <Bar yAxisId="left" dataKey="credits" fill="rgba(16, 185, 129, 0.2)" radius={[4, 4, 0, 0]} name="Credits Earned" />
                                                <Line yAxisId="right" type="monotone" dataKey="sgpa" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="SGPA" />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>


                            {/* Performance Insights */}
                            <div className="chart-card wide-chart" style={{ marginTop: '24px' }}>
                                <div className="chart-header"><h3 className="chart-title">Performance Insights</h3></div>
                                <div className="insights-grid">
                                    <div className="insight-item">
                                        <TrendingUp className="insight-icon success" />
                                        <div>
                                            <div className="insight-label">Academic Standing</div>
                                             <div className="insight-value">
                                                Your CGPA is {detailsBlob.cgpa || detailedData?.cgpa || latestSGPA}. 
                                                {prevSGPA > 0 ? (sgpaDiffValue >= 0 ? ` Improved by ${sgpaDiffValue.toFixed(2)}` : ` Decreased by ${Math.abs(sgpaDiffValue).toFixed(2)}`) + ' compared to the previous semester.' : ""}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="insight-item">
                                        <Calendar className="insight-icon" style={{ color: overallAttendance >= 75 ? 'var(--success)' : 'var(--error)' }} />
                                        <div>
                                            <div className="insight-label">Attendance Analysis</div>
                                            <div className="insight-value">{overallAttendance >= 85 ? 'Excellent!' : overallAttendance >= 75 ? 'Adequate.' : 'Needs improvement!'}</div>
                                        </div>
                                    </div>
                                    {bestSubject && (
                                        <div className="insight-item">
                                            <Star className="insight-icon" style={{ color: '#F59E0B' }} />
                                            <div>
                                                <div className="insight-label">Top Performing Subject</div>
                                                <div className="insight-value">{bestSubject.name} ({bestSubject.code}) — {bestSubject.marks}/50 | {Math.round(bestSubject.attendance)}%</div>
                                            </div>
                                        </div>
                                    )}
                                    {weakestSubject && weakestSubject.code !== bestSubject?.code && (
                                        <div className="insight-item">
                                            <AlertTriangle className="insight-icon" style={{ color: '#EF4444' }} />
                                            <div>
                                                <div className="insight-label">Requires Attention</div>
                                                <div className="insight-value">{weakestSubject.name} ({weakestSubject.code}) — {weakestSubject.marks}/50 | {Math.round(weakestSubject.attendance)}%</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SIMULATOR TAB */}
                    {!selectedSubject && activeTab === 'simulator' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <div className="header-content">
                                    <h1 className="page-title">Interactive Simulator</h1>
                                    <p className="page-subtitle">Experiment with your grades and explore your global attendance</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* SGPA Predictor */}
                                <div className="chart-card predictor-card">
                                    <div className="chart-header">
                                        <h3 className="chart-title"><Sparkles size={18} style={{ display: 'inline', color: '#10b981', marginRight: '6px', verticalAlign: '-3px' }} /> "What-If" Predictor</h3>
                                        <p className="chart-subtitle">Precision Grade & Credit Simulation</p>
                                    </div>
                                    <div className="predictor-container">
                                        {(() => {
                                            const GRADE_POINTS: Record<string, number> = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };
                                            let currentTotalPts = 0; 
                                            let currentTotalCredits = 0;
                                            
                                            currentSem.forEach((subj: any) => {
                                                const credits = simulatedCredits[subj.code] || 3; 
                                                const g = predictedGrades[subj.code] || 'A';
                                                currentTotalPts += (GRADE_POINTS[g] || 0) * credits;
                                                currentTotalCredits += credits;
                                            });
                                            
                                            const projSGPA = currentTotalCredits > 0 ? (currentTotalPts / currentTotalCredits) : 0;
                                            const historicalCredits = totalCredits;
                                            const earnedVal = parseFloat(currentCgpa || "0");
                                            const projCGPA = (historicalCredits + currentTotalCredits) > 0 
                                                ? ((historicalCredits * earnedVal) + (currentTotalCredits * projSGPA)) / (historicalCredits + currentTotalCredits)
                                                : 0;

                                            return (
                                                <div className="predictor-layout">
                                                    {/* Summary Scoreboard */}
                                                    <div className="predictor-scoreboard">
                                                        <div className="score-item sgpa">
                                                            <div className="score-label">Projected SGPA</div>
                                                            <div className="score-value">{projSGPA.toFixed(2)}</div>
                                                        </div>
                                                        <div className="score-divider" />
                                                        <div className="score-item cgpa">
                                                            <div className="score-label">Projected CGPA</div>
                                                            <div className="score-value">{projCGPA.toFixed(2)}</div>
                                                        </div>
                                                        <div className="score-footer">
                                                            Calculated for {currentSem.length} subjects
                                                        </div>
                                                    </div>

                                                    {/* Controls List */}
                                                    <div className="predictor-controls">
                                                        <div className="controls-header">
                                                            <span>Subject Name</span>
                                                            <div className="controls-labels">
                                                                <span>Credits</span>
                                                                <span>Grade</span>
                                                            </div>
                                                        </div>
                                                        <div className="controls-scrollable">
                                                            {currentSem.map((subj: any) => (
                                                                <div key={subj.code} className="subject-row">
                                                                    <div className="subj-info" title={`${subj.name} (${subj.code})`}>
                                                                        <div className="subj-name">{subj.name}</div>
                                                                        <div className="subj-code">{subj.code}</div>
                                                                    </div>
                                                                    <div className="subj-pickers">
                                                                        <select 
                                                                            value={simulatedCredits[subj.code] || 3} 
                                                                            onChange={(e) => setSimulatedCredits({...simulatedCredits, [subj.code]: parseInt(e.target.value)})}
                                                                            className="simulator-select credit-select"
                                                                        >
                                                                            {[0,1,2,3,4].map(c => <option key={c} value={c}>{c} Cr</option>)}
                                                                        </select>
                                                                        <select 
                                                                            value={predictedGrades[subj.code] || 'A'} 
                                                                            onChange={(e) => setPredictedGrades({...predictedGrades, [subj.code]: e.target.value})}
                                                                            className="simulator-select grade-select"
                                                                        >
                                                                            {Object.keys(GRADE_COLORS).map(g => <option key={g} value={g}>{g}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Attendance Heatmap — GitHub Style */}
                                <div className="chart-card wide-chart">
                                    <div className="chart-header">
                                        <h3 className="chart-title"><Calendar size={18} style={{ display: 'inline', color: '#10b981', marginRight: '6px', verticalAlign: '-3px' }} /> Global Attendance Heatmap</h3>
                                        <p className="chart-subtitle">90-day record of your active participation</p>
                                    </div>
                                    <div className="chart-body" style={{ overflowX: 'auto', padding: '10px 0' }}>
                                        {(() => {
                                            const parseDStr = (s: string) => {
                                                const p = s.split('-');
                                                return new Date(`${p[2]}-${p[1]}-${p[0]}`).getTime();
                                            };

                                            const allDates: number[] = [];
                                            currentSem.forEach((subj: any) => {
                                                (subj.attendance_details?.present_dates || []).forEach((d: string) => allDates.push(parseDStr(d)));
                                                (subj.attendance_details?.absent_dates || []).forEach((d: string) => allDates.push(parseDStr(d)));
                                            });

                                            // Default to last 4 months if empty, else use the range found in data
                                            const now = new Date();
                                            const minTime = allDates.length ? Math.min(...allDates) : now.getTime() - (120 * 86400000);
                                            const maxTime = allDates.length ? Math.max(...allDates, now.getTime()) : now.getTime();
                                            
                                            const startDate = new Date(minTime);
                                            startDate.setDate(startDate.getDate() - startDate.getDay()); // Align to Sunday
                                            
                                            const endDate = new Date(maxTime);
                                            endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // Align to Saturday
                                            
                                            const attendanceMap: Record<string, { present: number, absent: number, presentSubjects: string[], absentSubjects: string[] }> = {};
                                            currentSem.forEach((subj: any) => {
                                                (subj.attendance_details?.present_dates || []).forEach((d: string) => {
                                                    if (!attendanceMap[d]) attendanceMap[d] = { present: 0, absent: 0, presentSubjects: [], absentSubjects: [] };
                                                    attendanceMap[d].present += 1;
                                                    attendanceMap[d].presentSubjects.push(subj.name);
                                                });
                                                (subj.attendance_details?.absent_dates || []).forEach((d: string) => {
                                                    if (!attendanceMap[d]) attendanceMap[d] = { present: 0, absent: 0, presentSubjects: [], absentSubjects: [] };
                                                    attendanceMap[d].absent += 1;
                                                    attendanceMap[d].absentSubjects.push(subj.name);
                                                });
                                            });

                                            const weeks: any[] = [];
                                            let currentWeek: any[] = [];
                                            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);

                                            for (let i = 0; i <= totalDays; i++) {
                                                const d = new Date(startDate);
                                                d.setDate(startDate.getDate() + i);
                                                const dStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                                const stats = attendanceMap[dStr] || { present: 0, absent: 0, presentSubjects: [], absentSubjects: [] };
                                                
                                                currentWeek.push({
                                                    dateStr: dStr,
                                                    niceDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                                    present: stats.present,
                                                    absent: stats.absent,
                                                    presentSubjects: stats.presentSubjects,
                                                    absentSubjects: stats.absentSubjects,
                                                    dayIdx: d.getDay(),
                                                    month: d.toLocaleDateString('en-US', { month: 'short' }),
                                                    isFirstOfWeek: d.getDay() === 0,
                                                    isFirstOfMonth: d.getDate() === 1 || (i === 0) || (d.getDate() <= 7 && d.getDay() === 0)
                                                });

                                                if (d.getDay() === 6 || i === totalDays) {
                                                    weeks.push(currentWeek);
                                                    currentWeek = [];
                                                }
                                            }

                                            const getLevel = (p: number, a: number) => {
                                                if (p === 0 && a === 0) return 0;
                                                if (p === 0 && a > 0) return -1; // Specific for "only absences"
                                                if (p === 1) return 1;
                                                if (p === 2) return 2;
                                                if (p === 3) return 3;
                                                return 4;
                                            };

                                            const COLORS: Record<number, string> = {
                                                [-1]: '#EF4444', // Red for only absent
                                                0: 'var(--bg-primary)',
                                                1: '#0e4429',
                                                2: '#006d32',
                                                3: '#26a641',
                                                4: '#39d353'
                                            };

                                            return (
                                                <div className="github-heatmap-container">
                                                    <div className="heatmap-header-row">
                                                        <div className="day-label-cols" />
                                                        <div className="weeks-labels-container">
                                                            {weeks.map((w, idx) => {
                                                                const firstDay = w[0];
                                                                const currentMonth = firstDay.month;
                                                                const prevMonth = idx > 0 ? weeks[idx-1][0].month : null;
                                                                const showMonth = idx === 0 || (currentMonth !== prevMonth);
                                                                
                                                                return (
                                                                    <div key={idx} className="month-label-col">
                                                                        {showMonth ? <span className="month-name-tag">{currentMonth}</span> : null}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="heatmap-grid-core">
                                                        <div className="day-labels">
                                                            <span>Sun</span>
                                                            <span>Mon</span>
                                                            <span>Tue</span>
                                                            <span>Wed</span>
                                                            <span>Thu</span>
                                                            <span>Fri</span>
                                                            <span>Sat</span>
                                                        </div>
                                                        <div className="weeks-container">
                                                            {weeks.map((week, wIdx) => (
                                                                <div key={wIdx} className="heatmap-column">
                                                                    {Array.from({ length: 7 }).map((_, dIdx) => {
                                                                        const day = week.find((d: any) => d.dayIdx === dIdx);
                                                                        if (!day) return <div key={dIdx} className="heatmap-square empty" />;
                                                                        const level = getLevel(day.present, day.absent);
                                                                        const isSelected = selectedHeatmapDay?.dateStr === day.dateStr;
                                                                        return (
                                                                            <div 
                                                                                key={dIdx} 
                                                                                className={`heatmap-square level-${level} ${isSelected ? 'selected' : ''}`} 
                                                                                style={{ background: COLORS[level], outline: isSelected ? '2px solid #fff' : 'none', cursor: 'pointer' }}
                                                                                title={`${day.niceDate}: ${day.present} present, ${day.absent} absent`}
                                                                                onClick={() => setSelectedHeatmapDay(day)}
                                                                            />
                                                                        );
                                                                    })}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="heatmap-footer">
                                                        <div className="legend">
                                                            <span>Less</span>
                                                            <div className="heatmap-square" style={{ background: COLORS[0] }} />
                                                            <div className="heatmap-square" style={{ background: COLORS[1] }} />
                                                            <div className="heatmap-square" style={{ background: COLORS[2] }} />
                                                            <div className="heatmap-square" style={{ background: COLORS[3] }} />
                                                            <div className="heatmap-square" style={{ background: COLORS[4] }} />
                                                            <span>More</span>
                                                        </div>
                                                    </div>

                                                    {/* Day Details Panel */}
                                                    {selectedHeatmapDay && (
                                                        <div className="heatmap-details-panel">
                                                            <div className="details-header">
                                                                <h4 className="details-title">Details for {selectedHeatmapDay.niceDate}</h4>
                                                                <button className="close-details" onClick={() => setSelectedHeatmapDay(null)}>&times;</button>
                                                            </div>
                                                            <div className="details-content">
                                                                <div className="details-section">
                                                                    <div className="section-title" style={{ color: '#10b981' }}>Attended ({selectedHeatmapDay.present})</div>
                                                                    {selectedHeatmapDay.presentSubjects.length > 0 ? (
                                                                        <ul className="subject-list">
                                                                            {selectedHeatmapDay.presentSubjects.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                                        </ul>
                                                                    ) : <p className="no-data">No classes attended</p>}
                                                                </div>
                                                                <div className="details-section">
                                                                    <div className="section-title" style={{ color: '#ef4444' }}>Missed ({selectedHeatmapDay.absent})</div>
                                                                    {selectedHeatmapDay.absentSubjects.length > 0 ? (
                                                                        <ul className="subject-list">
                                                                            {selectedHeatmapDay.absentSubjects.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                                        </ul>
                                                                    ) : <p className="no-data">No classes missed</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
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
                                <div className="history-tab-container">
                                    {/* Mobile Semester Selector */}
                                    <div className="mobile-history-selector">
                                        <label htmlFor="sem-select" className="stat-label" style={{ paddingLeft: '4px' }}>Select Semester</label>
                                        <select 
                                            id="sem-select"
                                            className="sem-history-select" 
                                            value={selectedHistoryIdx}
                                            onChange={(e) => setSelectedHistoryIdx(parseInt(e.target.value))}
                                        >
                                            {[...examHistory].reverse().map((sem: any, idx: number) => (
                                                <option key={idx} value={idx}>
                                                    {sem.semester} (SGPA: {sem.sgpa})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="history-grid">
                                        {[...examHistory].reverse().map((sem: any, idx: number) => (
                                            <div key={idx} className={`chart-card history-card ${selectedHistoryIdx === idx ? 'mobile-show' : 'mobile-hide'}`}>
                                                <div className="chart-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '16px' }}>
                                                    <div>
                                                        <span className="pill" style={{ marginBottom: '8px' }}>Semester {examHistory.length - idx}</span>
                                                        <h3 className="chart-title">{sem.semester}</h3>
                                                    </div>
                                                    <div className="history-sgpa-badge">
                                                        <div className="stat-label">SGPA</div>
                                                        <div className="stat-value">{sem.sgpa}</div>
                                                    </div>
                                                </div>
                                                <div className="dashboard-table-container">
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
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <style jsx>{`
                .insight-item { padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 8px; display: flex; gap: 12px; }
                
                /* GitHub Heatmap Styles */
                .github-heatmap-container { display: flex; flex-direction: column; gap: 8px; padding: 20px 10px; width: 100%; overflow-x: auto; scrollbar-width: none; }
                .github-heatmap-container::-webkit-scrollbar { display: none; }
                .heatmap-header-row { display: flex; margin-bottom: 20px; position: relative; height: 18px; width: 100%; }
                .weeks-labels-container { display: flex; gap: 6px; flex: 1; }
                .month-label-col { position: relative; flex: 1; }
                .month-name-tag { position: absolute; left: 0; top: 0; font-size: 11px; font-weight: 700; color: var(--text-muted); white-space: nowrap; }
                .day-label-cols { width: 40px; flex-shrink: 0; }
                .heatmap-grid-core { display: flex; gap: 12px; width: 100%; }
                .day-labels { display: flex; flex-direction: column; justify-content: space-between; padding: 6px 0; height: auto; width: 40px; flex-shrink: 0; aspect-ratio: 0.25; }
                .day-labels span { font-size: 11px; color: var(--text-muted); line-height: 1; margin-bottom: 4px; }
                .weeks-container { display: flex; gap: 6px; flex: 1; width: 100%; }
                .heatmap-column { display: flex; flex-direction: column; gap: 6px; flex: 1; }
                .heatmap-square { width: 100%; aspect-ratio: 1; border-radius: 3px; max-width: 25px; min-width: 8px; }
                .heatmap-square.empty { visibility: hidden; }
                .heatmap-footer { display: flex; justify-content: flex-end; margin-top: 16px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
                .legend { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); }
                .legend .heatmap-square { width: 14px; height: 14px; }

                /* Heatmap Details Panel */
                .heatmap-details-panel { margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 12px; animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .details-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .details-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
                .close-details { background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; }
                .details-content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
                .subject-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; }
                .subject-list li { font-size: 13px; color: var(--text-secondary); padding: 4px 8px; background: rgba(255,255,255,0.02); border-radius: 4px; }
                .no-data { font-size: 12px; color: var(--text-muted); font-style: italic; }

                /* Premium Predictor Card Styles */
                .predictor-layout { display: grid; grid-template-columns: 300px 1fr; gap: 32px; padding: 20px; }
                @media (max-width: 900px) { .predictor-layout { grid-template-columns: 1fr; } }
                
                .predictor-scoreboard { 
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
                    border: 1px solid var(--border-subtle);
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                }
                .score-item { text-align: center; }
                .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-muted); margin-bottom: 8px; }
                .score-value { font-size: 42px; font-weight: 900; line-height: 1; }
                .sgpa .score-value { color: #10b981; text-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
                .cgpa .score-value { color: #8b5cf6; text-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
                .score-divider { width: 40px; height: 2px; background: var(--border-subtle); border-radius: 2px; }
                .score-footer { font-size: 11px; color: var(--text-muted); margin-top: 10px; }

                .predictor-controls { display: flex; flex-direction: column; gap: 16px; }
                .controls-header { display: flex; justify-content: space-between; padding: 0 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
                .controls-labels { display: flex; gap: 50px; margin-right: 40px; }
                .controls-scrollable { maxHeight: 320px; overflow-Y: auto; padding-right: 12px; display: flex; flex-direction: column; gap: 8px; }
                
                .subject-row { 
                    display: flex; justify-content: space-between; align-items: center; padding: 12px 16px;
                    background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .subject-row:hover { background: rgba(255,255,255,0.04); border-color: var(--accent-primary); transform: translateX(4px); }
                .subj-name { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
                .subj-code { font-size: 11px; color: var(--text-muted); }
                .subj-pickers { display: flex; gap: 12px; }
                
                .simulator-select {
                    background: var(--bg-card); border: 1px solid var(--border-subtle); color: var(--text-primary);
                    padding: 8px 28px 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; outline: none; cursor: pointer;
                    appearance: none; -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2300ADB5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 8px center;
                    background-size: 14px;
                    transition: all 0.2s ease;
                }
                .simulator-select:hover { border-color: var(--accent-primary); background: var(--bg-secondary); }
                .simulator-select:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 2px rgba(0, 173, 181, 0.2); }
                .grade-select { min-width: 60px; text-align: center; }
                .credit-select { color: var(--accent-primary); min-width: 80px; }
                .insight-icon { color: var(--accent-primary); flex-shrink: 0; }
                .insight-label { font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; }
                .insight-value { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
                .empty-history { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-subtle); text-align: center; gap: 16px; width: 100%; grid-column: 1/-1; }
                .hover-row:hover { background: rgba(255,255,255,0.03); }

                @media (max-width: 600px) {
                    .predictor-layout { padding: 4px; gap: 12px; }
                    .predictor-scoreboard { padding: 12px; gap: 8px; flex-direction: row; }
                    .score-item { flex: 1; }
                    .score-value { font-size: 32px; letter-spacing: -0.02em; }
                    .score-label { font-size: 9px; margin-bottom: 4px; }
                    .controls-header, .score-footer, .score-divider { display: none !important; }
                    .subject-row { 
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 12px; 
                        align-items: center;
                        gap: 12px;
                    }
                    .subj-pickers { display: flex; flex-direction: row; gap: 4px; flex-shrink: 0; }
                    .simulator-select { width: auto; min-width: 0; padding: 6px 20px 6px 8px; font-size: 10px; background-size: 10px; background-position: right 4px center; border-radius: 6px; }
                    .credit-select { min-width: 60px; }
                    .grade-select { min-width: 50px; }
                    .subj-name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
                    
                    /* Force Heatmap to not break */
                    .github-heatmap-container { padding: 12px 4px; }
                    .heatmap-grid-core { width: max-content; min-width: 100%; }
                    .weeks-container { width: max-content; }
                    
                    .insight-item { flex-direction: column; text-align: center; align-items: center; }
                    .details-content { grid-template-columns: 1fr; gap: 12px; }
                }
            `}</style>
        </div>
    );
}
