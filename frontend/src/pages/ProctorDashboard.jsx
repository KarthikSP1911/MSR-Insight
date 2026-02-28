import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ProctorDashboard = () => {
  const { proctorId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem("proctorSessionId");

        if (!sessionId) {
          navigate("/proctor-login");
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/proctor/${proctorId}/dashboard`, {
          headers: { "x-session-id": sessionId }
        });

        if (response.data.success) {
          setStudents(response.data.data);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate("/proctor-login");
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
  }, [proctorId]);

  const handleStudentClick = (usn) => {
    navigate(`/proctor/${proctorId}/student/${usn.toUpperCase()}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/proctor-login");
  };

  if (loading) {
    return (
      <div className="container fade-in" style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
        <p>Loading assigned students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container fade-in" style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--error)', marginBottom: 'var(--space-md)' }}>⚠️ {error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ padding: 'var(--space-xl) 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-xs)' }}>Proctor Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Managing {students.length} assigned students
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>Log out</button>
      </header>

      <div className="dashboard-grid">
        {students.map((student) => (
          <div
            key={student.id}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              height: '100%'
            }}
            onClick={() => handleStudentClick(student.usn)}
          >
            <div style={{ flex: 1 }}>
              <h2 style={{ marginBottom: 'var(--space-md)', fontSize: '1.5rem' }}>{student.name}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>USN</span>
                  <span style={{ fontWeight: '600' }}>{student.usn}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Semester</span>
                  <span style={{ fontWeight: '600' }}>{student.semester}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Section</span>
                  <span style={{ fontWeight: '600' }}>{student.section}</span>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              View Full Profile
            </button>
          </div>
        ))}

        {students.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-xl)' }}>
            <p>No students assigned to your dashboard yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProctorDashboard;
