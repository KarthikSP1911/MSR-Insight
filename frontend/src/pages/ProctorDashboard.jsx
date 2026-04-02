import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api.config";

/**
 * ProctorDashboard: Displays the list of students assigned to a proctor.
 * Integrated with the new proctor_student_map schema and academic year support.
 */
const ProctorDashboard = () => {
  const { proctorId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [academicYear, setAcademicYear] = useState("2027"); // Matches DB format

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const sessionId = localStorage.getItem("proctorSessionId");

        if (!sessionId) {
          navigate("/proctor-login");
          return;
        }

        // Fetch students for the selected academic year
        const response = await axios.get(`${API_BASE_URL}/api/proctor/${proctorId}/dashboard?academicYear=${academicYear}`, {
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
  }, [proctorId, academicYear, navigate]);

  const handleStudentClick = (usn) => {
    navigate(`/proctor/${proctorId}/student/${usn.toUpperCase()}`);
  };

  if (loading) {
    return (
      <div className="container fade-in" style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
        <p>Loading assigned students for {academicYear}...</p>
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
    <div className="container fade-in" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
      <header style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-xs)' }}>Proctor Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Managing {students.length} assigned students for {academicYear}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
             <select 
                value={academicYear} 
                onChange={(e) => setAcademicYear(e.target.value)}
                style={{ 
                    background: 'var(--bg-secondary)', 
                    color: 'white', 
                    border: '1px solid var(--border-subtle)', 
                    padding: '8px 12px', 
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none'
                }}
            >
                <option value="2027">2027</option>
                <option value="2028">2028</option>
            </select>
        </div>
      </header>

      <div className="dashboard-grid">
        {students.map((student) => (
          <div
            key={student.usn}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              height: '100%',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
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
                  <span style={{ fontWeight: '600' }}>{student.semester || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Section</span>
                  <span style={{ fontWeight: '600' }}>{student.section || 'N/A'}</span>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              View Full Profile
            </button>
          </div>
        ))}

        {students.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-xl)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No students assigned to your dashboard for {academicYear}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProctorDashboard;
