"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import { useAppContext } from "@/lib/AppContext";
import { useToast } from "@/lib/ToastContext";
import "@/styles/Comparison.css";

interface StudentSummary {
    usn: string;
    name: string;
    semester?: string;
    section?: string;
}

interface SubjectRow {
    name: string;
    attendanceA: number | null;
    attendanceB: number | null;
    scoreA: number | null;
    scoreB: number | null;
}

/** Extracts the normalized subjects array from a proctor/:id/student/:usn response. */
const extractSubjects = (data: any) => {
    const details = data?.details || {};
    const inner = (details.details && typeof details.details === "object") ? details.details : details;
    const subjects = Array.isArray(inner.subjects)
        ? inner.subjects
        : Array.isArray(inner.current_semester)
            ? inner.current_semester
            : [];
    return { inner, subjects };
};

function StudentPicker({
    label,
    students,
    excludeUsn,
    value,
    onChange,
}: {
    label: string;
    students: StudentSummary[];
    excludeUsn: string | null;
    value: string | null;
    onChange: (usn: string) => void;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return students
            .filter((s) => s.usn !== excludeUsn)
            .filter((s) => !q || s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q));
    }, [students, query, excludeUsn]);

    const selected = students.find((s) => s.usn === value);

    return (
        <div className="student-picker">
            <span className="student-picker-label">{label}</span>
            <div className="student-picker-input-wrap">
                <input
                    type="text"
                    placeholder="Search by name or USN..."
                    value={open ? query : (selected ? `${selected.name} (${selected.usn})` : query)}
                    onFocus={() => { setOpen(true); setQuery(""); }}
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                />
                {open && (
                    <div className="student-picker-menu">
                        {filtered.length === 0 && <div className="student-picker-empty">No matches</div>}
                        {filtered.map((s) => (
                            <div
                                key={s.usn}
                                className="student-picker-item"
                                onMouseDown={() => { onChange(s.usn); setOpen(false); setQuery(""); }}
                            >
                                <span className="picker-item-name">{s.name}</span>
                                <span className="picker-item-usn">{s.usn}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ComparisonView() {
    const params = useParams();
    const router = useRouter();
    const proctorId = params.proctorId as string;
    const { academicYear } = useAppContext();
    const toast = useToast();

    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listError, setListError] = useState("");

    const [usnA, setUsnA] = useState<string | null>(null);
    const [usnB, setUsnB] = useState<string | null>(null);
    const [detailA, setDetailA] = useState<any>(null);
    const [detailB, setDetailB] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoadingList(true);
                const sessionId = localStorage.getItem("proctorSessionId");
                if (!sessionId) {
                    router.push("/proctor-login");
                    return;
                }
                const response = await axios.get(
                    `${API_BASE_URL}/api/proctor/${proctorId}/dashboard?academicYear=${academicYear}`,
                    { headers: { "x-session-id": sessionId } }
                );
                if (response.data.success) setStudents(response.data.data);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.clear();
                    router.push("/proctor-login");
                    return;
                }
                setListError(err.response?.data?.message || "Failed to fetch students");
            } finally {
                setLoadingList(false);
            }
        };
        if (proctorId) fetchStudents();
    }, [proctorId, academicYear, router]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!usnA || !usnB) {
                setDetailA(null);
                setDetailB(null);
                return;
            }
            try {
                setLoadingDetails(true);
                const sessionId = localStorage.getItem("proctorSessionId");
                if (!sessionId) {
                    router.push("/proctor-login");
                    return;
                }
                const headers = { "x-session-id": sessionId };
                const [resA, resB] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/proctor/${proctorId}/student/${usnA}`, { headers }),
                    axios.get(`${API_BASE_URL}/api/proctor/${proctorId}/student/${usnB}`, { headers }),
                ]);
                setDetailA(resA.data.success ? resA.data.data : null);
                setDetailB(resB.data.success ? resB.data.data : null);
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to fetch student details for comparison");
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usnA, usnB, proctorId, router]);

    const { rows, metaA, metaB } = useMemo(() => {
        if (!detailA || !detailB) return { rows: [] as SubjectRow[], metaA: null, metaB: null };

        const { inner: innerA, subjects: subjectsA } = extractSubjects(detailA);
        const { inner: innerB, subjects: subjectsB } = extractSubjects(detailB);

        const rowMap = new Map<string, SubjectRow>();
        const readAttendance = (s: any) => {
            const raw = s.attendance ?? s.attendance_details?.percentage;
            const val = parseFloat(String(raw ?? "").replace("%", "").trim());
            return isNaN(val) ? null : Math.round(val);
        };

        subjectsA.forEach((s: any) => {
            const name = s.name || "Unknown";
            rowMap.set(name, {
                name,
                attendanceA: readAttendance(s),
                scoreA: typeof s.marks === "number" ? s.marks : null,
                attendanceB: null,
                scoreB: null,
            });
        });
        subjectsB.forEach((s: any) => {
            const name = s.name || "Unknown";
            const existing = rowMap.get(name) || { name, attendanceA: null, scoreA: null, attendanceB: null, scoreB: null };
            existing.attendanceB = readAttendance(s);
            existing.scoreB = typeof s.marks === "number" ? s.marks : null;
            rowMap.set(name, existing);
        });

        return {
            rows: Array.from(rowMap.values()),
            metaA: { name: detailA.name, usn: detailA.usn, cgpa: innerA.cgpa, classDetails: innerA.class_details },
            metaB: { name: detailB.name, usn: detailB.usn, cgpa: innerB.cgpa, classDetails: innerB.class_details },
        };
    }, [detailA, detailB]);

    return (
        <div className="comparison-view fade-in">
            <header className="comparison-header">
                <button className="comparison-back-btn" onClick={() => router.push(`/proctor/${proctorId}/dashboard`)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>Back to Dashboard</span>
                </button>
                <h1>Compare Students</h1>
            </header>

            {listError && <p className="comparison-error">⚠️ {listError}</p>}

            {loadingList ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your students...</p>
                </div>
            ) : (
                <>
                    <div className="comparison-pickers">
                        <StudentPicker label="Student A" students={students} excludeUsn={usnB} value={usnA} onChange={setUsnA} />
                        <div className="comparison-vs">VS</div>
                        <StudentPicker label="Student B" students={students} excludeUsn={usnA} value={usnB} onChange={setUsnB} />
                    </div>

                    {loadingDetails && (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading comparison...</p>
                        </div>
                    )}

                    {!loadingDetails && metaA && metaB && (
                        <div className="comparison-panels">
                            <div className="comparison-meta-row">
                                <div className="comparison-meta-card">
                                    <h2>{metaA.name}</h2>
                                    <span>{metaA.usn}</span>
                                    <span>{metaA.classDetails || "—"}</span>
                                    <span className="comparison-cgpa">CGPA: {metaA.cgpa || "—"}</span>
                                </div>
                                <div className="comparison-vs">VS</div>
                                <div className="comparison-meta-card">
                                    <h2>{metaB.name}</h2>
                                    <span>{metaB.usn}</span>
                                    <span>{metaB.classDetails || "—"}</span>
                                    <span className="comparison-cgpa">CGPA: {metaB.cgpa || "—"}</span>
                                </div>
                            </div>

                            <div className="comparison-table-wrap">
                                <table className="comparison-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th colSpan={2}>Attendance</th>
                                            <th colSpan={2}>Score (CIE)</th>
                                        </tr>
                                        <tr className="comparison-subhead">
                                            <th></th>
                                            <th>{metaA.name.split(" ")[0]}</th>
                                            <th>{metaB.name.split(" ")[0]}</th>
                                            <th>{metaA.name.split(" ")[0]}</th>
                                            <th>{metaB.name.split(" ")[0]}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                                    No overlapping subject data to compare.
                                                </td>
                                            </tr>
                                        ) : rows.map((row) => (
                                            <tr key={row.name}>
                                                <td className="subject-name-cell">{row.name}</td>
                                                <td className={row.attendanceA !== null && row.attendanceA < 75 ? 'cell-low' : ''}>
                                                    {row.attendanceA !== null ? `${row.attendanceA}%` : '—'}
                                                </td>
                                                <td className={row.attendanceB !== null && row.attendanceB < 75 ? 'cell-low' : ''}>
                                                    {row.attendanceB !== null ? `${row.attendanceB}%` : '—'}
                                                </td>
                                                <td>{row.scoreA !== null ? row.scoreA : '—'}</td>
                                                <td>{row.scoreB !== null ? row.scoreB : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!loadingDetails && (!usnA || !usnB) && (
                        <div className="comparison-placeholder">
                            <p>Select two students above to compare their marks and attendance side by side.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
