import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
            } catch (err) {
                setError("Failed to load profile information.");
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
        <div className="container fade-in" style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
            <p>Loading profile...</p>
        </div>
    );

    return (
        <div className="container fade-in" style={{ padding: 'var(--space-xl) 0' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--space-xs)' }}>Student Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {student?.name || student?.usn}</p>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </header>

            <div className="dashboard-grid">
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-xs)' }}>
                        Profile Details
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Full Name</span>
                            <span style={{ fontWeight: '600' }}>{student?.name || "Not set"}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>USN</span>
                            <span style={{ fontWeight: '600' }}>{student?.usn}</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-xs)' }}>
                        Report Status
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Your academic reports will appear here once they are finalized and published by your assigned proctor.
                    </p>
                    <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reports available yet.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
