import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    ChevronDown, Download, AlertCircle, CheckCircle2, XCircle, Menu, X
} from "lucide-react";
import "./StudentDashboard.css";

const GRADE_COLORS = {
    'O': '#8b5cf6',
    'A+': '#3b82f6',
    'A': '#10b981',
    'B+': '#f59e0b',
    'B': '#f97316',
    'C': '#ef4444',
};

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [detailedData, setDetailedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('performance');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const sessionId = localStorage.getItem("studentSessionId");
            const usn = localStorage.getItem("studentUsn");

            if (!sessionId || !usn) {
                navigate("/student-login");
                return;
            }

            try {
                const response = await axios.get("http://localhost:5000/api/auth/profile", {
                    headers: { "x-session-id": sessionId },
                });

                if (response.data.success) {
                    setStudent(response.data.data);
                }

                const detailedResp = await axios.get(`http://localhost:5000/api/report/student/${usn}`, {
                    headers: { "x-session-id": sessionId },
                });

                if (detailedResp.data.success && detailedResp.data.data) {
                    setDetailedData(detailedResp.data.data);
                }

            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.clear();
                    navigate("/student-login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/student-login");
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        closeMobileMenu();
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
    const currentSem = detailedData?.current_semester || [];
    const examHistory = detailedData?.exam_history || [];

    const overallAttendance = currentSem.length
        ? Math.round(currentSem.reduce((acc, curr) => acc + curr.attendance, 0) / currentSem.length)
        : 0;

    const overallCIE = currentSem.length
        ? Math.round(currentSem.reduce((acc, curr) => acc + curr.cie, 0) / currentSem.length)
        : 0;

    const sgpaTrendData = [...examHistory].reverse().map(sem => ({
        name: sem.semester.split(' ')[0] + ' ' + (sem.semester.split(' ')[2]?.substring(2) || ''),
        sgpa: parseFloat(sem.sgpa),
        credits: parseInt(sem.credits_earned || 0)
    }));

    const totalCredits = examHistory.reduce((acc, sem) => acc + parseInt(sem.credits_earned || 0), 0);
    const latestSGPA = examHistory.length > 0 ? parseFloat(examHistory[0].sgpa) : 0;
    const prevSGPA = examHistory.length > 1 ? parseFloat(examHistory[1].sgpa) : 0;
    const sgpaDiff = (latestSGPA - prevSGPA).toFixed(2);
    const isImproved = prevSGPA === 0 || sgpaDiff >= 0;

    // Attendance distribution for pie chart
    const attendanceCategories = currentSem.reduce((acc, subject) => {
        if (subject.attendance >= 85) acc.excellent++;
        else if (subject.attendance >= 75) acc.good++;
        else acc.needsImprovement++;
        return acc;
    }, { excellent: 0, good: 0, needsImprovement: 0 });

    const attendancePieData = [
        { name: 'Excellent (≥85%)', value: attendanceCategories.excellent, color: '#10b981' },
        { name: 'Good (75-84%)', value: attendanceCategories.good, color: '#f59e0b' },
        { name: 'Needs Work (<75%)', value: attendanceCategories.needsImprovement, color: '#ef4444' }
    ].filter(item => item.value > 0);

    // Grade distribution
    const allGrades = examHistory.flatMap(sem => sem.courses?.map(c => c.grade) || []);
    const gradeDistribution = allGrades.reduce((acc, grade) => {
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
    }, {});

    const gradeChartData = Object.entries(gradeDistribution)
        .map(([grade, count]) => ({ grade, count, color: GRADE_COLORS[grade] || '#64748b' }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="student-dashboard-container">
            {/* Mobile Menu Toggle Button */}
            <button
                className="mobile-menu-toggle"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={closeMobileMenu}
            ></div>

            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>

                <nav className="sidebar-navigation">
                    <button
                        className={`nav-button ${activeTab === 'performance' ? 'active' : ''}`}
                        onClick={() => handleTabChange('performance')}
                    >
                        <Target size={20} />
                        <span>Current Semester</span>
                    </button>
                    <button
                        className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => handleTabChange('analytics')}
                    >
                        <BarChart3 size={20} />
                        <span>Analytics</span>
                    </button>
                    <button
                        className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => handleTabChange('history')}
                    >
                        <History size={20} />
                        <span>Exam History</span>
                    </button>
                </nav>


            </aside>

            {/* Main Content */}
            <main className="dashboard-main-content">
                <div className="content-wrapper">


                    {/* CURRENT SEMESTER PERFORMANCE TAB */}
                    {activeTab === 'performance' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <div className="header-content">
                                    <h1 className="page-title">Current Semester Performance</h1>
                                    <p className="page-subtitle">Detailed breakdown of your ongoing semester</p>
                                </div>
                            </div>

                            {/* Single Column Layout for Current Semester */}
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
                                                <RadialBarChart
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="20%"
                                                    outerRadius="100%"
                                                    barSize={10}
                                                    data={currentSem.map((entry, index) => {
                                                        const pieColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6'];
                                                        return {
                                                            ...entry,
                                                            fill: pieColors[index % pieColors.length]
                                                        };
                                                    })}
                                                >
                                                    <RadialBar
                                                        minAngle={15}
                                                        background={{ fill: 'rgba(255,255,255,0.03)' }}
                                                        clockWise
                                                        dataKey="attendance"
                                                        cornerRadius={10}
                                                        activeShape={false}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{
                                                            backgroundColor: '#1e293b',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '12px',
                                                            color: '#ffffff'
                                                        }}
                                                        itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                                                        formatter={(value) => [`${value}%`, '']}
                                                        separator=""
                                                        labelFormatter={(label, payload) => {
                                                            return payload?.[0]?.payload?.name || '';
                                                        }}
                                                    />
                                                </RadialBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', minWidth: 0 }}>
                                            {currentSem.map((subject, index) => {
                                                const pieColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6'];
                                                const color = pieColors[index % pieColors.length];
                                                const maxLength = 36;
                                                const displayName = subject.name && subject.name.length > maxLength
                                                    ? subject.name.substring(0, maxLength) + '...'
                                                    : (subject.name || 'Subject');

                                                return (
                                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}></div>
                                                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {displayName}
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                    <div className="chart-body" style={{ height: '380px', width: '100%', minHeight: '380px' }}>
                                        <ResponsiveContainer width="100%" height={380}>
                                            <BarChart
                                                data={currentSem.map(subject => ({
                                                    ...subject,
                                                    code: subject.code || subject.name.substring(0, 6)
                                                }))}
                                                margin={{ top: 20, right: 0, left: -20, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis
                                                    dataKey="code"
                                                    stroke="#64748b"
                                                    style={{ fontSize: '11px' }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                    interval={0}
                                                />
                                                <YAxis
                                                    domain={[0, 50]}
                                                    stroke="#64748b"
                                                    style={{ fontSize: '12px' }}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                                    contentStyle={{
                                                        backgroundColor: '#1e293b',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '12px',
                                                        color: '#ffffff'
                                                    }}
                                                    itemStyle={{ color: '#ffffff' }}
                                                    labelStyle={{ color: '#ffffff' }}
                                                    formatter={(value, name, props) => [`${value}/50`, props.payload.name]}
                                                    labelFormatter={(label) => ''}
                                                />
                                                <Bar
                                                    dataKey="cie"
                                                    radius={[8, 8, 0, 0]}
                                                    barSize={35}
                                                >
                                                    {currentSem.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={`url(#cieGradient${index})`}
                                                        />
                                                    ))}
                                                </Bar>
                                                <defs>
                                                    {currentSem.map((_, index) => (
                                                        <linearGradient key={index} id={`cieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity={0} />
                                                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.6} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Subjects Data Table */}
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
                                            {currentSem.map((subject, idx) => {
                                                const attendanceLevel = subject.attendance >= 85 ? 'success' : subject.attendance >= 75 ? 'warning' : 'error';
                                                const ciePercentage = (subject.cie / 50) * 100;
                                                const cieLevel = ciePercentage >= 80 ? 'success' : ciePercentage >= 60 ? 'warning' : 'error';

                                                let status = "Excellent";
                                                if (attendanceLevel === 'error' || cieLevel === 'error') status = "Needs Work";
                                                else if (attendanceLevel === 'warning' || cieLevel === 'warning') status = "Good";

                                                return (
                                                    <tr key={idx}>
                                                        <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{subject.code || '-'}</td>
                                                        <td style={{ fontWeight: 500 }}>{subject.name}</td>
                                                        <td>
                                                            <span className={`pill ${attendanceLevel}`}>
                                                                {subject.attendance}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`pill ${cieLevel}`}>
                                                                {subject.cie} / 50
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{status}</span>
                                                        </td>
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
                    {activeTab === 'analytics' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <div className="header-content">
                                    <h1 className="page-title">Academic Analytics</h1>
                                    <p className="page-subtitle">Deep insights into your academic journey</p>
                                </div>
                            </div>

                            <div className="charts-grid">
                                {/* Attendance vs CIE Comparison */}
                                {currentSem.length > 0 && (
                                    <div className="chart-card wide-chart">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">Attendance vs Internal Marks Correlation</h3>
                                                <p className="chart-subtitle">Analyzing the relationship between attendance and performance</p>
                                            </div>
                                            <div className="chart-legend">
                                                <div className="legend-item">
                                                    <div className="legend-color attendance-color"></div>
                                                    <span>Attendance %</span>
                                                </div>
                                                <div className="legend-item">
                                                    <div className="legend-color cie-color"></div>
                                                    <span>CIE Score</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="chart-body large-chart">
                                            <ResponsiveContainer width="100%" height={400}>
                                                <BarChart
                                                    data={currentSem.map(subject => ({
                                                        ...subject,
                                                        shortName: subject.code || (subject.name ? subject.name.substring(0, 8) : 'SUB'),
                                                        ciePercentage: ((subject.cie || 0) / 50) * 100
                                                    }))}
                                                    margin={{ top: 20, right: 30, bottom: 40, left: 20 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis
                                                        dataKey="shortName"
                                                        stroke="#94a3b8"
                                                        style={{ fontSize: '11px' }}
                                                        textAnchor="middle"
                                                    />
                                                    <YAxis
                                                        stroke="#94a3b8"
                                                        style={{ fontSize: '12px' }}
                                                        domain={[0, 100]}
                                                        label={{ value: 'Percentage %', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '12px' } }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                                        contentStyle={{
                                                            backgroundColor: '#1e293b',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '12px',
                                                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                                            color: '#ffffff'
                                                        }}
                                                        itemStyle={{ color: '#ffffff' }}
                                                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                                                        formatter={(value, name, props) => {
                                                            if (name === 'attendance') return [`${value}%`, 'Attendance'];
                                                            if (name === 'ciePercentage') return [`${props.payload.cie}/50`, 'CIE Score'];
                                                            return [value, name];
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="attendance"
                                                        fill="#3b82f6"
                                                        radius={[4, 4, 0, 0]}
                                                        barSize={20}
                                                        name="attendance"
                                                    />
                                                    <Bar
                                                        dataKey="ciePercentage"
                                                        fill="#a855f7"
                                                        radius={[4, 4, 0, 0]}
                                                        barSize={20}
                                                        name="ciePercentage"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                                {/* Grade Distribution */}
                                {gradeChartData.length > 0 && (
                                    <div className="chart-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">Grade Distribution</h3>
                                                <p className="chart-subtitle">All-time performance</p>
                                            </div>
                                        </div>
                                        <div className="chart-body">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={gradeChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="grade" stroke="#64748b" />
                                                    <YAxis stroke="#64748b" />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                                        contentStyle={{
                                                            backgroundColor: '#1e293b',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '12px',
                                                            color: '#ffffff'
                                                        }}
                                                        itemStyle={{ color: '#ffffff' }}
                                                    />
                                                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                                        {gradeChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Credits Progress */}
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Credits Progress</h3>
                                            <p className="chart-subtitle">Semester-wise accumulation</p>
                                        </div>
                                    </div>
                                    <div className="chart-body">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={sgpaTrendData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                                                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                                    contentStyle={{
                                                        backgroundColor: '#1e293b',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '12px',
                                                        color: '#ffffff'
                                                    }}
                                                    itemStyle={{ color: '#ffffff' }}
                                                />
                                                <Bar dataKey="credits" fill="#10b981" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Performance Insights */}
                                <div className="chart-card wide-chart">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Performance Insights</h3>
                                            <p className="chart-subtitle">Key observations from your data</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ color: 'var(--success)' }}>
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Academic Standing</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                    Your CGPA of {detailedData?.cgpa || latestSGPA} is {detailedData?.cgpa >= 9 ? 'outstanding' : detailedData?.cgpa >= 8 ? 'excellent' : detailedData?.cgpa >= 7 ? 'very good' : 'good'}. {isImproved && sgpaDiff > 0 ? `You've improved by ${sgpaDiff} from last semester!` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ color: overallAttendance >= 85 ? 'var(--success)' : overallAttendance >= 75 ? 'var(--warning)' : 'var(--error)' }}>
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Attendance Analysis</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                    {overallAttendance >= 85
                                                        ? 'Excellent attendance! You\'re well above the 75% requirement.'
                                                        : overallAttendance >= 75
                                                            ? 'Your attendance is adequate but try to aim for 85% for better academic standing.'
                                                            : 'Warning: Your attendance is below 75%. This may affect your eligibility for exams.'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ color: '#3b82f6' }}>
                                                <BookOpen size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>CIE Performance</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                    Average CIE score of {overallCIE}/50 ({Math.round((overallCIE / 50) * 100)}%). {overallCIE >= 40 ? 'Strong performance in internals!' : overallCIE >= 30 ? 'Good progress, aim for higher scores.' : 'Focus on improving internal assessments.'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ color: '#8b5cf6' }}>
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Credits Progress</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                    {totalCredits} out of 160 credits earned ({Math.round((totalCredits / 160) * 100)}%). {totalCredits >= 120 ? 'You\'re in the final stretch!' : totalCredits >= 80 ? 'Halfway through your degree!' : 'Keep up the good work!'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EXAM HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <div className="header-content">
                                    <h1 className="page-title">Exam History</h1>
                                    <p className="page-subtitle">Complete record of your academic performance</p>
                                </div>
                            </div>

                            {examHistory.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                    <History size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No exam history available</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your previous semester records will appear here.</p>
                                </div>
                            ) : (
                                <div className="history-grid">
                                    {examHistory.map((sem, idx) => (
                                        <div key={idx} className="chart-card">
                                            <div className="chart-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                        <span className="pill" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Semester {idx + 1}</span>
                                                        <h3 className="chart-title" style={{ margin: 0, fontSize: '18px' }}>{sem.semester}</h3>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                        <Award size={14} /> <span>{sem.credits_earned} Credits Earned</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>SGPA</div>
                                                    <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{sem.sgpa}</div>
                                                </div>
                                            </div>

                                            <div className="dashboard-table-container" style={{ border: 'none', borderRadius: '0', background: 'transparent' }}>
                                                <table className="dashboard-table">
                                                    <thead>
                                                        <tr>
                                                            <th style={{ padding: '12px 0' }}>Code</th>
                                                            <th style={{ padding: '12px 0' }}>Course Name</th>
                                                            <th style={{ padding: '12px 0', textAlign: 'right' }}>Grade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sem.courses?.map((course, cIdx) => (
                                                            <tr key={cIdx}>
                                                                <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>{course.code}</td>
                                                                <td style={{ padding: '12px 0', fontWeight: '500' }}>{course.name}</td>
                                                                <td style={{ padding: '12px 0', textAlign: 'right' }}>
                                                                    <span
                                                                        className="pill"
                                                                        style={{
                                                                            backgroundColor: `${GRADE_COLORS[course.grade] || '#64748b'}15`,
                                                                            color: GRADE_COLORS[course.grade] || '#94a3b8',
                                                                            borderColor: `${GRADE_COLORS[course.grade] || '#64748b'}30`,
                                                                            fontWeight: 600
                                                                        }}
                                                                    >
                                                                        {course.grade}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;