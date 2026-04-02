import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import "./ProctorDashboard.css";

/**
 * ProctorDashboard: Displays the list of students assigned to a proctor.
 * Refactored with plain CSS Grid for scalability and a dense, professional look.
 */
const ProctorDashboard = ({ academicYear, setAcademicYear }) => {
  const { proctorId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          navigate("/proctor-login");
          return;
        }

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

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.usn.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSemester = semesterFilter === "All" || (student.semester && student.semester === semesterFilter);
      const matchesSection = sectionFilter === "All" || (student.section && student.section === sectionFilter);
      const matchesStatus = statusFilter === "All"; 

      return matchesSearch && matchesSemester && matchesSection && matchesStatus;
    });
  }, [students, searchTerm, semesterFilter, sectionFilter, statusFilter]);

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
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="proctor-dashboard fade-in">
      <section className="filter-bar">
        <div className="filter-item search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search by Name or USN" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
            <option value="All">Semester</option>
            <option value="Sem 01">Sem 01</option>
            <option value="Sem 02">Sem 02</option>
            <option value="Sem 03">Sem 03</option>
            <option value="Sem 04">Sem 04</option>
            <option value="Sem 05">Sem 05</option>
            <option value="Sem 06">Sem 06</option>
            <option value="Sem 07">Sem 07</option>
            <option value="Sem 08">Sem 08</option>
          </select>
        </div>
        <div className="filter-item">
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="All">Section</option>
            <option value="Sec A">Sec A</option>
            <option value="Sec B">Sec B</option>
            <option value="Sec C">Sec C</option>
          </select>
        </div>
        <div className="filter-item">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">Performance Status</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="At Risk">At Risk</option>
          </select>
        </div>
      </section>

      <div className="proctees-grid grid-container">
        {filteredStudents.map((student) => (
          <div
            key={student.usn}
            className="student-card"
            onClick={() => handleStudentClick(student.usn)}
          >
            <div className="card-content">
              <h2 className="student-name">{student.name}</h2>
              <div className="student-info">
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
            <button className="view-btn">
              View Full Profile
            </button>
          </div>
        ))}

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
    </div>
  );
};

export default ProctorDashboard;

