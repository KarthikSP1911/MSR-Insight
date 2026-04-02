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
            <div style={{
                position: 'fixed',
                top: 'calc(var(--nav-height) + 20px)',
                left: '20px',
                zIndex: 100
            }}>
                <button
                    className="back-nav-btn"
                    onClick={() => navigate(proctorId ? `/proctor/${proctorId}/student/${USN}` : '/student/dashboard')}
                >
                    ← Back to {proctorId ? 'Student' : 'Dashboard'}
                </button>
            </div>

            <div className="report-action-bottom" style={{
                position: 'fixed',
                bottom: '40px',
                right: '40px',
                zIndex: 1000
            }}>
                <button
                    className="generate-report-btn generate-btn"
                    onClick={handleDownload}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Generate Report
                </button>
            </div>

            <div className="zoom-controls">
                <button onClick={handleZoomOut} title="Zoom Out">−</button>
                <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} title="Zoom In">+</button>
                <button onClick={handleResetZoom} className="reset-btn">Reset</button>
            </div>

            <div className="scroll-container">
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
