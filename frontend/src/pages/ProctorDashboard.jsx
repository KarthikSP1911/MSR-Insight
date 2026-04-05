import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import CustomDropdown from "../components/CustomDropdown";
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

  // Returns white or black text for readability against any background
  const getContrastColor = (hex) => {
    if (!hex) return '#FFFFFF';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Perceived luminance formula (WCAG)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 128 ? '#000000' : '#FFFFFF';
  };

  const getAttendanceStyle = (attendance) => {
    if (attendance === null || attendance === undefined) return { color: null, textColor: '#FFFFFF', style: {} };
    let color;
    if (attendance < 50)       color = '#4B0000';
    else if (attendance < 65)  color = '#FF0000';
    else if (attendance < 75)  color = '#FFA500';
    else if (attendance < 85)  color = '#FFD700';
    else if (attendance < 95)  color = '#4CAF50';
    else                       color = '#2ECC71';

    const textColor = getContrastColor(color);

    return {
      color,
      textColor,
      style: {
        borderLeft: `4px solid ${color}`,
        background: `linear-gradient(to right, ${color}12 0%, #0F172A 40%)`
      }
    };
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
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="proctor-dashboard fade-in">
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
          const att = student.lowestAttendance;
          console.log(`[Card] ${student.usn} — lowestAttendance: ${att}`);
          const attendanceData = getAttendanceStyle(att);
          
          return (
            <div
              key={student.usn}
              className="student-card"
              style={attendanceData.style}
              onClick={() => handleStudentClick(student.usn)}
            >
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 className="student-name">{student.name}</h2>
                {att !== null && att !== undefined && (
                  <span style={{
                    backgroundColor: attendanceData.color,
                    color: attendanceData.textColor,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    marginLeft: '12px',
                    letterSpacing: '0.02em'
                  }}>
                    {att !== null ? `${att}%` : 'N/A'}
                  </span>
                )}
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
                <span>View Full Profile</span>
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
    </div>
  );
};

export default ProctorDashboard;

