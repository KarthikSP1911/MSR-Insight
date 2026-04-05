import React, { useState, useEffect } from "react";
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
    <nav className="navbar" style={(isStudentDashboard || isProctorView) ? { borderBottom: '1px solid var(--border-subtle)', background: 'rgba(13, 17, 23, 0.8)', backdropFilter: 'blur(12px)' } : {}}>
      <div className="container" style={(isStudentDashboard || isProctorView) ? { maxWidth: '100%', padding: '0 48px' } : {}}>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src="/logo-icon.svg" alt="Smart Report Logo" style={{ height: '32px', width: 'auto' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Smart Report</span>
          </Link>
          {isProctorView && !isReportPage && proctorId && (
            <div style={{ marginLeft: '20px', paddingLeft: '20px', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Proctor</span>
              <span style={{ color: '#F8FAFC', fontWeight: '600', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{proctorId}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div className="navbar-academic-setup" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Year</span>
                <div style={{ width: '120px' }}>
                  <CustomDropdown 
                    options={academicYearOptions} 
                    value={academicYear} 
                    onChange={setAcademicYear} 
                    placeholder="2027"
                  />
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="btn-logout"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
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
              <button 
                onClick={handleLogout} 
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
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
      <AppContent academicYear={academicYear} setAcademicYear={setAcademicYear} />
    </Router>
  );
}

function AppContent({ academicYear, setAcademicYear }) {
  const location = useLocation();
  const isReportPage = location.pathname.includes("/report/");

  // Manage body scroll to prevent dual-scrollbar (inset) issue
  useEffect(() => {
    if (isReportPage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isReportPage]);

  return (
    <div className="app-wrapper" style={{ paddingTop: isReportPage ? '0' : 'var(--nav-height)' }}>
      {!isReportPage && <Navbar academicYear={academicYear} setAcademicYear={setAcademicYear} />}
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
  );
}

export default App;
