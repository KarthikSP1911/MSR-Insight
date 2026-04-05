import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TiptapEditor from '../components/Editor';
import html2pdf from 'html2pdf.js';
import './Report.css';
import { API_BASE_URL } from '../config/api.config';

/**
 * Report Component: Generates a printable A4 academic report.
 * Consumes JSONB data from the Express backend and AI remarks from FastAPI via Express.
 */

// Derive a grade label from marks score
const getGrade = (score) => {
    if (score >= 90) return 'O';
    if (score >= 80) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B+';
    if (score >= 50) return 'B';
    return 'F';
};

const Report = () => {
    const navigate = useNavigate();
    const [zoom, setZoom] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState(null);

    // Student detail fields
    const [studentDetail, setStudentDetail] = useState(null);

    // Subjects table
    const [marksData, setMarksData] = useState([]);

    // Remarks (editable via TiptapEditor)
    const [systemRemarks, setSystemRemarks] = useState('');
    const [proctorRemarks, setProctorRemarks] = useState('<p>Enter proctor observations here...</p>');

    // Extract proctorId and usn from URL params
    const { proctorId, usn: rawUsn } = useParams();
    const USN = rawUsn?.toUpperCase();

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                const sessionId = proctorId ? localStorage.getItem("proctorSessionId") : localStorage.getItem("studentSessionId");

                if (!sessionId) {
                    navigate(proctorId ? "/proctor-login" : "/student-login");
                    return;
                }

                // 1. Fetch AI Remarks via Express (which proxies to FastAPI)
                // We use Express instead of calling FastAPI directly to maintain session security and data consistency
                const remarkRes = await axios.get(`${API_BASE_URL}/api/report/${USN}`, {
                    headers: { "x-session-id": sessionId }
                });

                if (!remarkRes.data.success) {
                    throw new Error(remarkRes.data.message || 'Failed to fetch remarks');
                }

                const data = remarkRes.data.data;
                setStudentDetail(data.student_detail);

                // Populate AI Remarks
                const remarkHtml = data.ai_remark
                    ? data.ai_remark
                        .split('\n')
                        .filter(line => line.trim() !== '')
                        .map(line => `<p>${line}</p>`)
                        .join('')
                    : '<p>No AI remarks generated.</p>';
                setSystemRemarks(remarkHtml);

                // 2. Fetch Student Data (JSONB) via Express
                const detailedResp = await axios.get(`${API_BASE_URL}/api/report/student/${USN}`, {
                    headers: { "x-session-id": sessionId },
                });

                if (detailedResp.data.success && detailedResp.data.data) {
                    const studentData = detailedResp.data.data;
                    console.log("[Report] Student Data Received:", studentData);

                    // JSONB blob usually contains the full scraped object
                    const detailsBlob = studentData.details || studentData || {};
                    // Use normalized 'subjects' array which has pre-calculated marks/attendance
                    const subjects = detailsBlob.subjects || detailsBlob.current_semester || [];

                    setMarksData(subjects.map(s => ({
                        subject: s.name || 'Unknown',
                        attendance: Math.round(s.attendance || 0),
                        score: s.marks || 0,
                        grade: getGrade(s.marks || 0),
                    })));
                }

            } catch (err) {
                console.error("Report Generation Error:", err);
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };

        if (USN) {
            fetchReportData();
        }
    }, [USN, proctorId, navigate]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => setZoom(1);

    const handleDownload = () => {
        const element = document.getElementById('report-sheet');
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
            });
        }, 300);
    };

    const handleSendEmail = async () => {
        try {
            setSendingEmail(true);
            setEmailError(null);

            // Get the HTML content of the report
            const element = document.getElementById('report-sheet');
            const htmlContent = element.innerHTML;

            const sessionId = proctorId ? localStorage.getItem("proctorSessionId") : localStorage.getItem("studentSessionId");

            if (!sessionId) {
                navigate(proctorId ? "/proctor-login" : "/student-login");
                return;
            }

            // Send email via backend API
            const response = await axios.post(
                `${API_BASE_URL}/api/report/send-email`,
                { usn: USN, htmlContent },
                { headers: { "x-session-id": sessionId } }
            );

            if (response.data.success) {
                setEmailSent(true);
                setTimeout(() => setEmailSent(false), 5000); // Auto-hide success message after 5s
                console.log("Email sent successfully:", response.data.data);
            } else {
                setEmailError(response.data.message || "Failed to send email");
                setTimeout(() => setEmailError(null), 5000);
            }
        } catch (err) {
            console.error("Email sending error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to send email to parents";
            setEmailError(errorMsg);
            setTimeout(() => setEmailError(null), 5000);
        } finally {
            setSendingEmail(false);
        }
    };

    // Helper to format class details for header
    const parseSemester = (classDetails) => {
        if (!classDetails) return '';
        const match = classDetails.match(/SEM\s*(\d+)/i);
        return match ? `Semester ${match[1]}` : classDetails;
    };

    const parseDept = (classDetails) => {
        if (!classDetails) return '';
        const match = classDetails.match(/B\.E-(\w+)/i);
        return match ? match[1] : '';
    };

    // Reformat timestamp
    const formatTimestamp = (raw) => {
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
                <div style={{ textAlign: 'center', color: '#f97316' }}>
                    <div className="spinner" />
                    <p style={{ marginTop: '1rem', fontSize: '1rem' }}>Generating report for <strong>{USN}</strong>...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="report-viewer-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#ef4444' }}>
                    <p>⚠️ Error: {error}</p>
                    <button
                        className="btn btn-secondary"
                        style={{ marginTop: '1rem' }}
                        onClick={() => navigate(proctorId ? `/proctor/${proctorId}/student/${USN}` : '/student/dashboard')}
                    >
                        ← Back to {proctorId ? 'Student Profile' : 'Dashboard'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="report-viewer-page">
            {/* Professional Toolbar */}
            <header className="report-toolbar">
                <div className="toolbar-left">
                    <button
                        className="toolbar-btn back-btn"
                        onClick={() => navigate(proctorId ? `/proctor/${proctorId}/student/${USN}` : '/student/dashboard')}
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
                        className="btn btn-primary generate-btn"
                        onClick={handleSendEmail}
                        disabled={sendingEmail || loading}
                        title="Send report to parents via email"
                        style={{ marginRight: '0.5rem' }}
                    >
                        {sendingEmail ? (
                            <>
                                <span style={{ marginRight: '0.5rem' }}>📧</span>
                                Sending...
                            </>
                        ) : (
                            <>
                                <span style={{ marginRight: '0.5rem' }}>📧</span>
                                Send Email
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-primary generate-btn"
                        onClick={handleDownload}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
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
                                        {marksData.map((item, index) => (
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
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                            <section className="remarks-section">
                                <div className="editable-remarks-container">
                                    <h4>System Generated Remarks</h4>
                                    <TiptapEditor
                                        content={systemRemarks}
                                        onChange={(html) => setSystemRemarks(html)}
                                    />
                                </div>

                                <div className="editable-remarks-container">
                                    <h4>Proctor Remarks</h4>
                                    <TiptapEditor
                                        content={proctorRemarks}
                                        onChange={(html) => setProctorRemarks(html)}
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
};

export default Report;
