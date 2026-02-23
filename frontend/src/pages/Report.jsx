import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TiptapEditor from '../components/Editor';
import './Report.css';

const FASTAPI_BASE = 'http://localhost:8000';

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

    // USN from URL param — uppercase for API consistency
    const { usn: rawUsn } = useParams();
    const USN = rawUsn?.toUpperCase() || '1MS24IS400';

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${FASTAPI_BASE}/generate-remark/${USN}`);
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || 'Failed to fetch report');
                }
                const data = await res.json();

                // Populate student details
                setStudentDetail(data.student_detail);

                // We need the subjects; call the normalized endpoint separately
                const normRes = await fetch(`${FASTAPI_BASE}/get-normalized-report/${USN}`);
                const normData = await normRes.json();
                const subjects = normData.subjects || [];
                setMarksData(subjects.map(s => ({
                    subject: s.name,
                    attendance: s.attendance,
                    score: s.marks,
                    grade: getGrade(s.marks),
                })));

                // Set system remarks from AI
                const remarkHtml = data.ai_remark
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => `<p>${line}</p>`)
                    .join('');
                setSystemRemarks(remarkHtml);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [USN]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => setZoom(1);

    // Parse class_details: "B.E-IS,  SEM 06,  SEC A"
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

    // Reformat 'YYYY-MM-DD HH:MM:SS' → 'HH:MM:SS, DD-MM-YYYY'
    const formatTimestamp = (raw) => {
        if (!raw) return '—';
        const parts = raw.trim().split(' ');
        if (parts.length !== 2) return raw;
        const [datePart, timePart] = parts;
        const [y, m, d] = datePart.split('-');
        if (!y || !m || !d) return raw;
        return `${timePart}, ${d}-${m}-${y}`;
    };

    if (loading) {
        return (
            <div className="report-viewer-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#8b5cf6' }}>
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
                </div>
            </div>
        );
    }

    return (
        <div className="report-viewer-page">
            {/* Zoom Controls Overlay */}
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
                            {/* Header Section */}
                            <header className="sheet-header">
                                <div className="college-logo">
                                    <img src="/logo.png" alt="MSRIT Logo" className="college-logo-img" />
                                </div>
                                <div className="college-info">
                                    <h1>M S RAMAIAH INSTITUTE OF TECHNOLOGY</h1>
                                    <h2>Academic Performance Report - 2025</h2>
                                    <p className="student-meta">
                                        USN: {studentDetail?.usn || USN}
                                        {' \u00a0|\u00a0 '}
                                        {parseSemester(studentDetail?.class_details)}
                                        {' \u00a0|\u00a0 '}
                                        Dept: {parseDept(studentDetail?.class_details) || 'IS'}
                                        {' \u00a0|\u00a0 '}
                                        CGPA: {studentDetail?.cgpa || '—'}
                                    </p>
                                    <p className="student-meta" style={{ fontWeight: 600 }}>
                                        {studentDetail?.name || ''}
                                    </p>
                                </div>
                            </header>

                            <hr className="divider" />

                            {/* Marks Table Section */}
                            <section className="table-section">
                                <h3>Examination Performance</h3>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th></th>
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
                                                <td>{item.score}</td>
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

                            {/* Remarks Section */}
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

                            {/* Spacer */}
                            <div style={{ flexGrow: 1 }}></div>

                            {/* Footer */}
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
