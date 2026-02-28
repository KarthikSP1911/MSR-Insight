import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ProcteeDetails = () => {
    const { proctorId, usn } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                setLoading(true);
                const sessionId = localStorage.getItem("proctorSessionId");

                if (!sessionId) {
                    navigate("/proctor-login");
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/proctor/${proctorId}/student/${usn}`, {
                    headers: { "x-session-id": sessionId }
                });

                if (response.data.success) {
                    setStudent(response.data.data);
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.clear();
                    navigate("/proctor-login");
                    return;
                }
                setError(err.response?.data?.message || "Failed to fetch student details");
            } finally {
                setLoading(false);
            }
        };

        if (proctorId && usn) {
            fetchStudentDetails();
        }
    }, [proctorId, usn]);

    const handleGenerateReport = () => {
        if (student?.usn) {
            navigate(`/proctor/${proctorId}/report/${student.usn}`);
        }
    };

    if (loading) {
        return (
            <div className="container fade-in" style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
                <p>Fetching student profile...</p>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="container fade-in" style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--error)', marginBottom: 'var(--space-md)' }}>⚠️ {error || "Student not found"}</p>
                <button className="btn btn-primary" onClick={() => navigate(`/proctor/${proctorId}/dashboard`)}>Back to Dashboard</button>
            </div>
        );
    }

    const details = student.details || {};

    return (
        <div className="container fade-in" style={{ padding: 'var(--space-lg) 0' }}>
            {/* Back Button Placement: Aligned with container, above student name */}
            <button
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    background: 'transparent',
                    border: '1px solid var(--border-bright)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}
                onClick={() => navigate(`/proctor/${proctorId}/dashboard`)}
            >
                ← Back to Dashboard
            </button>

            {/* Header: Student Name (Left) | Generate Report (Right) */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--space-xl)',
                background: 'var(--bg-secondary)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
            }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '4px', fontWeight: '800' }}>
                        {details.name || student.usn}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        USN: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{student.usn}</span>
                        {' • '}
                        {details.class_details || "Student Profile Active"}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={handleGenerateReport} style={{ padding: '12px 24px', fontWeight: '600' }}>
                    Generate Report
                </button>
            </header>

            {/* Two-Column Grid Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px'
            }}>
                {/* Personal Information Card */}
                <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        marginBottom: 'var(--space-lg)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ color: 'var(--accent-primary)' }}>■</span> Personal Information
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</span>
                            <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>{details.name || "Not Available"}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>USN</span>
                                <span style={{ fontWeight: '500' }}>{student.usn}</span>
                            </div>
                            <div>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date of Birth</span>
                                <span style={{ fontWeight: '500' }}>{student.dob}</span>
                            </div>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class Details</span>
                            <span style={{ fontWeight: '500' }}>{details.class_details || "Not Available"}</span>
                        </div>
                    </div>
                </div>

                {/* Academic Status Card */}
                <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        marginBottom: 'var(--space-lg)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ color: 'var(--accent-primary)' }}>■</span> Academic Status
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 'var(--space-md)',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current CGPA</span>
                                <span style={{ color: details.cgpa ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '2.5rem', fontWeight: '700' }}>
                                    {details.cgpa || "—"}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</span>
                                <span style={{
                                    color: details.cgpa >= 5 ? 'var(--success)' : 'var(--warning)',
                                    fontWeight: '600'
                                }}>
                                    {details.cgpa ? (details.cgpa >= 5 ? 'Good Standing' : 'Needs Regularity') : '—'}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: '700' }}>{(details.current_semester || []).length}</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered Courses</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: '700' }}>{(details.exam_history || []).length}</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Terms</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Information Currency</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Updated: {details.last_updated || "—"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcteeDetails;
