"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import CustomDropdown from "@/components/CustomDropdown";
import { useAppContext } from "@/lib/AppContext";
import "@/styles/ProctorDashboard.css";

export default function ProctorDashboard() {
  const params = useParams();
  const proctorId = params.proctorId as string;
  const router = useRouter();
  const { academicYear } = useAppContext();
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          router.push("/proctor-login");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/proctor/${proctorId}/dashboard?academicYear=${academicYear}`, {
          headers: { "x-session-id": sessionId }
        });

        if (response.data.success) {
          setStudents(response.data.data);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.clear();
          router.push("/proctor-login");
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
  }, [proctorId, academicYear, router]);

  const handleStudentClick = (usn: string) => {
    router.push(`/proctor/${proctorId}/student/${usn.toUpperCase()}`);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.usn.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSemester = semesterFilter === "All" || (student.semester && student.semester === semesterFilter);
      const matchesSection = sectionFilter === "All" || (student.section && student.section === sectionFilter);
      
      return matchesSearch && matchesSemester && matchesSection;
    });
  }, [students, searchTerm, semesterFilter, sectionFilter]);

  const getContrastColor = (hex: string) => {
    if (!hex) return '#FFFFFF';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 128 ? '#000000' : '#FFFFFF';
  };

  const getAttendanceStyle = (attendance: number | null) => {
    if (attendance === null || attendance === undefined) return { color: undefined, textColor: '#FFFFFF', style: {} };
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

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Fetching students...</p></div>;
  if (error) return <div className="error-container"><p>⚠️ {error}</p></div>;

  return (
    <div className="proctor-dashboard fade-in">
      <section className="filter-bar">
        <input className="input-field" type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <CustomDropdown options={[{value:"All", label:"Semester"}, {value:"Sem 1", label:"Sem 1"}]} value={semesterFilter} onChange={setSemesterFilter} />
      </section>

      <div className="proctees-grid grid-container">
        {filteredStudents.map((student) => {
          const att = student.lowestAttendance;
          const attendanceData = getAttendanceStyle(att);
          return (
            <div key={student.usn} className="student-card" style={attendanceData.style} onClick={() => handleStudentClick(student.usn)}>
              <div className="card-header">
                <h2>{student.name}</h2>
                {att !== null && <span style={{ backgroundColor: attendanceData.color, color: attendanceData.textColor }}>{att}%</span>}
              </div>
              <div className="card-body">USN: {student.usn} | Sem: {student.semester}</div>
              <div className="card-footer"><button className="view-btn">View Profile</button></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
