"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import CustomDropdown from "@/components/ui/CustomDropdown";

interface NavbarProps {
  academicYear: string;
  setAcademicYear: (year: string) => void;
  inboxOpen: boolean;
  setInboxOpen: (open: boolean) => void;
  notificationCount: number;
}

const Navbar: React.FC<NavbarProps> = ({
  academicYear,
  setAcademicYear,
  inboxOpen,
  setInboxOpen,
  notificationCount
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === "/";
  const isReportPage = pathname.includes("/report/");
  const isProctorView = pathname.startsWith("/proctor/") && !pathname.includes("login") && !isReportPage;
  const isProcteeDetailsView = isProctorView && pathname.includes("/student/");
  const isStudentView = pathname.startsWith("/student/") && !pathname.includes("login");
  const isAuthPage = pathname.includes("login");
  const isAdminPage = pathname.startsWith("/admin");

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  // Proctor ID extracted from URL if available
  const pathParts = pathname.split('/');
  const proctorId = pathParts[1] === 'proctor' ? pathParts[2] : null;
  const [studentUsn, setStudentUsn] = React.useState<string | null>(null);

  React.useEffect(() => {
    setStudentUsn(localStorage.getItem("studentUsn"));
  }, []);

  const academicYearOptions = [
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
  ];

  const isStudentDashboard = isStudentView && !isReportPage;

  return (
    <nav className={`navbar ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
      <div className="container navbar-container">
        <div className="nav-logo">
          {isProcteeDetailsView ? (
            <Link
              href={`/proctor/${proctorId}/dashboard`}
              className="navbar-back-link"
              onClick={() => setIsMenuOpen(false)}
            >
              
              <span>&lt;--  Back</span>
            </Link>
          ) : (
            <Link 
              href="/" 
              className="logo-link flex items-center gap-2" 
              aria-label="Go to MSR Insight home"
              onClick={() => setIsMenuOpen(false)}
            >
                <Image
                  src="/logo-icon.svg"
                  alt="MSR Insight logo"
                  className="logo-img"
                  width={24}
                  height={24}
                  priority
                />
                <span className="logo-text">MSR Insight</span>
            </Link>
          )}

          {isProctorView && !isReportPage && proctorId && !isProcteeDetailsView && (
            <div className="role-badge">
              <span className="badge-label">Proctor</span>
              <span className="badge-id">{proctorId}</span>
            </div>
          )}
        </div>

        <button 
          className="menu-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <div className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        <div className={`nav-actions ${isMenuOpen ? 'show' : ''}`}>
          {(isHome || isAuthPage) && !isReportPage && !isAdminPage && (
            <div className="auth-links">
              <Link 
                href="/student-login" 
                className={`nav-link ${isActive('/student-login') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Student Login
              </Link>
              <Link 
                href="/proctor-login" 
                className={`nav-link ${isActive('/proctor-login') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Proctor Login
              </Link>
            </div>
          )}

          {isProctorView && !isReportPage && (
            <div className="proctor-actions">
              <div className="setup-item">
                <span className="setup-label">Academic Year</span>
                <div className="setup-dropdown-wrap">
                  <CustomDropdown
                    options={academicYearOptions}
                    value={academicYear}
                    onChange={setAcademicYear}
                    placeholder="Year"
                  />
                </div>
              </div>

              <div className="divider"></div>

              <button
                className={`icon-btn ${inboxOpen ? 'active' : ''}`}
                onClick={() => setInboxOpen(!inboxOpen)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
              </button>

              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          )}

          {isStudentDashboard && (
            <div className="student-actions">
              <div className="user-meta">
                <span className="meta-label">Student</span>
                <span className="meta-value">{studentUsn}</span>
              </div>
              <div className="divider"></div>
              <button 
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }} 
                className="logout-btn"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {isMenuOpen && (
          <div className="mobile-overlay" onClick={() => setIsMenuOpen(false)}></div>
        )}
      </div>

    </nav>
  );
};

export default Navbar;
