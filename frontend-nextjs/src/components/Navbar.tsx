"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import CustomDropdown from "./CustomDropdown";

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
              aria-label="Go to Smart Report home"
              onClick={() => setIsMenuOpen(false)}
            >
                <Image
                  src="/logo-icon.svg"
                  alt="Smart Report logo"
                  className="logo-img"
                  width={24}
                  height={24}
                  priority
                />
                <span className="logo-text">Smart Report</span>
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

      <style jsx>{`
        .navbar {
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #1F1F1F;
          height: 64px;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 50;
          width: 100%;
        }

        .navbar-container {
          width: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .nav-logo {
          position: relative;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-link {
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          text-decoration: none;
          position: relative;
          white-space: nowrap;
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 8px 0;
          margin: 0;
          position: relative;
          z-index: 2;
          pointer-events: auto;
        }

        .logo-img {
          height: 24px;
          width: auto;
          display: block;
          flex-shrink: 0;
        }

        .logo-text {
          color: #EDEDED;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
          flex-shrink: 0;
          display: block;
          line-height: 1.25;
          pointer-events: none;
        }

        .navbar-back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #A1A1A1;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .navbar-back-link:hover {
          color: #EDEDED;
        }

        .role-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 20px;
          border-left: 1px solid #1F1F1F;
          height: 24px;
        }

        .badge-label {
          color: #737373;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-id {
          color: #EDEDED;
          font-size: 0.85rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .nav-actions {
          position: relative;
          z-index: 1;
          margin-right: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .auth-links {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .nav-link {
          color: #A1A1A1;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
          display: inline-flex;
          align-items: center;
          min-height: 36px;
          padding: 6px 12px;
          position: relative;
          z-index: 2;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .nav-link:hover {
          color: #EDEDED;
          background: rgba(255, 255, 255, 0.06);
        }

        .nav-link.active {
          color: #EDEDED;
          background: rgba(34, 211, 238, 0.18);
          border-color: rgba(34, 211, 238, 0.65);
          box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.15) inset, 0 4px 14px rgba(34, 211, 238, 0.2);
        }

        .nav-link::after {
          content: none;
        }

        .nav-link.active::after {
          content: none;
        }

        .proctor-actions, .student-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .setup-item, .user-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .setup-label, .meta-label {
          color: #737373;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .meta-value {
          color: #EDEDED;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .setup-dropdown-wrap {
          width: 120px;
        }

        .divider {
          width: 1px;
          height: 20px;
          background: #1F1F1F;
        }

        .icon-btn {
          background: none;
          border: none;
          color: #A1A1A1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          padding: 8px;
          border-radius: 8px;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #EDEDED;
        }

        .icon-btn.active {
          color: #00ADB5;
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #00ADB5;
          color: #0A0A0A;
          font-size: 10px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 99px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0A0A0A;
        }

        .logout-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #EF4444;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          z-index: 101;
        }

        .hamburger {
          width: 24px;
          height: 18px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .hamburger span {
          display: block;
          width: 100%;
          height: 2px;
          background-color: #EDEDED;
          border-radius: 2px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hamburger.open span:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
        }

        @media (max-width: 1024px) {
          .navbar-container {
            padding: 0 20px;
          }
          
          .menu-toggle {
            display: block;
          }

          .nav-actions {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 280px;
            background: #0A0A0A;
            border-left: 1px solid #1F1F1F;
            flex-direction: column;
            padding: 80px 24px 24px;
            align-items: flex-start;
            gap: 32px;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 100;
            margin-right: 0;
          }

          .nav-actions.show {
            transform: translateX(0);
          }

          .auth-links, .proctor-actions, .student-actions {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
            gap: 16px;
          }

          .nav-link {
            width: 100%;
            padding: 12px 16px;
            font-size: 1rem;
          }

          .divider {
            width: 100%;
            height: 1px;
            margin: 4px 0;
          }

          .setup-item, .user-meta {
            width: 100%;
            justify-content: space-between;
          }

          .setup-dropdown-wrap {
            width: 140px;
          }

          .mobile-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 99;
          }

          .logout-btn {
            width: 100%;
            padding: 12px;
            text-align: center;
          }

          .role-badge {
            padding-left: 12px;
            gap: 4px;
          }
          
          .badge-label {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .navbar-container {
            padding: 0 16px;
          }
          
          .role-badge {
            border-left: none;
            padding-left: 0;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
