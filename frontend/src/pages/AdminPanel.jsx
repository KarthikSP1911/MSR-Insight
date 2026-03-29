import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import "./AdminPanel.css";

const ADMIN_PASSWORD = "admin123";

/* ─── Toast Component ─── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className={`admin-toast ${type}`}>{message}</div>;
}

/* ─── Confirm Dialog ─── */
function ConfirmDialog({ title, message, onConfirm, onCancel }) {
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
}) {
  const [expanded, setExpanded] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentUsn, setNewStudentUsn] = useState("");
  const [newStudentDob, setNewStudentDob] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/proctors/${proctor.proctorId}/students`
      );
      setStudents(res.data.data.students || []);
    } catch {
      showToast("Failed to load students", "error");
    } finally {
      setLoadingStudents(false);
    }
  }, [proctor.proctorId, showToast]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) fetchStudents();
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    if (!newStudentUsn.trim()) return;
    setAssigning(true);
    try {
      const body = { usn: newStudentUsn.trim() };
      if (newStudentDob.trim()) body.dob = newStudentDob.trim();

      await axios.post(
        `${API_BASE_URL}/api/admin/proctors/${proctor.proctorId}/students`,
        body
      );
      showToast(`Student ${newStudentUsn.toUpperCase()} assigned`, "success");
      setNewStudentUsn("");
      setNewStudentDob("");
      setShowAddStudent(false);
      fetchStudents();
      onStudentAssigned();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to assign student";
      showToast(msg, "error");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveStudent = async (usn) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/proctors/${proctor.proctorId}/students/${usn}`
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
    .map((w) => w[0])
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
            🗑
          </button>
          <span className={`expand-icon ${expanded ? "rotated" : ""}`}>▼</span>
        </div>
      </div>

      {expanded && (
        <div className="proctor-students-panel">
          <div className="students-header">
            <span>Assigned Students</span>
            <button
              className="add-student-btn"
              onClick={() => setShowAddStudent(!showAddStudent)}
            >
              {showAddStudent ? "✕ Cancel" : "+ Add Student"}
            </button>
          </div>

          {showAddStudent && (
            <form className="add-student-form" onSubmit={handleAssignStudent}>
              <input
                type="text"
                placeholder="Student USN"
                value={newStudentUsn}
                onChange={(e) => setNewStudentUsn(e.target.value)}
                required
                autoFocus
              />
              <input
                type="text"
                placeholder="DOB (optional, for new)"
                value={newStudentDob}
                onChange={(e) => setNewStudentDob(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={assigning}
              >
                {assigning ? "..." : "Assign"}
              </button>
            </form>
          )}

          {loadingStudents ? (
            <div className="admin-loading">
              <div className="spinner"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="empty-students">No students assigned yet</div>
          ) : (
            <div className="student-list">
              {students.map((s) => (
                <div key={s.id} className="student-row">
                  <div>
                    <span className="student-usn">
                      {s.usn.toUpperCase()}
                    </span>
                    {s.dob && (
                      <span className="student-dob">DOB: {s.dob}</span>
                    )}
                  </div>
                  <button
                    className="remove-student-btn"
                    onClick={() => handleRemoveStudent(s.usn)}
                    title="Remove from proctor"
                  >
                    ✕ Remove
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
  // Auth gate state
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("adminAuth") === "true"
  );
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Dashboard state
  const [proctors, setProctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Add proctor form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProctorId, setNewProctorId] = useState("");
  const [newProctorName, setNewProctorName] = useState("");
  const [newProctorPassword, setNewProctorPassword] = useState("");
  const [addingProctor, setAddingProctor] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Stats
  const [unassignedCount, setUnassignedCount] = useState(0);

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
  }, []);

  const fetchProctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/proctors`);
      setProctors(res.data.data || []);
    } catch {
      showToast("Failed to load proctors", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchUnassignedCount = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/students/unassigned`
      );
      setUnassignedCount((res.data.data || []).length);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchProctors();
      fetchUnassignedCount();
    }
  }, [authenticated, fetchProctors, fetchUnassignedCount]);

  /* ─── Auth Gate ─── */
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("adminAuth", "true");
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password");
      setPassword("");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    setAuthenticated(false);
    setPassword("");
  };

  /* ─── Add Proctor ─── */
  const handleAddProctor = async (e) => {
    e.preventDefault();
    if (!newProctorId.trim() || !newProctorPassword.trim()) return;

    setAddingProctor(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/proctors`, {
        proctorId: newProctorId.trim(),
        password: newProctorPassword.trim(),
        name: newProctorName.trim() || undefined,
      });
      showToast(
        `Proctor ${newProctorId.toUpperCase()} added successfully`,
        "success"
      );
      setNewProctorId("");
      setNewProctorName("");
      setNewProctorPassword("");
      setShowAddForm(false);
      fetchProctors();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add proctor";
      showToast(msg, "error");
    } finally {
      setAddingProctor(false);
    }
  };

  /* ─── Delete Proctor ─── */
  const handleDeleteProctor = (proctor) => {
    setConfirmDialog({
      title: "Delete Proctor",
      message: `Are you sure you want to delete proctor "${proctor.name || proctor.proctorId}"? All students will be unlinked.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await axios.delete(
            `${API_BASE_URL}/api/admin/proctors/${proctor.proctorId}`
          );
          showToast(
            `Proctor ${proctor.proctorId} deleted`,
            "success"
          );
          fetchProctors();
          fetchUnassignedCount();
        } catch {
          showToast("Failed to delete proctor", "error");
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  /* ─── Filtering ─── */
  const filteredProctors = proctors.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.proctorId.toLowerCase().includes(q) ||
      (p.name || "").toLowerCase().includes(q)
    );
  });

  const totalStudents = proctors.reduce(
    (sum, p) => sum + p.studentCount,
    0
  );

  /* ─── Render: Auth Gate ─── */
  if (!authenticated) {
    return (
      <div className="admin-gate">
        <form className="admin-gate-card" onSubmit={handleLogin}>
          <div className="gate-icon">🔒</div>
          <h2>Admin Access</h2>
          <p>Enter the admin password to continue</p>
          {authError && <div className="gate-error">{authError}</div>}
          <input
            type="password"
            className="input-field"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary">
            Unlock Panel
          </button>
        </form>
      </div>
    );
  }

  /* ─── Render: Dashboard ─── */
  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1>
          <span className="accent">⚡</span> Admin Panel
        </h1>
        <div className="admin-header-actions">
          <button className="admin-logout-btn" onClick={handleLogout}>
            ← Sign Out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon orange">👨‍🏫</div>
          <div>
            <div className="stat-value">{proctors.length}</div>
            <div className="stat-label">Total Proctors</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🎓</div>
          <div>
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-label">Assigned Students</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div>
            <div className="stat-value">{unassignedCount}</div>
            <div className="stat-label">Unassigned Students</div>
          </div>
        </div>
      </div>

      {/* Proctor Management Section */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>👥 Proctor Management</h2>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="admin-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search proctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "Cancel" : "+ Add Proctor"}
            </button>
          </div>
        </div>

        {/* Add Proctor Form */}
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
                  onChange={(e) => setNewProctorId(e.target.value)}
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
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={addingProctor}
              >
                {addingProctor ? "Adding..." : "Add Proctor"}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Proctor List */}
        {loading ? (
          <div className="admin-loading">
            <div className="spinner"></div>
            <span>Loading proctors...</span>
          </div>
        ) : filteredProctors.length === 0 ? (
          <div className="empty-students">
            {proctors.length === 0
              ? "No proctors added yet. Click \"+ Add Proctor\" to get started."
              : "No proctors match your search."}
          </div>
        ) : (
          <div className="proctor-list">
            {filteredProctors.map((p) => (
              <ProctorCard
                key={p.id}
                proctor={p}
                onDelete={handleDeleteProctor}
                onStudentAssigned={() => {
                  fetchProctors();
                  fetchUnassignedCount();
                }}
                onStudentRemoved={() => {
                  fetchProctors();
                  fetchUnassignedCount();
                }}
                showToast={showToast}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
}
