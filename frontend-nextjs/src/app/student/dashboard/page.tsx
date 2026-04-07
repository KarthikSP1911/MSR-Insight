"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, LineChart, Line, PieChart, Pie, Cell,
    ComposedChart, Legend, CartesianGrid
} from "recharts";
import {
    LayoutDashboard, Target, History, LogOut, FileText,
    ExternalLink, Award, TrendingUp, TrendingDown, BookOpen,
    Calendar, GraduationCap, Trophy, Clock, BarChart3,
    ChevronDown, Download, AlertCircle, CheckCircle2, XCircle, Menu, X, RefreshCw
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

    const gradeDistribution = examHistory.flatMap((sem: any) => sem.courses?.map((c: any) => c.grade) || [])
        .reduce((acc: any, grade: string) => {
            acc[grade] = (acc[grade] || 0) + 1;
            return acc;
        }, {});

    const gradeChartData = Object.entries(gradeDistribution)
        .map(([grade, count]) => ({ grade, count, color: (GRADE_COLORS[grade] || '#64748b') as string }))
        .sort((a, b) => (b.count as number) - (a.count as number));

    return (
        <div className="student-dashboard-container">
            {toast.show && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 9999, padding: '12px 24px', borderRadius: '8px',
                    background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#f59e0b',
                    color: '#ffffff', fontWeight: 500, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <nav className="sidebar-navigation">
                    <button className={`nav-button ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
                        <Target size={20} /> <span>Current Semester</span>
                    </button>
                    <button className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                        <BarChart3 size={20} /> <span>Analytics</span>
                    </button>
                    <button className={`nav-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        <History size={20} /> <span>Exam History</span>
                    </button>
                    <button className="nav-button" onClick={handleUpdate} disabled={isUpdating}>
                        <RefreshCw size={20} className={isUpdating ? "spinning" : ""} /> <span>{isUpdating ? "Updating..." : "Update Data"}</span>
                    </button>
                </nav>
            </aside>

            <main className="dashboard-main-content">
                <div className="content-wrapper">
                    {selectedSubject && <SubjectDetail subject={selectedSubject} onBack={() => setSelectedSubject(null)} />}

                    {!selectedSubject && activeTab === 'performance' && (
                        <div className="tab-content">
                            <div className="page-header"><h1 className="page-title">Current Semester Performance</h1></div>
                            <div className="chart-card">
                                <div className="chart-header"><h3 className="chart-title">Attendance Overview</h3></div>
                                <div className="chart-body" style={{ height: '380px' }}>
                                    <ResponsiveContainer width="100%" height={380}>
                                        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={10} data={currentSem.map((s: any, i: number) => ({ ...s, fill: ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5] }))}>
                                            <RadialBar clockWise dataKey="attendance" cornerRadius={10} />
                                            <Tooltip />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="dashboard-table-container">
                                <table className="dashboard-table">
                                    <thead><tr><th>Code</th><th>Subject</th><th>Attendance</th><th>CIE</th></tr></thead>
                                    <tbody>
                                        {currentSem.map((s: any, i: number) => (
                                            <tr key={i} onClick={() => setSelectedSubject(s)} style={{ cursor: 'pointer' }}>
                                                <td>{s.code}</td><td>{s.name}</td><td>{Math.round(s.attendance)}%</td><td>{s.marks}/50</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!selectedSubject && activeTab === 'analytics' && (
                        <div className="tab-content">
                            <div className="page-header"><h1 className="page-title">Academic Analytics</h1></div>
                            <div className="charts-grid">
                                <div className="chart-card wide-chart">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={currentSem}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="code" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="attendance" fill="#3b82f6" />
                                            <Bar dataKey="marks" fill="#a855f7" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
