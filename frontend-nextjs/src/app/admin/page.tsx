"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import DOBSelector from "@/components/DOBSelector";
import "@/styles/AdminPanel.css";

/* ─── Proctor Card Component ─── */
function ProctorCard({
  proctor,
  onDelete,
  onStudentAssigned,
  onStudentRemoved,
  showToast,
  academicYear
}: any) {
  const [expanded, setExpanded] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentUsn, setNewStudentUsn] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentDob, setNewStudentDob] = useState("");
  const [assigning, setAssigning] = useState(false);

  const formatName = (name: string) => {
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/proctors/${proctor.proctorId}/students?academicYear=${academicYear}`
      );
      setStudents(res.data.data.students || []);
    } catch {
      showToast("Failed to load students", "error");
    } finally {
      setLoadingStudents(false);
    }
  }, [proctor.proctorId, academicYear, showToast]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) fetchStudents();
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentUsn.trim() || !newStudentName.trim()) {
       showToast("USN and Name are required", "error");
       return;
    }

    setAssigning(true);
    try {
      const body = { 
        usn: newStudentUsn.trim().toUpperCase(),
        name: formatName(newStudentName.trim()),
        academicYear: academicYear 
      };
      
      const formattedDob = newStudentDob && newStudentDob.includes("-") 
        ? `${newStudentDob.split("-")[2]}-${newStudentDob.split("-")[1]}-${newStudentDob.split("-")[0]}`
        : newStudentDob;

      await axios.post(
        `${API_BASE_URL}/api/admin/proctors/${proctor.proctorId}/students`,
        { ...body, dob: formattedDob }
      );
      showToast(`Student ${body.name} assigned`, "success");
      setNewStudentUsn("");
      setNewStudentName("");
      setNewStudentDob("");
      setShowAddStudent(false);
      fetchStudents();
      onStudentAssigned();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to assign student";
      showToast(msg, "error");
    } finally {
      setAssigning(false);
    }
  };

  const initials = (proctor.name || proctor.proctorId)
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`proctor-card ${expanded ? "expanded" : ""}`}>
      <div className="proctor-card-header" onClick={handleToggle}>
        <div className="proctor-info">
          <div className="proctor-avatar">{initials}</div>
          <div className="proctor-details">
            <span className="proctor-name">{proctor.name || proctor.proctorId}</span>
            <span className="proctor-id-label">ID: {proctor.proctorId}</span>
          </div>
        </div>
        <div className="proctor-meta">
          <span className="student-count-badge">
            {proctor.studentCount} {proctor.studentCount === 1 ? "student" : "students"}
          </span>
          <button className="delete-proctor-btn" onClick={(e) => { e.stopPropagation(); onDelete(proctor); }}>Delete</button>
          <span className={`expand-icon ${expanded ? "rotated" : ""}`}>▼</span>
        </div>
      </div>
      {expanded && (
        <div className="proctor-students-panel">
          <div className="students-header">
            <span>Students ({academicYear})</span>
            <button className="add-student-btn" onClick={() => setShowAddStudent(!showAddStudent)}>{showAddStudent ? "Cancel" : "Add Student"}</button>
          </div>
          {showAddStudent && (
            <form className="add-student-form" onSubmit={handleAssignStudent}>
              <input type="text" placeholder="USN" className="input-field" value={newStudentUsn} onChange={(e) => setNewStudentUsn(e.target.value.toUpperCase())} required />
              <input type="text" placeholder="Name" className="input-field" value={newStudentName} onChange={(e) => setNewStudentName(formatName(e.target.value))} required />
              <DOBSelector value={newStudentDob} onChange={setNewStudentDob} />
              <button type="submit" className="btn btn-primary" disabled={assigning}>Assign</button>
            </form>
          )}
          {loadingStudents ? <div className="spinner"></div> : students.map((s: any) => (
            <div key={s.usn} className="student-row">
              {s.name} ({s.usn})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Admin Panel ─── */
export default function AdminPanel() {
  const [proctors, setProctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("2027");
  const [toast, setToast] = useState<{message: string, type: string} | null>(null);

  const showToast = useCallback((message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchProctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/proctors?academicYear=${academicYear}`);
      setProctors(res.data.data || []);
    } catch {
      showToast("Failed to load proctors", "error");
    } finally {
      setLoading(false);
    }
  }, [academicYear, showToast]);

  useEffect(() => { fetchProctors(); }, [fetchProctors]);

  const filteredProctors = proctors.filter((p) => {
    const q = search.toLowerCase();
    return p.proctorId.toLowerCase().includes(q) || (p.name || "").toLowerCase().includes(q);
  });

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <select className="year-selector" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
          <option value="2027">2027</option>
          <option value="2028">2028</option>
        </select>
      </header>
      <div className="admin-section">
        <input className="input-field" type="text" placeholder="Search proctors..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {loading ? <div className="spinner"></div> : filteredProctors.map((p) => (
          <ProctorCard key={p.proctorId} proctor={p} academicYear={academicYear} showToast={showToast} onStudentAssigned={fetchProctors} onStudentRemoved={fetchProctors} onDelete={() => {}} />
        ))}
      </div>
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
