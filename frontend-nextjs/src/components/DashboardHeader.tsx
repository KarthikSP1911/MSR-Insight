"use client";

import React from "react";

interface DashboardHeaderProps {
  name?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  name, 
  sectionTitle, 
  sectionSubtitle,
  children,
  actions
}) => {
  const displayName = name || "Student";

  return (
    <header className="dashboard-header-container">
      {/* Primary Welcome Block */}
      <div className="welcome-block">
        <h1 className="welcome-title">
          Welcome back, <span className="highlight-name">{displayName}</span>
        </h1>
        <p className="welcome-tagline">
          Here’s your current semester performance overview
        </p>
      </div>

      {/* Primary Divider (Moved Up) */}
      <hr className="header-divider-main" />

      {/* Secondary Section Header */}
      {(sectionTitle || sectionSubtitle || children || actions) && (
        <div className="section-header-block">
          <div className="section-header-top">
            <div className="section-header-titles">
              {sectionTitle && <h2 className="section-title">{sectionTitle}</h2>}
              {sectionSubtitle && <p className="section-subtitle">{sectionSubtitle}</p>}
            </div>
            {actions && <div className="section-header-actions">{actions}</div>}
          </div>
          {children && <div className="section-meta-wrap">{children}</div>}
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;

