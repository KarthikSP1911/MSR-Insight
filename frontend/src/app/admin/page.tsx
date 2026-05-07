"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import { useRouter } from "next/navigation";
import DOBSelector from "@/components/dashboard/DOBSelector";
import "@/styles/AdminPanel.css";

/* ─── Helper Functions ─── */
const formatName = (name: string) => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/* ─── Toast Component ─── */
function Toast({ message, type, onClose }: { message: string; type: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className={`admin-toast ${type}`}>{message}</div>;
}

/* ─── Confirm Dialog ─── */
function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-sm btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-sm btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Proctor Card with expandable students ─── */
function ProctorCard({
  proctor,
  onDelete,
  onStudentAssigned,
  onStudentRemoved,
  showToast,
  academicYear
}: {
  proctor: any;
  onDelete: (p: any) => void;
  onStudentAssigned: () => void;
  onStudentRemoved: () => void;
  showToast: (m: string, t: string) => void;
  academicYear: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentUsn, setNewStudentUsn] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentDob, setNewStudentDob] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [assigning, setAssigning] = useState(false);

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
        phone: newStudentPhone.trim(),
        email: newStudentEmail.trim(),
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
      setNewStudentPhone("");
      setNewStudentEmail("");
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

  const handleRemoveStudent = async (usn: string) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/proctors/${proctor.proctorId}/students/${usn}?academicYear=${academicYear}`
      );
      showToast(`Student ${usn.toUpperCase()} removed`, "success");
      fetchStudents();
      onStudentRemoved();
    } catch {
      showToast("Failed to remove student", "error");
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
            <span className="proctor-name">
              {proctor.name || proctor.proctorId}
            </span>
            <span className="proctor-id-label">ID: {proctor.proctorId}</span>
          </div>
        </div>
        <div className="proctor-meta">
          <span className="student-count-badge">
            {proctor.studentCount}{" "}
            {proctor.studentCount === 1 ? "student" : "students"}
          </span>
          <button
            className="delete-proctor-btn"
            title="Delete Proctor"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(proctor);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
          </button>
          <span className={`expand-icon ${expanded ? "rotated" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        </div>
      </div>

      {expanded && (
        <div className="proctor-students-panel">
          <div className="students-header">
            <span>Assigned Students ({academicYear})</span>
            <button
              className="add-student-btn"
              onClick={() => setShowAddStudent(!showAddStudent)}
            >
              {showAddStudent ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              )}
              {showAddStudent ? "Cancel" : "Add Student"}
            </button>
          </div>

          {showAddStudent && (
            <form className="add-student-form-grid" onSubmit={handleAssignStudent}>
              <div className="form-group">
                <label className="field-label">USN *</label>
                <input
                  type="text"
                  placeholder="e.g. 1MS24CS001"
                  className="input-field"
                  value={newStudentUsn}
                  onChange={(e) => setNewStudentUsn(e.target.value.toUpperCase())}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="field-label">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="input-field"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(formatName(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="field-label">Phone</label>
                <input
                  type="text"
                  placeholder="Optional"
                  className="input-field"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  placeholder="Optional"
                  className="input-field"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="field-label">Date of Birth *</label>
                <DOBSelector value={newStudentDob} onChange={setNewStudentDob} />
              </div>
              <div className="form-group submit-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm assign-btn"
                  style={{ width: '100%', height: '38px' }}
                  disabled={assigning}
                >
                  {assigning ? "..." : "Assign Student"}
                </button>
              </div>
            </form>
          )}

          {loadingStudents ? (
            <div className="admin-loading">
              <div className="spinner"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="empty-students">No students assigned for {academicYear}</div>
          ) : (
            <div className="student-list">
              {students.map((s) => (
                <div key={s.usn} className="student-row">
                <div className="student-info-mini">
                    <div className="student-header-mini">
                      <span className="student-name-mini">
                        {s.name}
                      </span>
                      <span className="student-usn-mini">
                        {s.usn.toUpperCase()}
                      </span>
                    </div>
                    {s.dob && (
                      <span className="student-dob">
                        DOB: {s.dob}
                      </span>
                    )}
                  </div>
                  <button
                    className="remove-student-btn"
                    onClick={() => handleRemoveStudent(s.usn)}
                    title="Remove from proctor"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Admin Panel ─── */
export default function AdminPanel() {
  const router = useRouter();
  const [proctors, setProctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("2027");

  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [selectedUnassignedUsns, setSelectedUnassignedUsns] = useState<string[]>([]);
  const [selectedProctorForBulk, setSelectedProctorForBulk] = useState<string>("");
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "proctors" | "unassigned" | "parents">("overview");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("adminAuthenticated") !== "true") {
        router.push("/admin-login");
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    router.push("/admin-login");
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProctorId, setNewProctorId] = useState("");
  const [newProctorName, setNewProctorName] = useState("");
  const [newProctorPassword, setNewProctorPassword] = useState("");
  const [newProctorPhone, setNewProctorPhone] = useState("");
  const [newProctorEmail, setNewProctorEmail] = useState("");
  const [addingProctor, setAddingProctor] = useState(false);

  /* ─── Parent Form States ─── */
  const [showAddParentForm, setShowAddParentForm] = useState(false);
  const [newParentUsn, setNewParentUsn] = useState("");
  const [newParentRelation, setNewParentRelation] = useState("Father");
  const [newParentName, setNewParentName] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [newParentEmail, setNewParentEmail] = useState("");
  const [addingParent, setAddingParent] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentUsn.trim() || !newParentRelation.trim() || !newParentName.trim() || !newParentPhone.trim() || !newParentEmail.trim()) {
      showToast("All parent fields are required", "error");
      return;
    }

    setAddingParent(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/parents`, {
        usn: newParentUsn.trim().toUpperCase(),
        relation: newParentRelation.trim(),
        name: formatName(newParentName.trim()),
        phone: newParentPhone.trim(),
        email: newParentEmail.trim(),
      });

      showToast(`Parent details for student ${newParentUsn.toUpperCase()} added successfully`, "success");
      setNewParentUsn("");
      setNewParentRelation("Father");
      setNewParentName("");
      setNewParentPhone("");
      setNewParentEmail("");
      setShowAddParentForm(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add parent details", "error");
    } finally {
      setAddingParent(false);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void; onCancel: () => void } | null>(null);
  const [stats, setStats] = useState({
    totalProctors: 0,
    totalStudents: 0,
    unassignedCount: 0
  });

  const showToast = useCallback((message: string, type: string) => {
    setToast({ message, type });
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

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/stats?academicYear=${academicYear}`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, [academicYear]);

  const fetchUnassignedStudents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/students/unassigned?academicYear=${academicYear}`);
      if (res.data.success) {
        setUnassignedStudents(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch unassigned students", err);
    }
  }, [academicYear]);

  useEffect(() => {
    fetchProctors();
    fetchStats();
    fetchUnassignedStudents();
  }, [fetchProctors, fetchStats, fetchUnassignedStudents]);

  const handleBulkAssign = async () => {
    if (selectedUnassignedUsns.length === 0) {
      showToast("Please select at least one student", "error");
      return;
    }
    if (!selectedProctorForBulk) {
      showToast("Please select a proctor", "error");
      return;
    }

    setBulkAssigning(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/proctors/${selectedProctorForBulk}/students/bulk`, {
        usns: selectedUnassignedUsns,
        academicYear
      });
      showToast(`Successfully assigned ${selectedUnassignedUsns.length} students`, "success");
      setSelectedUnassignedUsns([]);
      setSelectedProctorForBulk("");
      fetchProctors();
      fetchStats();
      fetchUnassignedStudents();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to assign students", "error");
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleSelectAllUnassigned = () => {
    if (selectedUnassignedUsns.length === unassignedStudents.length) {
      setSelectedUnassignedUsns([]);
    } else {
      setSelectedUnassignedUsns(unassignedStudents.map(s => s.usn));
    }
  };

  const handleSelectUnassigned = (usn: string) => {
    if (selectedUnassignedUsns.includes(usn)) {
      setSelectedUnassignedUsns(selectedUnassignedUsns.filter(u => u !== usn));
    } else {
      setSelectedUnassignedUsns([...selectedUnassignedUsns, usn]);
    }
  };

  const handleAddProctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProctorId.trim() || !newProctorPassword.trim()) return;

    setAddingProctor(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/proctors`, {
        proctorId: newProctorId.trim().toUpperCase(),
        password: newProctorPassword.trim(),
        name: newProctorName.trim() || undefined,
        phone: newProctorPhone.trim() || undefined,
        email: newProctorEmail.trim() || undefined,
      });

      showToast(`Proctor ${newProctorId.toUpperCase()} added successfully`, "success");
      setNewProctorId("");
      setNewProctorName("");
      setNewProctorPassword("");
      setNewProctorPhone("");
      setNewProctorEmail("");
      setShowAddForm(false);
      fetchProctors();
      fetchStats();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add proctor", "error");
    } finally {
      setAddingProctor(false);
    }
  };

  const handleDeleteProctor = (proctor: any) => {
    setConfirmDialog({
      title: "Delete Proctor",
      message: `Are you sure you want to delete proctor "${proctor.name || proctor.proctorId}"? All assignments in ALL years will be unlinked.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await axios.delete(
            `${API_BASE_URL}/api/admin/proctors/${proctor.proctorId}`
          );
          showToast(`Proctor ${proctor.proctorId} deleted`, "success");
          fetchProctors();
          fetchStats();
        } catch {
          showToast("Failed to delete proctor", "error");
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const filteredProctors = proctors.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.proctorId.toLowerCase().includes(q) ||
      (p.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-container">
      {/* Left Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <h1>Admin Panel</h1>
        </div>

        <nav className="sidebar-nav">
          <button 
            type="button"
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
            Overview
          </button>
          
          <button 
            type="button"
            className={`nav-item ${activeTab === "proctors" ? "active" : ""}`}
            onClick={() => setActiveTab("proctors")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Proctors
          </button>
          
          <button 
            type="button"
            className={`nav-item ${activeTab === "unassigned" ? "active" : ""}`}
            onClick={() => setActiveTab("unassigned")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
            Unassigned
          </button>
          
          <button 
            type="button"
            className={`nav-item ${activeTab === "parents" ? "active" : ""}`}
            onClick={() => setActiveTab("parents")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Parents
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Right Content Pane */}
      <main className="admin-content-pane">
        <header className="content-pane-header">
          <div className="pane-title">
            <h2>
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "proctors" && "Proctor Management"}
              {activeTab === "unassigned" && "Unassigned Students Assignment"}
              {activeTab === "parents" && "Parent Registration"}
            </h2>
          </div>
          <div className="pane-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select
              className="year-selector"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="2027">Year 2027</option>
              <option value="2028">Year 2028</option>
              <option value="2029">Year 2029</option>
            </select>
          </div>
        </header>

        <div className="pane-body">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="overview-tab" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div className="admin-stats">
                <div className="stat-card">
                  <div className="stat-icon orange">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalProctors}</div>
                    <div className="stat-label">Total Proctors</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
                  </div>
                  <div>
                    <div className="stat-value">{stats.unassignedCount}</div>
                    <div className="stat-label">Unassigned Students ({academicYear})</div>
                  </div>
                </div>
              </div>

              <div className="welcome-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', marginTop: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', color: 'var(--accent-primary)', fontWeight: 700 }}>Welcome to the Smart Report Admin Panel</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: '1.6', fontSize: '1rem' }}>
                  Use the left sidebar sections to oversee student tracking. You can organize Proctors, assign students in bulk, and complete Parent registration entries seamlessly.
                </p>
              </div>
            </div>
          )}

          {/* PROCTORS TAB */}
          {activeTab === "proctors" && (
            <div className="admin-section" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div className="admin-section-header">
                <h2>Proctor Management</h2>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div className="admin-search">
                    <span className="search-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search proctors..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? "Cancel" : "+ Add Proctor"}
                  </button>
                </div>
              </div>

              {showAddForm && (
                <form className="add-proctor-form-grid" onSubmit={handleAddProctor}>
                  <div className="form-header-row" style={{ gridColumn: '1 / -1', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Add New Proctor</h3>
                    <button type="button" className="close-btn" onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  
                  <div className="form-group">
                    <label className="field-label">Proctor ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. P001"
                      className="input-field"
                      value={newProctorId}
                      onChange={(e) => setNewProctorId(e.target.value.toUpperCase())}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="field-label">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Smith"
                      className="input-field"
                      value={newProctorName}
                      onChange={(e) => setNewProctorName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="field-label">Password *</label>
                    <input
                      type="password"
                      placeholder="Set password"
                      className="input-field"
                      value={newProctorPassword}
                      onChange={(e) => setNewProctorPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="field-label">Phone</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      className="input-field"
                      value={newProctorPhone}
                      onChange={(e) => setNewProctorPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="field-label">Email</label>
                    <input
                      type="email"
                      placeholder="Optional"
                      className="input-field"
                      value={newProctorEmail}
                      onChange={(e) => setNewProctorEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group submit-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '38px' }} disabled={addingProctor}>
                      {addingProctor ? "Adding..." : "Add Proctor"}
                    </button>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="admin-loading">
                  <div className="spinner"></div>
                  <span>Loading {academicYear} data...</span>
                </div>
              ) : filteredProctors.length === 0 ? (
                <div className="empty-students">
                  {proctors.length === 0
                    ? "No proctors added yet."
                    : "No proctors match your search."}
                </div>
              ) : (
                <div className="proctor-list">
                  {filteredProctors.map((p) => (
                    <ProctorCard
                      key={p.proctorId}
                      proctor={p}
                      academicYear={academicYear}
                      onDelete={handleDeleteProctor}
                      onStudentAssigned={() => { fetchProctors(); fetchStats(); }}
                      onStudentRemoved={() => { fetchProctors(); fetchStats(); }}
                      showToast={showToast}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UNASSIGNED STUDENTS TAB */}
          {activeTab === "unassigned" && (
            <div className="admin-section" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div className="admin-section-header">
                <h2>Unassigned Students</h2>
              </div>
              
              {unassignedStudents.length === 0 ? (
                <div className="empty-students">No unassigned students found.</div>
              ) : (
                <div className="unassigned-students-container" style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                  <div className="bulk-assign-actions" style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select 
                      value={selectedProctorForBulk} 
                      onChange={(e) => setSelectedProctorForBulk(e.target.value)}
                      className="input-field"
                      style={{ maxWidth: '300px' }}
                    >
                      <option value="">-- Select Proctor --</option>
                      {proctors.map(p => (
                        <option key={p.proctorId} value={p.proctorId}>{p.name || p.proctorId} ({p.studentCount})</option>
                      ))}
                    </select>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={handleBulkAssign}
                      disabled={bulkAssigning || selectedUnassignedUsns.length === 0 || !selectedProctorForBulk}
                    >
                      {bulkAssigning ? "Assigning..." : `Assign Selected (${selectedUnassignedUsns.length})`}
                    </button>
                  </div>
                  
                  <div className="unassigned-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <th style={{ padding: '0.75rem 0.5rem', width: '40px' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedUnassignedUsns.length === unassignedStudents.length && unassignedStudents.length > 0}
                              onChange={handleSelectAllUnassigned}
                            />
                          </th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>USN</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>DOB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unassignedStudents.map(student => (
                          <tr key={student.usn} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedUnassignedUsns.includes(student.usn)}
                                onChange={() => handleSelectUnassigned(student.usn)}
                              />
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}><strong>{student.usn}</strong></td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{student.name}</td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{student.dob}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARENTS TAB */}
          {activeTab === "parents" && (
            <div className="admin-section" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div className="admin-section-header">
                <h2>Parent Registration</h2>
              </div>

              <form className="add-student-form-grid" onSubmit={handleAddParent} style={{ background: 'var(--bg-secondary)', padding: '2rem', border: '1px solid var(--border-subtle)' }}>
                <div className="form-group">
                  <label className="field-label">Student USN *</label>
                  <input
                    type="text"
                    placeholder="e.g. 1MS24CS001"
                    className="input-field"
                    value={newParentUsn}
                    onChange={(e) => setNewParentUsn(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Parent Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Robert Doe"
                    className="input-field"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Relation *</label>
                  <select
                    className="input-field"
                    value={newParentRelation}
                    onChange={(e) => setNewParentRelation(e.target.value)}
                    required
                    style={{ height: '38px' }}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="field-label">Phone *</label>
                  <input
                    type="text"
                    placeholder="Enter 10-digit phone"
                    className="input-field"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="field-label">Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. parent@example.com"
                    className="input-field"
                    value={newParentEmail}
                    onChange={(e) => setNewParentEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group submit-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', height: '38px' }}
                    disabled={addingParent}
                  >
                    {addingParent ? "Adding..." : "Add Parent Details"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmDialog && <ConfirmDialog title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={confirmDialog.onCancel} />}
    </div>
  );
}
