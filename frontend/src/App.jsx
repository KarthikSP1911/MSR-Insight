import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Report from "./pages/Report";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import ProctorLogin from "./pages/ProctorLogin";
import ProctorDashboard from "./pages/ProctorDashboard";
import ProcteeDetails from "./pages/ProcteeDetails";
import "./App.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";
  const isReportPage = location.pathname.includes("/report/");
  const isProctorView = location.pathname.startsWith("/proctor/") && !location.pathname.includes("login") && !isReportPage;
  const isStudentView = location.pathname.startsWith("/student/") && !location.pathname.includes("login");
  const isAuthPage = location.pathname.includes("login");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Proctor ID extracted from URL if available
  const proctorId = location.pathname.split('/')[2];
  const studentUsn = localStorage.getItem("studentUsn");

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">
          Smart<span>Report</span>
        </Link>
      </div>

      <div className="nav-actions">
        {/* Home & Login Pages: Show simple entry links */}
        {(isHome || isAuthPage) && !isReportPage && (
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
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              Logout
            </button>
          </>
        )}

        {/* Student Dashboard Context: Show USN and Logout */}
        {isStudentView && !isReportPage && (
          <>
            <span className="role-info">Student: {studentUsn}</span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              Logout
            </button>
          </>
        )}

        {/* Report Page: Navbar remains empty except for Logo (handled by conditional results above) */}
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
            <Route path="/proctor/:proctorId/report/:usn" element={<Report />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/proctor-login" element={<ProctorLogin />} />
            <Route path="/proctor/:proctorId/dashboard" element={<ProctorDashboard />} />
            <Route path="/proctor/:proctorId/student/:usn" element={<ProcteeDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
