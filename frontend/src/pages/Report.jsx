import React, { useState } from 'react';
import TiptapEditor from '../components/Editor';
import './Report.css';

const Report = () => {
    const [zoom, setZoom] = useState(1);
    const [proctorRemarks, setProctorRemarks] = useState('<p>Enter proctor observations here...</p>');
    const [systemRemarks, setSystemRemarks] = useState('<p>The student has shown exemplary performance in Data Ethics and Cloud Computing. Attendance record is consistent at 94%. No disciplinary actions pending.</p>');

    const marksData = [
        { subject: 'Advanced Algorithms', attendance: 92, score: 85, grade: 'A' },
        { subject: 'Cloud Computing', attendance: 96, score: 92, grade: 'A+' },
        { subject: 'Machine Learning', attendance: 89, score: 78, grade: 'B+' },
        { subject: 'Cyber Security', attendance: 94, score: 88, grade: 'A' },
        { subject: 'Data Ethics', attendance: 98, score: 95, grade: 'O' },
    ];

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => setZoom(1);

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
                        <div className="a4-sheet">
                            {/* Header Section */}
                            <header className="sheet-header">
                                <div className="college-logo">
                                    <img src="/logo.png" alt="MSRIT Logo" className="college-logo-img" />
                                </div>
                                <div className="college-info">
                                    <h1>M S RAMAIAH INSTITUTE OF TECHNOLOGY</h1>
                                    <h2>Academic Performance Report - 2025</h2>
                                    <p className="student-meta">Student ID: 1MS23IS000 | Semester: VII | Department: CSE</p>
                                </div>
                            </header>

                            <hr className="divider" />

                            {/* Marks Table Section */}
                            <section className="table-section">
                                <h3>Examination Performance</h3>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Subject Name</th>
                                            <th>Attendance (%)</th>
                                            <th>Score</th>
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
                                                <td><span className={`grade-badge ${item.grade.toLowerCase()}`}>{item.grade}</span></td>
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

                            {/* Footer of the sheet */}
                            <footer className="sheet-footer">
                                <div className="signature-area">
                                    <div className="signature-line"></div>
                                    <p>Principal Signature</p>
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

