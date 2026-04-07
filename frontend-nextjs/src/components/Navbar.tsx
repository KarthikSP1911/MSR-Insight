"use client";

import React from "react";
import Link from "next/link";
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
  const studentUsn = typeof window !== 'undefined' ? localStorage.getItem("studentUsn") : null;

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
              href={`/proctor/${proctorId}/dashboard`} 
              className="navbar-back-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#9CA3AF',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                padding: '0',
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
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
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
          {(isHome || isAuthPage) && !isReportPage && !isAdminPage && (
            <>
              <Link
                href="/student-login"
                className={`nav-link ${isActive('/student-login') ? 'active' : ''}`}
              >
                Student Login
              </Link>
              <Link
                href="/proctor-login"
                className={`nav-link ${isActive('/proctor-login') ? 'active' : ''}`}
              >
                Proctor Login
              </Link>
            </>
          )}

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

          {isStudentDashboard && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span className="role-info" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Student: <strong style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{studentUsn}</strong>
              </span>
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
