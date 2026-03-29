import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Report from "./pages/Report";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import ProctorLogin from "./pages/ProctorLogin";
import ProctorDashboard from "./pages/ProctorDashboard";
import ProcteeDetails from "./pages/ProcteeDetails";
import AdminPanel from "./pages/AdminPanel";
import "./App.css";

function Navbar() {
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
  const proctorId = location.pathname.split('/')[2];
  const studentUsn = localStorage.getItem("studentUsn");

  const isStudentDashboard = isStudentView && !isReportPage;

  return (
    <nav className="navbar" style={isStudentDashboard ? { borderBottom: '1px solid var(--border-subtle)' } : {}}>
      <div className="container" style={isStudentDashboard ? { maxWidth: '100%', padding: '0 32px' } : {}}>
        <div className="nav-logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo-icon.svg" alt="Smart Report Logo" style={{ height: '32px', width: 'auto' }} />
            <span style={{ color: 'var(--text-primary)' }}>Smart Report</span>
          </Link>
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
            <>
              <span className="role-info">Proctor: {proctorId}</span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '1rem' }}>
                Logout
              </button>
            </>
          )}

          {/* Student Dashboard Context: Show USN and Logout */}
          {isStudentDashboard && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span className="role-info" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Student: <strong style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{studentUsn}</strong>
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
                Logout
              </button>
            </div>
          )}

          {/* Report Page: Navbar remains empty except for Logo (handled by conditional results above) */}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Navbar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report/:usn" element={<Report />} />
            <Route path="/proctor/:proctorId/report/:usn" element={<Report />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/proctor-login" element={<ProctorLogin />} />
            <Route path="/proctor/:proctorId/dashboard" element={<ProctorDashboard />} />
            <Route path="/proctor/:proctorId/student/:usn" element={<ProcteeDetails />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
