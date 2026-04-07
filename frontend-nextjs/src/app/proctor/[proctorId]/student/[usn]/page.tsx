"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import "@/styles/ProcteeDetails.css";

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

    if (loading) return <div className="proctee-details-page"><div className="spinner" />Fetching profile...</div>;
    if (error || !student) return <div className="proctee-details-page"><p>⚠️ {error || "Student not found"}</p><button onClick={() => router.push(`/proctor/${proctorId}/dashboard`)}>Back</button></div>;

    const details = student.details || {};
    const hasGoodStanding = (details.cgpa || 0) >= 5;

    return (
        <div className="container fade-in">
            <div className="proctee-details-page">
                <header className="student-hero-card">
                    <div className="student-info">
                        <h1>{student.name || student.usn}</h1>
                        <div className="student-meta-row">
                            <span className="usn-badge">{student.usn}</span>
                            <span>{details.class_details || "Student Profile Active"}</span>
                        </div>
                    </div>
                    <button className="generate-report-btn" onClick={handleGenerateReport}>Generate Report</button>
                </header>

                <div className="details-grid">
                    <div className="info-card">
                        <h2>Personal Information</h2>
                        <div className="personal-info-grid">
                            <div>Name: {student.name}</div>
                            <div>USN: {student.usn}</div>
                            <div>DOB: {student.dob}</div>
                        </div>
                    </div>
                    <div className="info-card">
                        <h2>Academic Status</h2>
                        <div className="cgpa-display">CGPA: {details.cgpa || "—"}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
