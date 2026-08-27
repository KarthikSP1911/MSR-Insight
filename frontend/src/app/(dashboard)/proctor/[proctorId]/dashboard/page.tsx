"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { useAppContext } from "@/lib/AppContext";
import { useToast } from "@/lib/ToastContext";
import "@/styles/ProctorDashboard.css";
import ProctorChatbot from "@/components/dashboard/ProctorChatbot";

/**
 * ProctorDashboard: Displays the list of students assigned to a proctor.
 * Migrated to Next.js App Router with full feature parity.
 */
export default function ProctorDashboard() {
    const params = useParams();
    const proctorId = params.proctorId as string;
    const router = useRouter();
    const { academicYear } = useAppContext();
    const toast = useToast();

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Batch report ZIP download selection
    const [selectedUsns, setSelectedUsns] = useState<Set<string>>(new Set());
    const [downloadingZip, setDownloadingZip] = useState(false);

    // Filtering states
    const [searchTerm, setSearchTerm] = useState("");
    const [semesterFilter, setSemesterFilter] = useState("All");
    const [sectionFilter, setSectionFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const sessionId = localStorage.getItem("proctorSessionId");

                if (!sessionId) {
                    router.push("/proctor-login");
                    return;
                }

                const response = await axios.get(`${API_BASE_URL}/api/proctor/${proctorId}/dashboard?academicYear=${academicYear}`, {
                    headers: { "x-session-id": sessionId }
                });

                if (response.data.success) {
                    setStudents(response.data.data);
                }
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.clear();
                    router.push("/proctor-login");
                    return;
                }
                setError(err.response?.data?.message || "Failed to fetch students");
            } finally {
                setLoading(false);
            }
        };

        if (proctorId) {
            fetchStudents();
        }
    }, [proctorId, academicYear, router]);

    const handleStudentClick = (usn: string) => {
        router.push(`/proctor/${proctorId}/student/${usn.toUpperCase()}`);
    };

    const toggleSelect = (usn: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedUsns((prev) => {
            const next = new Set(prev);
            if (next.has(usn)) next.delete(usn);
            else next.add(usn);
            return next;
        });
    };

    const clearSelection = () => setSelectedUsns(new Set());

    const handleDownloadZip = async () => {
        if (selectedUsns.size === 0) return;
        try {
            setDownloadingZip(true);
            const sessionId = localStorage.getItem("proctorSessionId");
            if (!sessionId) {
                router.push("/proctor-login");
                return;
            }

            const response = await axios.post(
                `${API_BASE_URL}/api/proctor/${proctorId}/reports/batch-zip`,
                { usns: Array.from(selectedUsns) },
                { headers: { "x-session-id": sessionId }, responseType: "blob" }
            );

            const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/zip" }));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `Reports_${proctorId}_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
            clearSelection();
        } catch (err: any) {
            // responseType "blob" means an error JSON body also arrives as a Blob -- parse it back out.
            let message = "Failed to download reports. Please try again.";
            const errData = err.response?.data;
            if (errData instanceof Blob && errData.type.includes("json")) {
                try {
                    const parsed = JSON.parse(await errData.text());
                    message = parsed.message || message;
                } catch {
                    // fall through to default message
                }
            } else if (err.response?.data?.message) {
                message = err.response.data.message;
            }
            toast.error(message);
        } finally {
            setDownloadingZip(false);
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const matchesSearch =
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.usn.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSemester = semesterFilter === "All" || (student.semester && student.semester === semesterFilter);
            const matchesSection = sectionFilter === "All" || (student.section && student.section === sectionFilter);
            // Status filter logic (can be expanded if status is available in data)
            const matchesStatus = statusFilter === "All";

            return matchesSearch && matchesSemester && matchesSection && matchesStatus;
        });
    }, [students, searchTerm, semesterFilter, sectionFilter, statusFilter]);

    const semesterOptions = [
        { value: "All", label: "Semester" },
        { value: "Sem 01", label: "Sem 01" },
        { value: "Sem 02", label: "Sem 02" },
        { value: "Sem 03", label: "Sem 03" },
        { value: "Sem 04", label: "Sem 04" },
        { value: "Sem 05", label: "Sem 05" },
        { value: "Sem 06", label: "Sem 06" },
        { value: "Sem 07", label: "Sem 07" },
        { value: "Sem 08", label: "Sem 08" },
    ];

    const sectionOptions = [
        { value: "All", label: "Section" },
        { value: "Sec A", label: "Sec A" },
        { value: "Sec B", label: "Sec B" },
        { value: "Sec C", label: "Sec C" },
    ];

    const statusOptions = [
        { value: "All", label: "Performance Status" },
        { value: "Excellent", label: "Excellent" },
        { value: "Good", label: "Good" },
        { value: "Average", label: "Average" },
        { value: "At Risk", label: "At Risk" },
    ];

    const getContrastColor = (hex: string) => {
        if (!hex) return '#FFFFFF';
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.slice(0, 2), 16);
        const g = parseInt(cleanHex.slice(2, 4), 16);
        const b = parseInt(cleanHex.slice(4, 6), 16);
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > 128 ? '#000000' : '#FFFFFF';
    };

    const getAttendanceStatus = (attendance: number | null) => {
        if (attendance === null || attendance === undefined) return { label: 'N/A', class: 'status-na' };
        if (attendance < 65) return { label: `${attendance}%`, class: 'status-danger' };
        if (attendance < 75) return { label: `${attendance}%`, class: 'status-warn' };
        return { label: `${attendance}%`, class: 'status-ok' };
    };

    if (loading) {
        return (
            <div className="loading-container fade-in">
                <div className="spinner"></div>
                <p>Fetching assigned students for {academicYear}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container fade-in">
                <p className="error-msg">⚠️ {error}</p>
                <button className="year-picker" style={{ alignSelf: 'center', marginTop: '1rem' }} onClick={() => window.location.reload()}>Retry Connection</button>
            </div>
        );
    }

    return (
        <>
            <div className="proctor-dashboard fade-in">
                <div className="flex justify-end mb-3.5">
                    <button
                        className="compare-students-btn"
                        onClick={() => router.push(`/proctor/${proctorId}/compare`)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                            <path d="M8 3v18M16 3v18" />
                        </svg>
                        <span>Compare Students</span>
                    </button>
                </div>

                <section className="filter-bar">
                    <div className="filter-item search-box">
                        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by student name or USN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <CustomDropdown
                        options={semesterOptions}
                        value={semesterFilter}
                        onChange={setSemesterFilter}
                        placeholder="Semester"
                    />

                    <CustomDropdown
                        options={sectionOptions}
                        value={sectionFilter}
                        onChange={setSectionFilter}
                        placeholder="Section"
                    />

                    <CustomDropdown
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="Performance Status"
                    />
                </section>

                <div className="proctees-grid grid-container">
                    {filteredStudents.map((student) => {
                        const status = getAttendanceStatus(student.lowestAttendance);

                        return (
                            <div
                                key={student.usn}
                                className={`student-card ${status.class} ${selectedUsns.has(student.usn) ? 'is-selected' : ''}`}
                                onClick={() => handleStudentClick(student.usn)}
                            >
                                <label className="report-select-checkbox absolute top-3 right-3 z-[2] flex cursor-pointer" onClick={(e) => toggleSelect(student.usn, e)} title="Select for batch report ZIP">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsns.has(student.usn)}
                                        onChange={() => {}}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </label>
                                <div className="card-header">
                                    <h2 className="student-name">{student.name}</h2>
                                    <span className={`status-badge ${status.class}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="card-body">
                                    <div className="info-grid">
                                        <div className="info-row">
                                            <span className="info-label">USN</span>
                                            <span className="info-value">{student.usn}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Semester</span>
                                            <span className="info-value">{student.semester || 'N/A'}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Section</span>
                                            <span className="info-value">{student.section || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <button className="view-btn">
                                        <span className="">View Full Profile</span>
                                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredStudents.length === 0 && (
                        <div className="no-results">
                            <p>No students match your current filters.</p>
                            <button onClick={() => {
                                setSearchTerm("");
                                setSemesterFilter("All");
                                setSectionFilter("All");
                                setStatusFilter("All");
                            }}>Clear All Filters</button>
                        </div>
                    )}
                </div>

                {selectedUsns.size > 0 && (
                    <div className="batch-zip-bar fade-in">
                        <span className="batch-zip-count">{selectedUsns.size} student{selectedUsns.size > 1 ? 's' : ''} selected</span>
                        <button className="batch-zip-clear-btn" onClick={clearSelection} disabled={downloadingZip}>
                            Clear
                        </button>
                        <button className="batch-zip-download-btn" onClick={handleDownloadZip} disabled={downloadingZip}>
                            {downloadingZip ? "Preparing ZIP..." : "Download Selected as ZIP"}
                        </button>
                    </div>
                )}
            </div>
            <ProctorChatbot proctorId={proctorId} />
        </>
    );
}
