"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import TiptapEditor from '@/components/dashboard/Editor';
import { API_BASE_URL } from '@/config/api.config';
import "@/styles/Report.css";

// Dynamic import for html2pdf
let html2pdf: any;
if (typeof window !== 'undefined') {
    html2pdf = require('html2pdf.js');
}

const getGrade = (score: number) => {
    if (score >= 90) return 'O';
    if (score >= 80) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B+';
    if (score >= 50) return 'B';
    return 'F';
};

/**
 * ReportComponent: Generates a printable A4 academic report.
 * Migrated to Next.js App Router with full feature parity and improved UI.
 */
export default function ReportComponent() {
    const router = useRouter();
    const params = useParams();
    const [zoom, setZoom] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    const [studentDetail, setStudentDetail] = useState<any>(null);
    const [marksData, setMarksData] = useState<any[]>([]);
    const [systemRemarks, setSystemRemarks] = useState('');
    const [proctorRemarks, setProctorRemarks] = useState('<p>Enter proctor observations here...</p>');

    const proctorId = params.proctorId as string;
    const usn = params.usn as string;
    const USN = usn?.toUpperCase();

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                setError(null);
                const sessionId = proctorId ? localStorage.getItem("proctorSessionId") : localStorage.getItem("studentSessionId");

                if (!sessionId) {
                    router.push(proctorId ? "/proctor-login" : "/student-login");
                    return;
                }

                // 1. Fetch AI Remarks
                const remarkRes = await axios.get(`${API_BASE_URL}/api/report/${USN}`, {
                    headers: { "x-session-id": sessionId }
                });

                if (!remarkRes.data.success) {
                    throw new Error(remarkRes.data.message || 'Failed to fetch remarks');
                }

                const data = remarkRes.data.data;
                setStudentDetail(data.student_detail);

                const remarkHtml = data.ai_remark
                    ? data.ai_remark
                        .split('\n')
                        .filter((line: string) => line.trim() !== '')
                        .map((line: string) => `<p>${line}</p>`)
                        .join('')
                    : '<p>No AI remarks generated.</p>';
                setSystemRemarks(remarkHtml);

                // 2. Fetch Detailed Student Data
                const detailedResp = await axios.get(`${API_BASE_URL}/api/report/student/${USN}`, {
                    headers: { "x-session-id": sessionId },
                });

                if (detailedResp.data.success && detailedResp.data.data) {
                    const studentData = detailedResp.data.data;
                    const detailsBlob = studentData.details || studentData || {};
                    const subjects = detailsBlob.subjects || detailsBlob.current_semester || [];

                    setMarksData(subjects.map((s: any) => ({
                        subject: s.name || 'Unknown',
                        attendance: Math.round(s.attendance || 0),
                        score: s.marks || 0,
                        grade: getGrade(s.marks || 0),
                    })));
                }

            } catch (err: any) {
                console.error("Report Generation Error:", err);
                setError(err.response?.data?.message || err.message || "An unexpected error occurred while generating the report.");
            } finally {
                setLoading(false);
            }
        };

        if (USN) {
            fetchReportData();
        }
    }, [USN, proctorId, router]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => setZoom(1);

    const handleDownload = () => {
        if (!html2pdf) {
            alert("PDF generation library is not loaded. Please try again or refresh the page.");
            return;
        }
        const element = document.getElementById('report-sheet');
        if (!element) return;

        const opt = {
            margin: 0,
            filename: `Report_${USN}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const currentZoom = zoom;
        setZoom(1);

        setTimeout(() => {
            html2pdf().set(opt).from(element).save().then(() => {
                setZoom(currentZoom);
            }).catch((e: any) => {
                console.error("PDF generation error:", e);
                setZoom(currentZoom);
                alert("Failed to generate PDF. Please try again.");
            });
        }, 300);
    };

    const handleSendEmail = async () => {
        try {
            setSendingEmail(true);
            setEmailError(null);

            const element = document.getElementById('report-sheet');
            if (!element) return;
            const htmlContent = element.innerHTML;

            const sessionId = proctorId ? localStorage.getItem("proctorSessionId") : localStorage.getItem("studentSessionId");

            if (!sessionId) {
                router.push(proctorId ? "/proctor-login" : "/student-login");
                return;
            }

            const response = await axios.post(
                `${API_BASE_URL}/api/report/send-email`,
                { usn: USN, htmlContent },
                { headers: { "x-session-id": sessionId } }
            );

            if (response.data.success) {
                setEmailSent(true);
                setTimeout(() => setEmailSent(false), 5000);
            } else {
                setEmailError(response.data.message || "Failed to send email");
                setTimeout(() => setEmailError(null), 5000);
            }
        } catch (err: any) {
            console.error("Email sending error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to send email to parents";
            setEmailError(errorMsg);
            setTimeout(() => setEmailError(null), 5000);
        } finally {
            setSendingEmail(false);
        }
    };

    const parseSemester = (classDetails: string) => {
        if (!classDetails) return '';
        const match = classDetails.match(/SEM\s*(\d+)/i);
        return match ? `Semester ${match[1]}` : classDetails;
    };

    const parseDept = (classDetails: string) => {
        if (!classDetails) return '';
        const match = classDetails.match(/B\.E-(\w+)/i);
        return match ? match[1] : '';
    };

    const formatTimestamp = (raw: string) => {
        if (!raw) return '—';
        try {
            const date = new Date(raw);
            return isNaN(date.getTime()) ? raw : date.toLocaleString();
        } catch {
            return raw;
        }
    };

    if (loading) {
        return (
            <div className="report-viewer-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--accent-primary)' }}>
                    <div className="spinner" />
                    <p style={{ marginTop: '1rem', fontSize: '1rem' }}>Generating report for <strong>{USN}</strong>...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="report-viewer-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Report Generation Failed</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>{error}</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push(proctorId ? `/proctor/${proctorId}/dashboard` : '/student/dashboard')}
                        >
                            Back to Dashboard
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="report-viewer-page">
            <header className="report-toolbar">
                <div className="toolbar-left">
                    <button
                        className="toolbar-btn back-btn"
                        onClick={() => router.push(proctorId ? `/proctor/${proctorId}/student/${USN}` : '/student/dashboard')}
                        title="Back"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>Back</span>
                    </button>
                    <div className="toolbar-divider"></div>
                    <div className="report-title">
                        <span className="title-text">Report_{USN}</span>
                        <span className="file-ext">.pdf</span>
                    </div>
                </div>

                <div className="toolbar-center">
                    <div className="zoom-widget">
                        <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
                        <span className="zoom-percent">{Math.round(zoom * 100)}%</span>
                        <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
                        <div className="toolbar-divider"></div>
                        <button className="text-btn reset-btn" onClick={handleResetZoom}>Reset</button>
                    </div>
                </div>

                <div className="toolbar-right">
                    {emailError && (
                        <div style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            marginRight: '1rem',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span>⚠️ {emailError}</span>
                        </div>
                    )}
                    {emailSent && (
                        <div style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            marginRight: '1rem',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span>✓ Email sent successfully to all parents!</span>
                        </div>
                    )}
                    <button
                        className="btn btn-secondary email-btn"
                        onClick={handleSendEmail}
                        disabled={sendingEmail || loading}
                        title="Send report to parents via email"
                    >
                        <span style={{ marginRight: '8px' }}>📧</span>
                        {sendingEmail ? "Sending..." : "Send Email"}
                    </button>
                    <button
                        className="btn btn-primary download-btn"
                        onClick={handleDownload}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', marginRight: '8px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download PDF
                    </button>
                </div>
            </header>

            <div className="document-canvas">
                <div className="sheet-scroll-frame">
                    <div
                        className="a4-sheet-wrapper"
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center',
                            marginBottom: `${(zoom - 1) * 1123}px`
                        }}
                    >
                        <div id="report-sheet" className="a4-sheet">
                            <header className="sheet-header">
                                <div className="college-logo">
                                    <img src="/logo.png" alt="MSRIT Logo" className="college-logo-img" />
                                </div>
                                <div className="college-info">
                                    <h1>M S RAMAIAH INSTITUTE OF TECHNOLOGY</h1>
                                    <h2>Academic Performance Report</h2>
                                    <p className="student-meta">
                                        USN: {studentDetail?.usn || USN}
                                        {' \u00a0|\u00a0 '}
                                        {parseSemester(studentDetail?.class_details || studentDetail?.details?.class_details)}
                                        {' \u00a0|\u00a0 '}
                                        Dept: {parseDept(studentDetail?.class_details || studentDetail?.details?.class_details) || 'IS'}
                                        {' \u00a0|\u00a0 '}
                                        CGPA: {studentDetail?.cgpa || studentDetail?.details?.cgpa || '—'}
                                    </p>
                                    <p className="student-meta" style={{ fontWeight: 600 }}>
                                        {studentDetail?.name || studentDetail?.details?.name || ''}
                                    </p>
                                </div>
                            </header>

                            <hr className="divider" />

                            <section className="table-section">
                                <h3>Current Semester Performance</h3>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Subject Name</th>
                                            <th>Attendance (%)</th>
                                            <th>Score (CIE)</th>
                                            <th>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {marksData.length > 0 ? marksData.map((item, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{item.subject}</td>
                                                <td>{item.attendance}%</td>
                                                <td>{item.score} / 50</td>
                                                <td>
                                                    <span className={`grade-badge ${item.grade.toLowerCase().replace('+', 'plus')}`}>
                                                        {item.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                    No academic data available for the current semester.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </section>

                            <section className="remarks-section">
                                <div className="editable-remarks-container">
                                    <h4>System Generated Remarks</h4>
                                    <TiptapEditor
                                        content={systemRemarks}
                                        onChange={(html: string) => setSystemRemarks(html)}
                                    />
                                </div>

                                <div className="editable-remarks-container">
                                    <h4>Proctor Remarks</h4>
                                    <TiptapEditor
                                        content={proctorRemarks}
                                        onChange={(html: string) => setProctorRemarks(html)}
                                    />
                                </div>
                            </section>

                            <div style={{ flexGrow: 1 }}></div>

                            <footer className="sheet-footer">
                                <div className="signature-area">
                                    <div className="signature-line"></div>
                                    <p>Principal Signature</p>
                                </div>
                                <div className="footer-meta">
                                    <small>Last Updated: {formatTimestamp(studentDetail?.last_updated)}</small>
                                </div>
                                <div className="signature-area">
                                    <div className="signature-line"></div>
                                    <p>Proctor Signature</p>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
