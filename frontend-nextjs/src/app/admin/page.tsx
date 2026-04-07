"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import DOBSelector from "@/components/DOBSelector";
import "@/styles/AdminPanel.css";

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
            <form className="add-student-form" onSubmit={handleAssignStudent} style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>USN</label>
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
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="input-field"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(formatName(e.target.value))}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Date of Birth</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <DOBSelector value={newStudentDob} onChange={setNewStudentDob} />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={assigning}
                    style={{ whiteSpace: 'nowrap', padding: '0 20px' }}
                  >
                    {assigning ? "..." : "Assign Student"}
                  </button>
                </div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="student-name" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {s.name}
                      </span>
                      <span className="student-usn" style={{ fontSize: '0.8rem', padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        {s.usn.toUpperCase()}
                      </span>
                    </div>
                    {s.dob && (
                      <span className="student-dob" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
  const [proctors, setProctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [academicYear, setAcademicYear] = useState("2027");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProctorId, setNewProctorId] = useState("");
  const [newProctorName, setNewProctorName] = useState("");
  const [newProctorPassword, setNewProctorPassword] = useState("");
  const [addingProctor, setAddingProctor] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
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

  useEffect(() => {
    fetchProctors();
    fetchStats();
  }, [fetchProctors, fetchStats]);

  const handleAddProctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProctorId.trim() || !newProctorPassword.trim()) return;

    setAddingProctor(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/proctors`, {
        proctorId: newProctorId.trim().toUpperCase(),
        password: newProctorPassword.trim(),
        name: newProctorName.trim() || undefined,
      });

      showToast(`Proctor ${newProctorId.toUpperCase()} added successfully`, "success");
      setNewProctorId("");
      setNewProctorName("");
      setNewProctorPassword("");
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
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>
          <span className="accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </span> Admin Panel
        </h1>
        <div className="admin-header-actions">
          <select
            className="year-selector"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            style={{ marginRight: '16px', background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-subtle)', padding: '4px 12px', borderRadius: '4px' }}
          >
            <option value="2027">Year 2027</option>
            <option value="2028">Year 2028</option>
            <option value="2029">Year 2029</option>
          </select>
        </div>
      </div>

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

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Proctor Management
          </h2>
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
          <form className="add-proctor-form" onSubmit={handleAddProctor}>
            <h3>Add New Proctor</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Proctor ID *</label>
                <input
                  type="text"
                  placeholder="e.g. P001"
                  value={newProctorId}
                  onChange={(e) => setNewProctorId(e.target.value.toUpperCase())}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Smith"
                  value={newProctorName}
                  onChange={(e) => setNewProctorName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Set password"
                  value={newProctorPassword}
                  onChange={(e) => setNewProctorPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-sm" disabled={addingProctor}>
                {addingProctor ? "Adding..." : "Add Proctor"}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmDialog && <ConfirmDialog title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={confirmDialog.onCancel} />}
    </div>
  );
}
