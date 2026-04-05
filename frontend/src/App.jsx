import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home";
import Report from "./pages/Report";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import ProctorLogin from "./pages/ProctorLogin";
import ProctorDashboard from "./pages/ProctorDashboard";
import ProcteeDetails from "./pages/ProcteeDetails";
import AdminPanel from "./pages/AdminPanel";
import CustomDropdown from "./components/CustomDropdown";
import { API_BASE_URL } from "./config/api.config";
import "./App.css";

function Navbar({ academicYear, setAcademicYear, inboxOpen, setInboxOpen, notificationCount }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";
  const isReportPage = location.pathname.includes("/report/");
  const isProctorView = location.pathname.startsWith("/proctor/") && !location.pathname.includes("login") && !isReportPage;
  const isProcteeDetailsView = isProctorView && location.pathname.includes("/student/");
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
      <div className="container" style={(isStudentDashboard || isProctorView) ? { maxWidth: '100%', padding: isProcteeDetailsView ? '0 80px' : '0 48px' } : {}}>
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
          {isProcteeDetailsView ? (
            <Link 
              to={`/proctor/${proctorId}/dashboard`} 
              className="navbar-back-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#9CA3AF', /* Neutral Gray 400 */
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                padding: '0', /* No padding to keep it inline */
                borderRadius: '0',
                transition: 'all 0.2s ease',
                background: 'none'
              }}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ width: '18px', height: '18px' }}
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </Link>
          ) : (
            <>
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
            </>
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

              {/* Notification Bell */}
              <button 
                className={`nav-icon-btn ${inboxOpen ? 'active' : ''}`} 
                onClick={() => setInboxOpen(!inboxOpen)}
                style={{ position: 'relative' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
              </button>

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

function InboxPanel({ alerts, onRemove, isOpen, onClose }) {
  // Group flat subject-level alerts by student name.
  // Skip summary alerts ("has low attendance in X subjects").
  const grouped = React.useMemo(() => {
    const map = new Map();
    alerts.forEach(alert => {
      // Skip summary alerts
      if (alert.message.includes('has low attendance in')) return;

      // Parse: "STUDENT NAME - Subject is 67%"
      const dashIdx = alert.message.indexOf(' - ');
      if (dashIdx === -1) {
        // Info/system alerts — add as-is under a special key
        if (!map.has('__system__')) {
          map.set('__system__', { student: null, subjects: [], ids: [], time: alert.time });
        }
        map.get('__system__').subjects.push(alert.message);
        map.get('__system__').ids.push(alert.id);
        return;
      }

      const studentName = alert.message.slice(0, dashIdx).trim();
      const subjectDetail = alert.message.slice(dashIdx + 3).trim(); // "Subject is 67%"

      if (!map.has(studentName)) {
        map.set(studentName, { student: studentName, subjects: [], ids: [], time: alert.time });
      }
      map.get(studentName).subjects.push(subjectDetail);
      map.get(studentName).ids.push(alert.id);
    });
    return Array.from(map.values());
  }, [alerts]);

  const handleDismissGroup = (ids) => {
    ids.forEach(id => onRemove(id));
  };

  return (
    <>
      <div className={`inbox-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`inbox-panel ${isOpen ? 'open' : ''}`}>
        <div className="inbox-header">
          <div className="inbox-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span>Inbox</span>
            {grouped.length > 0 && (
              <span style={{ marginLeft: '8px', background: 'rgba(255,138,0,0.15)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
                {grouped.length}
              </span>
            )}
          </div>
          <button className="inbox-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="inbox-content">
          {grouped.length > 0 ? (
            <div className="alerts-list">
              {grouped.map((group, idx) => (
                <div key={group.student || '__system__'} className="alert-group-card">
                  <div className="alert-group-header">
                    {group.student ? (
                      <span className="alert-student-name">{group.student}</span>
                    ) : (
                      <span className="alert-student-name" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '500' }}>System</span>
                    )}
                    <button
                      className="alert-action-btn remove"
                      onClick={() => handleDismissGroup(group.ids)}
                      title="Dismiss all"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>

                  <ul className="alert-subject-list">
                    {group.subjects.map((subj, i) => (
                      <li key={i} className="alert-subject-item">• {subj}</li>
                    ))}
                  </ul>

                  {group.student && group.subjects.length > 1 && (
                    <div className="alert-summary-line">
                      ↳ Low in {group.subjects.length} subjects
                    </div>
                  )}

                  <span className="alert-time" style={{ display: 'block', marginTop: '8px' }}>{group.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="inbox-empty">
              <p>Nothing to show</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AppContent({ academicYear, setAcademicYear }) {
  const location = useLocation();
  const isReportPage = location.pathname.includes("/report/");
  const [inboxOpen, setInboxOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Fetch live notifications for Proctor
  useEffect(() => {
    const isProctorView =
      location.pathname.startsWith("/proctor/") &&
      !location.pathname.includes("login") &&
      !isReportPage;
    const pathParts = location.pathname.split('/');
    const currentProctorId = pathParts[1] === 'proctor' ? pathParts[2] : null;

    if (!isProctorView || !currentProctorId) return;

    const cacheKey = `alerts-${currentProctorId}-${academicYear}`;

    const fetchAlerts = async () => {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          console.log(`[App] Cache hit for ${cacheKey}`);
          setAlerts(JSON.parse(cached));
          return;
        }

        const sessionId = localStorage.getItem("proctorSessionId");
        const url = `${API_BASE_URL}/api/notifications/${currentProctorId}?academicYear=${academicYear}`;
        console.log(`[App] Fetching: ${url}`);

        const response = await axios.get(url, { headers: { "x-session-id": sessionId } });

        console.log("RAW API:", response.data);

        const groupedData = response.data.data || response.data;
        console.log("GROUPED:", groupedData);

        if (!Array.isArray(groupedData)) {
          console.warn("[App] Not an array:", typeof groupedData);
          setAlerts([]);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const flattened = [];

        groupedData.forEach(group => {
          if (!group.subjects || !Array.isArray(group.subjects)) return;
          group.subjects.forEach(subj => {
            flattened.push({
              id: `alert-${group.usn}-${subj.name.replace(/\s+/g, '-')}-${today}`,
              message: `${group.student} - ${subj.name} is ${subj.attendance}%`,
              time: "Just now",
              type: "warning",
              isPinned: false
            });
          });
          if (group.count > 1) {
            flattened.push({
              id: `summary-${group.usn}-${today}`,
              message: `${group.student} has low attendance in ${group.count} subjects`,
              time: "Just now",
              type: "warning",
              isPinned: false
            });
          }
        });

        console.log("FINAL ALERTS:", flattened);
        sessionStorage.setItem(cacheKey, JSON.stringify(flattened));
        setAlerts(flattened);
      } catch (err) {
        console.error("[App] Fetch failed:", err.response?.data?.message || err.message);
      }
    };

    fetchAlerts();
  }, [location.pathname, academicYear]);

  const togglePin = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Manage body scroll (for report page and inbox overlay)
  useEffect(() => {
    if (isReportPage || inboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isReportPage, inboxOpen]);

  return (
    <div className="app-wrapper" style={{ paddingTop: isReportPage ? '0' : 'var(--nav-height)' }}>
      {!isReportPage && (
        <Navbar 
          academicYear={academicYear} 
          setAcademicYear={setAcademicYear} 
          inboxOpen={inboxOpen}
          setInboxOpen={setInboxOpen}
          notificationCount={[
            ...new Set(
              alerts
                .filter(a => a.message.includes(' - ') && !a.message.includes('has low attendance in'))
                .map(a => a.message.slice(0, a.message.indexOf(' - ')).trim())
            )
          ].length}
        />
      )}
      
      <InboxPanel 
        isOpen={inboxOpen} 
        onClose={() => setInboxOpen(false)} 
        alerts={alerts}
        onRemove={removeAlert}
      />

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
