"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    Target, History as HistoryIcon, Award, Menu, X, Gamepad2
} from "lucide-react";
import "@/styles/StudentDashboard.css";
import { API_BASE_URL } from "@/config/api.config";
import SubjectDetail from "@/app/(dashboard)/student/dashboard/components/SubjectDetail";
import SidebarProfile from "@/components/dashboard/SidebarProfile";
import Image from "next/image";
import Link from "next/link";

// Update Components
import { useCooldown } from "@/hooks/useCooldown";

// Section Components
import PerformanceSection from "@/components/dashboard/sections/PerformanceSection";
import AnalyticsSection from "@/components/dashboard/sections/AnalyticsSection";
import HistorySection from "@/components/dashboard/sections/HistorySection";
import SimulatorSection from "@/components/dashboard/sections/SimulatorSection";
import LoadingScreen from "@/components/dashboard/LoadingScreen";


const GRADE_COLORS: Record<string, string> = {
    'O': '#8b5cf6',
    'A+': '#3b82f6',
    'A': '#10b981',
    'B+': '#f59e0b',
    'B': 'var(--accent-primary)',
    'C': '#ef4444',
    'P': '#64748b',
    'F': '#1e293b',
};

const GRADE_POINTS: Record<string, number> = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0
};

export default function StudentDashboard() {
    // 1. Core Hooks & State
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('performance');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [nextAllowedAt, setNextAllowedAt] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [predictedGrades, setPredictedGrades] = useState<Record<string, string>>({});
    const [simulatedCredits, setSimulatedCredits] = useState<Record<string, number>>({});
    const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number>(0);
    const [updateStatus, setUpdateStatus] = useState<'loading' | 'success' | 'error' | null>(null);

    const { formatTime, isCooldownActive } = useCooldown(nextAllowedAt);

    // 2. Lifecycle
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. Derived Data (useMemo)
    const detailsBlob = useMemo(() => student?.details || {}, [student]);
    const currentSem = useMemo(() => detailsBlob.subjects || detailsBlob.current_semester || [], [detailsBlob]);
    const examHistory = useMemo(() => detailsBlob.exam_history || [], [detailsBlob]);

    const currentCgpa = useMemo(() => {
        const val = (detailsBlob.cgpa ?? student?.cgpa ?? "").toString().trim();
        return val || null;
    }, [detailsBlob, student]);

    const totalCredits = useMemo(() =>
        examHistory.reduce((acc: number, sem: any) => acc + (parseInt(sem.credits_earned) || 0), 0)
        , [examHistory]);

    const latestSGPA = useMemo(() =>
        examHistory.length > 0 ? (parseFloat(examHistory[examHistory.length - 1].sgpa) || 0) : 0
        , [examHistory]);

    const prevSGPA = useMemo(() =>
        examHistory.length > 1 ? (parseFloat(examHistory[examHistory.length - 2].sgpa) || 0) : 0
        , [examHistory]);

    const sgpaDiffValue = useMemo(() => latestSGPA - prevSGPA, [latestSGPA, prevSGPA]);

    const stdUsn = useMemo(() => student?.usn || detailsBlob.usn || "", [student, detailsBlob]);

    const isLateralEntry = useMemo(() => /4\d{2}$/.test(stdUsn), [stdUsn]);
    const maxCredits = isLateralEntry ? 120 : 160;

    const overallAttendance = useMemo(() =>
        currentSem.length ? Math.round(currentSem.reduce((acc: number, curr: any) => acc + (curr.attendance || 0), 0) / currentSem.length) : 0
        , [currentSem]);

    const sgpaTrendData = useMemo(() => examHistory.map((sem: any) => ({
        name: sem.semester.split(' ')[0] + ' ' + (sem.semester.split(' ')[2]?.substring(2) || ''),
        sgpa: parseFloat(sem.sgpa),
        credits: parseInt(sem.credits_earned || 0)
    })), [examHistory]);

    const gradeChartData = useMemo(() => {

        const allGrades = examHistory.flatMap((sem: any) => sem.courses?.map((c: any) => c.grade) || []);
        const distribution = allGrades.reduce((acc: any, grade: string) => {
            acc[grade] = (acc[grade] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(distribution)
            .map(([grade, count]) => ({ grade, count, color: (GRADE_COLORS[grade] || '#64748b') as string }))
            .sort((a, b) => (b.count as number) - (a.count as number));
    }, [examHistory]);

    const internalComparisonData = useMemo(() => {
        return currentSem.map((subj: any) => {
            const getScores = (type: string) => {
                const a = subj.assessments?.find((x: any) => x.type === type);
                return { me: a?.obtained_marks || 0, avg: a?.class_average || 0 };
            };
            const t1 = getScores('T1');
            const t2 = getScores('T2');
            const aq1 = getScores('AQ1');
            const aq2 = getScores('AQ2');
            const testAvg = (t1.me > 0 && t2.me > 0) ? Math.round((t1.me + t2.me) / 2) : Math.max(t1.me, t2.me);
            const avgTotal = (t1.avg > 0 && t2.avg > 0) ? Math.round((t1.avg + t2.avg) / 2) : Math.max(t1.avg, t2.avg);
            return {
                code: subj.code,
                name: subj.name,
                studentScore: testAvg + aq1.me + aq2.me,
                classAverage: avgTotal + aq1.avg + aq2.avg,
            };
        }).filter((d: any) => d.studentScore > 0 || d.classAverage > 0);
    }, [currentSem]);

    const bestSubject = useMemo(() => {
        return [...currentSem].filter(s => s.marks > 0 || (s.attendance && s.attendance > 0)).sort((a: any, b: any) => {
            const scoreA = ((a.marks || 0) * 2) + (a.attendance || 0);
            const scoreB = ((b.marks || 0) * 2) + (b.attendance || 0);
            return scoreB - scoreA;
        })[0];
    }, [currentSem]);

    const weakestSubject = useMemo(() => {
        return [...currentSem].filter(s => s.marks > 0 || (s.attendance && s.attendance > 0)).sort((a: any, b: any) => {
            const scoreA = ((a.marks || 0) * 2) + (a.attendance || 0);
            const scoreB = ((b.marks || 0) * 2) + (b.attendance || 0);
            return scoreA - scoreB;
        })[0];
    }, [currentSem]);

    // 3. Effects
    useEffect(() => {
        const fetchProfile = async () => {
            const sessionId = localStorage.getItem("studentSessionId");
            const usn = localStorage.getItem("studentUsn");
            if (!sessionId || !usn) { router.push("/student-login"); return; }

            try {
                const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
                    headers: { "x-session-id": sessionId },
                });
                if (response.data.success && response.data.data) {
                    const data = response.data.data;
                    setStudent(data);

                    const lastSync = data.details?.last_updated || data.last_updated;
                    if (lastSync) {
                        const next = new Date(new Date(lastSync).getTime() + 5 * 60 * 1000).toISOString();
                        setNextAllowedAt(next);
                    }

                } else {
                    // If success is false or no data, redirect to login
                    localStorage.clear();
                    router.push("/student-login");
                }
            } catch (err: any) {
                console.error("Dashboard mount error:", err);
                if (err.response?.status === 401) {
                    localStorage.clear();
                    router.push("/student-login");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    useEffect(() => {
        if (currentSem.length > 0 && Object.keys(predictedGrades).length === 0) {
            const initialGrades: Record<string, string> = {};
            const initialCredits: Record<string, number> = {};
            currentSem.forEach((s: any) => {
                initialGrades[s.code] = 'O';
                initialCredits[s.code] = 4;
            });
            setPredictedGrades(initialGrades);
            setSimulatedCredits(initialCredits);
        }
    }, [currentSem, predictedGrades]);

    // 4. Handlers
    const handleTabChange = (tab: string) => { setActiveTab(tab); setIsMobileMenuOpen(false); };
    const handleLogout = () => { localStorage.clear(); router.push("/"); };

    const handleUpdate = async () => {
        if (isCooldownActive) return;
        const sessionId = localStorage.getItem("studentSessionId");
        if (!sessionId || !stdUsn) return;

        setUpdateStatus('loading');
        try {
            const response = await axios.post(`${API_BASE_URL}/api/report/update`, 
                { usn: stdUsn },
                { headers: { "x-session-id": sessionId } }
            );

            if (response.data.success && response.data.data) {
                setStudent(response.data.data);
                setUpdateStatus('success');
                
                const lastSync = response.data.data.details?.last_updated || response.data.data.last_updated;
                if (lastSync) {
                    const next = new Date(new Date(lastSync).getTime() + 5 * 60 * 1000).toISOString();
                    setNextAllowedAt(next);
                }

            } else {
                setUpdateStatus('error');
            }
        } catch (err: any) {
            console.error("Manual update failed:", err);
            setUpdateStatus('error');
            if (err.response?.status === 429 && err.response?.data?.nextAllowedAt) {
                setNextAllowedAt(err.response.data.nextAllowedAt);
            }
        } finally {
            setTimeout(() => setUpdateStatus(null), 3000);
        }
    };

    if (!mounted || loading || !student) return <LoadingScreen />;


    return (
        <div className="student-dashboard-container">
            <aside className="dashboard-sidebar">
                <div className="sidebar-branding">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo-icon.svg" alt="logo" width={32} height={32} priority />
                        <span className="sidebar-app-name">MSR Insight</span>
                    </Link>
                </div>

                <nav className="sidebar-navigation">
                    {[
                        { id: 'performance', icon: <Target size={20} />, label: 'Current Semester' },
                        { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
                        { id: 'history', icon: <HistoryIcon size={20} />, label: 'Exam History' },
                        { id: 'simulator', icon: <Gamepad2 size={20} />, label: 'Simulator' },
                    ].map(tab => (
                        <button key={tab.id} className={`nav-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => handleTabChange(tab.id)}>
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <SidebarProfile user={student} onLogout={handleLogout} />
            </aside>

            <main className="dashboard-main-content">
                <div className="content-wrapper">
                    {selectedSubject ? (
                        <SubjectDetail
                            subject={selectedSubject}
                            allSubjects={currentSem}
                            onSubjectChange={setSelectedSubject}
                            onBack={() => setSelectedSubject(null)}
                        />
                    ) : (
                        <>
                            {activeTab === 'performance' && (
                                <PerformanceSection
                                    student={student} currentSem={currentSem} overallAttendance={overallAttendance} totalCredits={totalCredits}
                                    maxCredits={maxCredits} currentCgpa={currentCgpa} onSelectSubject={setSelectedSubject} handleUpdate={handleUpdate}
                                    updateStatus={updateStatus} isCooldownActive={isCooldownActive} formatTime={formatTime}
                                    examHistory={examHistory} latestSGPA={latestSGPA}
                                    isImproved={latestSGPA >= prevSGPA}
                                    sgpaDiff={(latestSGPA - prevSGPA >= 0 ? "+" : "") + (latestSGPA - prevSGPA).toFixed(2)}
                                />
                            )}
                            {activeTab === 'analytics' && (
                                <AnalyticsSection
                                    studentName={student?.name}
                                    internalComparisonData={internalComparisonData}
                                    gradeChartData={gradeChartData}
                                    bestSubject={bestSubject}
                                    weakestSubject={weakestSubject}
                                    overallAttendance={overallAttendance}
                                    detailsBlob={detailsBlob}
                                    latestSGPA={latestSGPA}
                                    sgpaDiffValue={sgpaDiffValue}
                                    sgpaTrendData={sgpaTrendData}
                                />
                            )}
                            {activeTab === 'history' && (
                                <HistorySection
                                    studentName={student?.name}
                                    examHistory={examHistory}
                                    selectedHistoryIdx={selectedHistoryIdx}
                                    setSelectedHistoryIdx={setSelectedHistoryIdx}
                                    GRADE_COLORS={GRADE_COLORS}
                                />
                            )}
                            {activeTab === 'simulator' && (
                                <SimulatorSection
                                    studentName={student?.name}
                                    currentSem={currentSem}
                                    predictedGrades={predictedGrades}
                                    simulatedCredits={simulatedCredits}
                                    setPredictedGrades={setPredictedGrades}
                                    setSimulatedCredits={setSimulatedCredits}
                                    currentCgpa={currentCgpa}
                                    totalCredits={totalCredits}
                                    GRADE_COLORS={GRADE_COLORS}
                                    GRADE_POINTS={GRADE_POINTS}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-bottom-nav">
                {[
                    { id: 'performance', icon: <Target size={20} />, label: 'Semester' },
                    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
                    { id: 'history', icon: <HistoryIcon size={20} />, label: 'History' },
                    { id: 'simulator', icon: <Gamepad2 size={20} />, label: 'Sim' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}

const BarChart3 = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>;

