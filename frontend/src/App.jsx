import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
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
  const isReportPage = location.pathname.startsWith("/report/");
  const isAuthPage = location.pathname.includes("login");

  const handleDownloadPDF = () => {
    // ... existing logic
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">SmartReport</Link>
      </div>
      <div className="nav-actions">
        {!isAuthPage && (
          <>
            <Link to="/student-login" className="nav-link-simple" style={{ marginRight: '15px', color: '#94a3b8', textDecoration: 'none' }}>
              Student Login
            </Link>
            <Link to="/proctor-login" className="nav-link-simple" style={{ marginRight: '20px', color: '#94a3b8', textDecoration: 'none' }}>
              Proctor Login
            </Link>
          </>
        )}
        {isReportPage ? (
          <button onClick={handleDownloadPDF} className="generate-btn">
            Generate Report
          </button>
        ) : (
          <Link to="/report/1MS24IS400" className="generate-btn">
            Generate Report
          </Link>
        )}
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
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/proctor-login" element={<ProctorLogin />} />
            <Route path="/proctor/:proctorId/dashboard" element={<ProctorDashboard />} />
            <Route path="/proctor/:proctorId/proctee/:studentId" element={<ProcteeDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
