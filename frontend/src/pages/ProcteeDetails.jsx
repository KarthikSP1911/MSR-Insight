import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css"; // Reuse existing styles
import "./ProctorDashboard.css";

const ProcteeDetails = () => {
    const { proctorId, studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:5000/api/proctor/${proctorId}/proctee/${studentId}`);
                if (response.data.success) {
                    setStudent(response.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch student details");
            } finally {
                setLoading(false);
            }
        };

        if (proctorId && studentId) {
            fetchStudentDetails();
        }
    }, [proctorId, studentId]);

    const handleGenerateReport = () => {
        if (student?.usn) {
            navigate(`/report/${student.usn}`);
        }
    };

    if (loading) {
        return (
            <div className="proctor-dashboard">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Fetching student profile...</p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="proctor-dashboard">
                <div className="error-container">
                    <p>⚠️ {error || "Student not found"}</p>
                    <button className="btn-primary" onClick={() => navigate(`/proctor/${proctorId}/dashboard`)}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    const details = student.details || {};

    return (
        <div className="proctor-dashboard">
            <header className="dashboard-header">
                <div>
                    <button
                        className="btn-secondary"
                        style={{ marginBottom: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/proctor/${proctorId}/dashboard`)}
                    >
                        ← Back to Dashboard
                    </button>
                    <h1>{details.name || student.usn}</h1>
                    <p className="auth-subtitle" style={{ margin: 0 }}>
                        Student Profile & Academic Overview
                    </p>
                </div>
                <button className="btn-primary" onClick={handleGenerateReport}>
                    Generate Report
                </button>
            </header>

            <div className="dashboard-grid">
                <div className="profile-card">
                    <h2>Personal Information</h2>
                    <div className="profile-item">
                        <span className="label">Full Name</span>
                        <span className="value">{details.name || "N/A"}</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">USN</span>
                        <span className="value">{student.usn}</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">Date of Birth</span>
                        <span className="value">{student.dob}</span>
                    </div>
                    <div className="profile-item">
                        <span className="label">Class Details</span>
                        <span className="value">{details.class_details || "N/A"}</span>
                    </div>
                </div>

                <div className="status-card">
                    <h2>Academic Status</h2>
                    <div className="profile-item">
                        <span className="label">Current CGPA</span>
                        <span className="value" style={{ color: '#10b981', fontSize: '2rem', fontWeight: '800' }}>
                            {details.cgpa || "N/A"}
                        </span>
                    </div>
                    <div className="profile-item">
                        <span className="label">Last Scraped</span>
                        <span className="value">{details.last_updated || "Never"}</span>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1rem' }}>
                            Course Summary
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                    {(details.current_semester || []).length}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>ACTIVE COURSES</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                    {(details.exam_history || []).length}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>SEMESTERS COMPLETED</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcteeDetails;
