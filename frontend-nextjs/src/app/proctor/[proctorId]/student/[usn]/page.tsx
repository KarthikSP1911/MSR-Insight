"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import "@/styles/ProcteeDetails.css";

/**
 * ProcteeDetails: Displays detailed student profile information to the proctor.
 * Migrated to Next.js App Router with full feature parity.
 */
export default function ProcteeDetails() {
    const params = useParams();
    const router = useRouter();
    const proctorId = params.proctorId as string;
    const usn = params.usn as string;

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                setLoading(true);
                const sessionId = localStorage.getItem("proctorSessionId");

                if (!sessionId) {
                    router.push("/proctor-login");
                    return;
                }

                const response = await axios.get(`${API_BASE_URL}/api/proctor/${proctorId}/student/${usn}`, {
                    headers: { "x-session-id": sessionId }
                });

                if (response.data.success) {
                    setStudent(response.data.data);
                }
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.clear();
                    router.push("/proctor-login");
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
    }, [proctorId, usn, router]);

    const handleGenerateReport = () => {
        if (student?.usn) {
            router.push(`/proctor/${proctorId}/report/${student.usn}`);
        }
    };

    if (loading) {
        return (
            <div className="proctee-details-page fade-in" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <div className="spinner" style={{ margin: '0 auto 20px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Fetching student profile...</p>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="proctee-details-page fade-in" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <p style={{ color: 'var(--error)', marginBottom: '24px', fontSize: '1.1rem' }}>⚠️ {error || "Student not found"}</p>
                <button className="generate-report-btn" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', margin: '0 auto' }} onClick={() => router.push(`/proctor/${proctorId}/dashboard`)}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const details = student.details || {};
    const hasGoodStanding = (parseFloat(details.cgpa) || 0) >= 5;

    return (
        <div className="container fade-in">
            <div className="proctee-details-page">
                {/* STUDENT HERO CARD */}
                <header className="student-hero-card">
                    <div className="student-info">
                        <h1>{student.name || student.usn}</h1>
                        <div className="student-meta-row">
                            <span className="usn-badge">{student.usn}</span>
                            <div className="meta-divider"></div>
                            <span>{details.class_details || "Student Profile Active"}</span>
                        </div>
                    </div>
                    <button className="generate-report-btn" onClick={handleGenerateReport}>
                        Generate Report
                    </button>
                </header>

                <div className="details-grid">
                    {/* PERSONAL INFORMATION CARD */}
                    <div className="info-card">
                        <div className="card-header">
                            <div className="accent-line"></div>
                            <h2>Personal Information</h2>
                        </div>

                        <div className="personal-info-grid">
                            <div className="info-row">
                                <span className="info-label">Full Name</span>
                                <span className="info-value">{student.name || "Not Available"}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">USN</span>
                                <span className="info-value">{student.usn}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Date of Birth</span>
                                <span className="info-value">{student.dob || '—'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Email</span>
                                <span className="info-value">{student.email || "Not Available"}</span>
                            </div>
                        </div>
                    </div>

                    {/* ACADEMIC STATUS CARD */}
                    <div className="info-card">
                        <div className="card-header">
                            <div className="accent-line"></div>
                            <h2>Academic Status</h2>
                        </div>

                        <div className="academic-metrics">
                            <div className="cgpa-container">
                                <div className="cgpa-display">
                                    <span className="cgpa-label">Current CGPA</span>
                                    <span className="cgpa-value">{details.cgpa || "—"}</span>
                                </div>
                                <div className={`status-badge ${!hasGoodStanding ? 'warning' : ''}`}>
                                    {details.cgpa ? (hasGoodStanding ? 'Good Standing' : 'Needs Regularity') : 'Profile Incomplete'}
                                </div>
                            </div>

                            <div className="mini-stats-grid">
                                <div className="mini-stat-card">
                                    <span className="stat-number">{(details.subjects || details.current_semester || []).length}</span>
                                    <span className="stat-label">Courses</span>
                                </div>
                                <div className="mini-stat-card">
                                    <span className="stat-number">{(details.exam_history || []).length}</span>
                                    <span className="stat-label">Semesters</span>
                                </div>
                            </div>

                            <div className="last-updated">
                                <span>Last Scraped</span>
                                <span>{details.last_updated || "Never"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
