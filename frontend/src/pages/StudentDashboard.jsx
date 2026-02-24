import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";

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

    if (loading) return <div className="dashboard-loading">Loading...</div>;

    return (
        <div className="student-dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>Student Dashboard</h1>
                    <p>Welcome back, {student?.name || student?.usn}</p>
                </div>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </header>

            <div className="dashboard-grid">
                <section className="profile-card">
                    <h2>Profile Details</h2>
                    <div className="profile-item">
                        <span className="label">Full Name</span>
                        <span className="value">{student?.name || "Not set"}</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">USN</span>
                        <span className="value">{student?.usn}</span>
                    </div>
                </section>

                <section className="status-card">
                    <h2>Report Status</h2>
                    <p>Reports will appear here once finalized by your proctor.</p>
                </section>
            </div>
        </div>
    );
};

export default StudentDashboard;
