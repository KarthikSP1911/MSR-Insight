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
    ChevronDown, Download, AlertCircle, CheckCircle2, XCircle
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
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchProfile = async () => {
            const sessionId = localStorage.getItem("studentSessionId");
            const usn = localStorage.getItem("studentUsn");

            if (!sessionId || !usn) {
                navigate("/student-login");
                return;
            }

            try {
                const response = await axios.get("http://localhost:5001/api/auth/profile", {
                    headers: { "x-session-id": sessionId },
                });

                if (response.data.success) {
                    setStudent(response.data.data);
                }

                const detailedResp = await axios.get(`http://localhost:5001/api/report/student/${usn}`, {
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
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <GraduationCap size={24} />
                        </div>
                        <span className="logo-text">
                            Academic<span className="logo-accent">Hub</span>
                        </span>
                    </div>
                </div>
                
                <nav className="sidebar-navigation">
                    <button 
                        className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('overview')}
                    >
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </button>
                    <button 
                        className={`nav-button ${activeTab === 'performance' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('performance')}
                    >
                        <Target size={20} />
                        <span>Current Semester</span>
                    </button>
                    <button 
                        className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('analytics')}
                    >
                        <BarChart3 size={20} />
                        <span>Analytics</span>
                    </button>
                    <button 
                        className={`nav-button ${activeTab === 'history' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('history')}
                    >
                        <History size={20} />
                        <span>Exam History</span>
                    </button>
                    <button 
                        className={`nav-button ${activeTab === 'reports' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('reports')}
                    >
                        <FileText size={20} />
                        <span>Reports</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile-card">
                        <div className="user-avatar">
                            {detailedData?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{detailedData?.name}</div>
                            <div className="user-usn">{detailedData?.usn}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="logout-button">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main-content">
                <div className="content-wrapper">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <div className="header-content">
                                    <h1 className="page-title">
                                        Welcome back, <span className="highlight">{student?.name?.split(' ')[0]}</span>! 👋
                                    </h1>
                                    <p className="page-subtitle">Here's your academic performance at a glance</p>
                                </div>
                                <div className="semester-badge">
                                    <div className="status-dot"></div>
                                    <span>Semester ODD Feb 2025</span>
                                </div>
                            </div>

                            {/* Stats Cards Row */}
                            <div className="stats-grid">
                                <div className="stat-card cgpa-card">
                                    <div className="stat-header">
                                        <div className="stat-icon cgpa-icon">
                                            <Trophy size={28} />
                                        </div>
                                        {prevSGPA !== 0 && (
                                            <div className={`trend-badge ${isImproved ? 'positive' : 'negative'}`}>
                                                {isImproved ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                <span>{Math.abs(sgpaDiff)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-label">Cumulative GPA</div>
                                        <div className="stat-value cgpa-value">
                                            {detailedData?.cgpa || latestSGPA || 'N/A'}
                                        </div>
                                        <div className="stat-subtitle">Out of 10.0</div>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon attendance-icon">
                                        <Calendar size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-label">Average Attendance</div>
                                        <div className="stat-value">{overallAttendance}%</div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill attendance-progress" 
                                                style={{width: `${overallAttendance}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon cie-icon">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-label">Average CIE Score</div>
                                        <div className="stat-value">{overallCIE}<span className="stat-max">/50</span></div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill cie-progress" 
                                                style={{width: `${(overallCIE/50)*100}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon credits-icon">
                                        <Award size={24} />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-label">Credits Earned</div>
                                        <div className="stat-value">{totalCredits}<span className="stat-max">/160</span></div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill credits-progress" 
                                                style={{width: `${(totalCredits/160)*100}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="charts-grid">
                                {/* SGPA Trend */}
                                {examHistory.length > 0 && (
                                    <div className="chart-card wide-chart">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">SGPA Performance Trend</h3>
                                                <p className="chart-subtitle">Your semester-wise academic progress</p>
                                            </div>
                                        </div>
                                        <div className="chart-body">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={sgpaTrendData}>
                                                    <defs>
                                                        <linearGradient id="sgpaGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        stroke="#64748b" 
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis 
                                                        domain={[0, 10]} 
                                                        stroke="#64748b"
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: '#1e293b', 
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '12px',
                                                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                                                        }}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="sgpa" 
                                                        stroke="#8b5cf6" 
                                                        strokeWidth={3}
                                                        fill="url(#sgpaGradient)"
                                                        activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Attendance Distribution */}
                                {attendancePieData.length > 0 && (
                                    <div className="chart-card">
                                        <div className="chart-header">
                                            <div>
                                                <h3 className="chart-title">Attendance Overview</h3>
                                                <p className="chart-subtitle">Subject-wise distribution</p>
                                            </div>
                                        </div>
                                        <div className="chart-body">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={attendancePieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {attendancePieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: '#1e293b', 
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '12px'
                                                        }}
                                                    />
                                                    <Legend 
                                                        verticalAlign="bottom" 
                                                        height={36}
                                                        iconType="circle"
                                                        wrapperStyle={{ fontSize: '12px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CURRENT SEMESTER PERFORMANCE TAB */}
                    {activeTab === 'performance' && (
                        <div className="tab-content">
                            <div className="page-header">
                                <div className="header-content">
                                    <h1 className="page-title">Current Semester Performance</h1>
                                    <p className="page-subtitle">Detailed breakdown of your ongoing semester</p>
                                </div>
                            </div>

                            {/* Two Separate Charts Side by Side */}
                            <div className="charts-row">
                                {/* Attendance Pie Chart */}
                                <div className="chart-card half-width">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Attendance Overview</h3>
                                            <p className="chart-subtitle">Subject-wise attendance distribution</p>
                                        </div>
                                    </div>
                                    <div className="chart-body medium-chart">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart 
                                                cx="50%" 
                                                cy="45%" 
                                                innerRadius="30%" 
                                                outerRadius="100%" 
                                                barSize={12} 
                                                data={currentSem.map((entry, index) => {
                                                    const pieColors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];
                                                    return {
                                                        ...entry,
                                                        fill: pieColors[index % pieColors.length]
                                                    };
                                                })}
                                            >
                                                <RadialBar
                                                    minAngle={15}
                                                    background={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    clockWise
                                                    dataKey="attendance"
                                                    cornerRadius={10}
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ 
                                                        backgroundColor: '#1e293b', 
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '12px',
                                                        color: '#ffffff'
                                                    }}
                                                    itemStyle={{ color: '#ffffff' }}
                                                    formatter={(value, name, props) => [`${value}%`, props.payload.name]}
                                                />
                                                <Legend 
                                                    iconSize={10}
                                                    verticalAlign="bottom"
                                                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                                    formatter={(value, entry) => {
                                                        const payloadName = entry.payload?.name || value;
                                                        const maxLength = 20;
                                                        return typeof payloadName === 'string' && payloadName.length > maxLength 
                                                            ? payloadName.substring(0, maxLength) + '...' 
                                                            : payloadName;
                                                    }}
                                                />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* CIE Marks Chart */}
                                <div className="chart-card half-width">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Internal Marks (CIE)</h3>
                                            <p className="chart-subtitle">Subject-wise CIE scores out of 50</p>
                                        </div>
                                    </div>
                                    <div className="chart-body medium-chart">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                data={currentSem.map(subject => ({
                                                    ...subject,
                                                    code: subject.code || subject.name.substring(0, 6)
                                                }))}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                                                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8}/>
                                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Subject Cards Grid */}
                            <div className="subjects-grid">
                                {currentSem.map((subject, idx) => (
                                    <div key={idx} className="subject-card">
                                        <div className="subject-header">
                                            <h4 className="subject-name">{subject.name}</h4>
                                            <div className={`attendance-badge ${
                                                subject.attendance >= 85 ? 'excellent' : 
                                                subject.attendance >= 75 ? 'good' : 'warning'
                                            }`}>
                                                {subject.attendance >= 85 ? <CheckCircle2 size={14} /> : 
                                                 subject.attendance >= 75 ? <AlertCircle size={14} /> : 
                                                 <XCircle size={14} />}
                                                <span>{subject.attendance}%</span>
                                            </div>
                                        </div>
                                        
                                        <div className="subject-stats-dual">
                                            <div className="stat-item">
                                                <div className="stat-item-label">Attendance</div>
                                                <div className="stat-item-value-large">{subject.attendance}<span>%</span></div>
                                                <div className="mini-progress">
                                                    <div 
                                                        className="mini-progress-fill attendance-fill"
                                                        style={{width: `${subject.attendance}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                            
                                            <div className="stat-divider"></div>
                                            
                                            <div className="stat-item">
                                                <div className="stat-item-label">CIE Score</div>
                                                <div className="stat-item-value-large">{subject.cie}<span>/50</span></div>
                                                <div className="mini-progress">
                                                    <div 
                                                        className="mini-progress-fill cie-fill"
                                                        style={{width: `${(subject.cie/50)*100}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="subject-footer">
                                            <div className="performance-indicator">
                                                <div className="indicator-label">Overall Performance</div>
                                                <div className="indicator-dots">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div 
                                                            key={i} 
                                                            className={`indicator-dot ${
                                                                i < Math.ceil(((subject.attendance + (subject.cie * 2)) / 150) * 5) ? 'active' : ''
                                                            }`}
                                                        ></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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

                            {/* Attendance vs CIE Comparison */}
                            {currentSem.length > 0 && (
                                <div className="chart-card full-width-chart">
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
                                                    ciePercentage: ((subject.cie || 0) / 50) * 100 // Normalized for visual comparison
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

                            <div className="analytics-grid">
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
                                <div className="insights-card wide-insights">
                                    <div className="chart-header">
                                        <div>
                                            <h3 className="chart-title">Performance Insights</h3>
                                            <p className="chart-subtitle">Key observations from your data</p>
                                        </div>
                                    </div>
                                    <div className="insights-list">
                                        <div className="insight-item">
                                            <div className="insight-icon success">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div className="insight-content">
                                                <div className="insight-title">Academic Standing</div>
                                                <div className="insight-text">
                                                    Your CGPA of {detailedData?.cgpa || latestSGPA} is {detailedData?.cgpa >= 9 ? 'outstanding' : detailedData?.cgpa >= 8 ? 'excellent' : detailedData?.cgpa >= 7 ? 'very good' : 'good'}. {isImproved && sgpaDiff > 0 ? `You've improved by ${sgpaDiff} from last semester!` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="insight-item">
                                            <div className={`insight-icon ${overallAttendance >= 85 ? 'success' : overallAttendance >= 75 ? 'warning' : 'danger'}`}>
                                                <Calendar size={20} />
                                            </div>
                                            <div className="insight-content">
                                                <div className="insight-title">Attendance Analysis</div>
                                                <div className="insight-text">
                                                    {overallAttendance >= 85 
                                                        ? 'Excellent attendance! You\'re well above the 75% requirement.' 
                                                        : overallAttendance >= 75
                                                        ? 'Your attendance is adequate but try to aim for 85% for better academic standing.'
                                                        : 'Warning: Your attendance is below 75%. This may affect your eligibility for exams.'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="insight-item">
                                            <div className="insight-icon info">
                                                <BookOpen size={20} />
                                            </div>
                                            <div className="insight-content">
                                                <div className="insight-title">CIE Performance</div>
                                                <div className="insight-text">
                                                    Average CIE score of {overallCIE}/50 ({Math.round((overallCIE/50)*100)}%). {overallCIE >= 40 ? 'Strong performance in internals!' : overallCIE >= 30 ? 'Good progress, aim for higher scores.' : 'Focus on improving internal assessments.'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="insight-item">
                                            <div className="insight-icon info">
                                                <Award size={20} />
                                            </div>
                                            <div className="insight-content">
                                                <div className="insight-title">Credits Progress</div>
                                                <div className="insight-text">
                                                    {totalCredits} out of 160 credits earned ({Math.round((totalCredits/160)*100)}%). {totalCredits >= 120 ? 'You\'re in the final stretch!' : totalCredits >= 80 ? 'Halfway through your degree!' : 'Keep up the good work!'}
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
                                <div className="empty-state">
                                    <History size={64} />
                                    <h3>No exam history available</h3>
                                    <p>Your previous semester records will appear here</p>
                                </div>
                            ) : (
                                <div className="history-grid">
                                    {examHistory.map((sem, idx) => (
                                        <div key={idx} className="semester-card">
                                            <div className="semester-header">
                                                <div className="semester-info">
                                                    <div className="semester-badge">Semester {idx + 1}</div>
                                                    <h3 className="semester-title">{sem.semester}</h3>
                                                </div>
                                                <div className="semester-sgpa">
                                                    <div className="sgpa-label">SGPA</div>
                                                    <div className="sgpa-value">{sem.sgpa}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="courses-table">
                                                <div className="table-header">
                                                    <div className="col-code">Code</div>
                                                    <div className="col-name">Course Name</div>
                                                    <div className="col-credits">Credits</div>
                                                    <div className="col-grade">Grade</div>
                                                </div>
                                                <div className="table-body">
                                                    {sem.courses?.map((course, cIdx) => (
                                                        <div key={cIdx} className="table-row">
                                                            <div className="col-code">
                                                                <span className="code-badge">{course.code}</span>
                                                            </div>
                                                            <div className="col-name">{course.name}</div>
                                                            <div className="col-credits">{course.credits || '-'}</div>
                                                            <div className="col-grade">
                                                                <span 
                                                                    className="grade-badge"
                                                                    style={{ 
                                                                        backgroundColor: `${GRADE_COLORS[course.grade] || '#64748b'}20`,
                                                                        color: GRADE_COLORS[course.grade] || '#64748b',
                                                                        borderColor: GRADE_COLORS[course.grade] || '#64748b'
                                                                    }}
                                                                >
                                                                    {course.grade}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="semester-footer">
                                                <div className="footer-stat">
                                                    <Award size={16} />
                                                    <span>{sem.credits_earned} Credits</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'reports' && (
                        <div className="tab-content">
                            <div className="reports-container">
                                <div className="reports-card">
                                    <div className="reports-icon">
                                        <FileText size={64} />
                                    </div>
                                    <h2 className="reports-title">Generate Official Report</h2>
                                    <p className="reports-description">
                                        Create a comprehensive PDF report containing your complete academic history, 
                                        including all semesters, grades, and performance metrics. Perfect for job 
                                        applications and official documentation.
                                    </p>
                                    <button 
                                        onClick={() => window.open(`/report/${student.usn}`, '_self')}
                                        className="generate-report-button"
                                    >
                                        <Download size={20} />
                                        <span>Generate PDF Report</span>
                                        <ExternalLink size={18} />
                                    </button>
                                    <div className="reports-features">
                                        <div className="feature-item">
                                            <CheckCircle2 size={16} />
                                            <span>Complete academic history</span>
                                        </div>
                                        <div className="feature-item">
                                            <CheckCircle2 size={16} />
                                            <span>Professional formatting</span>
                                        </div>
                                        <div className="feature-item">
                                            <CheckCircle2 size={16} />
                                            <span>Download instantly</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;