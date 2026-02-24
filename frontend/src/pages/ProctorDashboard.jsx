import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProctorDashboard.css";

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
        const response = await axios.get(`http://localhost:5000/api/proctor/${proctorId}/dashboard`);
        if (response.data.success) {
          setStudents(response.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch students");
      } finally {
        setLoading(false);
      }
    };

    if (proctorId) {
      fetchStudents();
    }
  }, [proctorId]);

  const handleStudentClick = (studentId) => {
    navigate(`/proctor/${proctorId}/proctee/${studentId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("proctorSessionId");
    localStorage.removeItem("proctorId");
    navigate("/proctor-login");
  };

  if (loading) {
    return (
      <div className="proctor-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading assigned students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="proctor-dashboard">
        <div className="error-container">
          <p>⚠️ {error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="proctor-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Proctor Dashboard</h1>
          <p className="auth-subtitle" style={{ margin: 0 }}>
            Managing {students.length} assigned students
          </p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Log out</button>
      </header>

      <div className="proctees-grid">
        {students.map((student) => (
          <div
            key={student.id}
            className="student-card"
            onClick={() => handleStudentClick(student.id)}
          >
            <h2>{student.name}</h2>
            <div className="student-info">
              <div className="info-row">
                <span className="info-label">USN</span>
                <span className="info-value">{student.usn}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Semester</span>
                <span className="info-value">{student.semester}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Section</span>
                <span className="info-value">{student.section}</span>
              </div>
            </div>
            <button className="view-btn">View Full Report</button>
          </div>
        ))}

        {students.length === 0 && (
          <div className="error-container" style={{ gridColumn: "1 / -1" }}>
            <p>No students assigned to your dashboard yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProctorDashboard;
