import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Report from "./pages/Report";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import ProctorLogin from "./pages/ProctorLogin";
import ProctorDashboard from "./pages/ProctorDashboard";
import ProcteeDetails from "./pages/ProcteeDetails";
import AdminPanel from "./pages/AdminPanel";
import CustomDropdown from "./components/CustomDropdown";
import "./App.css";

function Navbar({ academicYear, setAcademicYear }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";
  const isReportPage = location.pathname.includes("/report/");
  const isProctorView = location.pathname.startsWith("/proctor/") && !location.pathname.includes("login") && !isReportPage;
  const isStudentView = location.pathname.startsWith("/student/") && !location.pathname.includes("login");
  const isAuthPage = location.pathname.includes("login");
  const isAdminPage = location.pathname.startsWith("/admin");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Proctor ID extracted from URL if available
  const pathParts = location.pathname.split('/');
  const proctorId = pathParts[1] === 'proctor' ? pathParts[2] : null;
  const studentUsn = localStorage.getItem("studentUsn");

  const academicYearOptions = [
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
  ];

  const isStudentDashboard = isStudentView && !isReportPage;

  return (
    <nav className="navbar" style={(isStudentDashboard || isProctorView) ? { borderBottom: '1px solid var(--border-subtle)', background: '#0D1117' } : {}}>
      <div className="container" style={(isStudentDashboard || isProctorView) ? { maxWidth: '100%', padding: '0 160px' } : {}}>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src="/logo-icon.svg" alt="Smart Report Logo" style={{ height: '32px', width: 'auto' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '1.25rem' }}>Smart Report</span>
          </Link>
          {isProctorView && !isReportPage && proctorId && (
            <div style={{ marginLeft: '16px', paddingLeft: '16px', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Proctor: <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{proctorId}</span>
            </div>
          )}
        </div>

        <div className="nav-actions">
          {/* Home & Login Pages: Show simple entry links */}
          {(isHome || isAuthPage) && !isReportPage && !isAdminPage && (
            <>
              <Link
                to="/student-login"
                className={`nav-link ${isActive('/student-login') ? 'active' : ''}`}
              >
                Student Login
              </Link>
              <Link
                to="/proctor-login"
                className={`nav-link ${isActive('/proctor-login') ? 'active' : ''}`}
              >
                Proctor Login
              </Link>
            </>
          )}

          {/* Proctor Dashboard Context: Show ID and Logout */}
          {isProctorView && !isReportPage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div className="navbar-academic-setup" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Academic Year:</span>
                <div style={{ width: '140px' }}>
                  <CustomDropdown 
                    options={academicYearOptions} 
                    value={academicYear} 
                    onChange={setAcademicYear} 
                    placeholder="2027"
                  />
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1.5rem', fontSize: '0.95rem', background: '#2D3748', border: 'none', marginLeft: '8px' }}>
                Logout
              </button>
            </div>
          )}

          {/* Student Dashboard Context: Show USN and Logout */}
          {isStudentDashboard && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span className="role-info" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Student: <strong style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{studentUsn}</strong>
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.95rem' }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [academicYear, setAcademicYear] = useState("2027");

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar academicYear={academicYear} setAcademicYear={setAcademicYear} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report/:usn" element={<Report />} />
            <Route path="/proctor/:proctorId/report/:usn" element={<Report />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/proctor-login" element={<ProctorLogin />} />
            <Route path="/proctor/:proctorId/dashboard" element={<ProctorDashboard academicYear={academicYear} setAcademicYear={setAcademicYear} />} />
            <Route path="/proctor/:proctorId/student/:usn" element={<ProcteeDetails />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
