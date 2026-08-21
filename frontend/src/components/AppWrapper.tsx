"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import Navbar from "@/components/navbar/Navbar";
import InboxPanel from "@/components/dashboard/InboxPanel";
import AgentPanel from "@/components/dashboard/AgentPanel";
import { API_BASE_URL } from "@/config/api.config";
import { AppProvider, useAppContext, Alert } from "@/lib/AppContext";
import QueryProvider from "@/lib/QueryProvider";

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReportPage = pathname.includes("/report/");
  const isStudentDashboard = pathname.startsWith("/student/dashboard");
  const { academicYear, setAcademicYear, inboxOpen, setInboxOpen, alerts, setAlerts, agentPanelOpen, setAgentPanelOpen } = useAppContext();
  const [agentAlertCount, setAgentAlertCount] = useState(0);

  const isProctorRoute = pathname.startsWith("/proctor/") && !pathname.includes("login") && !isReportPage;
  const proctorIdMatch = pathname.match(/^\/proctor\/([^\/]+)/);
  const currentProctorId = isProctorRoute && proctorIdMatch ? proctorIdMatch[1] : null;

  // Fetch the Agentic AI's unresolved alert count for the navbar badge --
  // independent of AgentPanel's own alert fetch, which only runs while open.
  useEffect(() => {
    if (!currentProctorId) return;
    const fetchAgentAlertCount = async () => {
      try {
        const sessionId = localStorage.getItem("proctorSessionId");
        const res = await axios.get(`${API_BASE_URL}/api/agent/${currentProctorId}/alerts`, {
          headers: { "x-session-id": sessionId },
        });
        setAgentAlertCount((res.data?.data || []).length);
      } catch (err) {
        console.error("[App] Failed to fetch agent alert count:", err);
      }
    };
    fetchAgentAlertCount();
  }, [currentProctorId]);

  // Keep the agent panel and inbox mutually exclusive -- only one drawer open at a time.
  useEffect(() => {
    if (agentPanelOpen) setInboxOpen(false);
  }, [agentPanelOpen, setInboxOpen]);
  useEffect(() => {
    if (inboxOpen) setAgentPanelOpen(false);
  }, [inboxOpen, setAgentPanelOpen]);

  // Fetch live notifications for Proctor
  useEffect(() => {
    const isProctorView =
      pathname.startsWith("/proctor/") &&
      !pathname.includes("login") &&
      !isReportPage;
    
    // Extract proctorId from path /proctor/[proctorId]/...
    const match = pathname.match(/^\/proctor\/([^\/]+)/);
    const currentProctorId = match ? match[1] : null;

    if (!isProctorView || !currentProctorId) return;

    const cacheKey = `alerts-${currentProctorId}-${academicYear}`;

    const fetchAlerts = async () => {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setAlerts(JSON.parse(cached));
          return;
        }

        const sessionId = localStorage.getItem("proctorSessionId");
        const url = `${API_BASE_URL}/api/notifications/${currentProctorId}?academicYear=${academicYear}`;

        const response = await axios.get(url, { headers: { "x-session-id": sessionId } });
        const groupedData = response.data.data || response.data;

        if (!Array.isArray(groupedData)) {
          setAlerts([]);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const flattened: Alert[] = [];

        groupedData.forEach((group: any) => {
          if (!group.subjects || !Array.isArray(group.subjects)) return;
          group.subjects.forEach((subj: any) => {
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

        sessionStorage.setItem(cacheKey, JSON.stringify(flattened));
        setAlerts(flattened);
      } catch (err: any) {
        console.error("[App] Fetch failed:", err.response?.data?.message || err.message);
      }
    };

    fetchAlerts();
  }, [pathname, academicYear, isReportPage, setAlerts]);

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const isHomePage = pathname === "/";

  // Manage body scroll
  useEffect(() => {
    if (isReportPage || inboxOpen || agentPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isReportPage, inboxOpen, agentPanelOpen]);

  return (
    <div className="app-wrapper">
      {!isReportPage && !isStudentDashboard && !isHomePage && (
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
          agentPanelOpen={agentPanelOpen}
          onToggleAgentPanel={() => setAgentPanelOpen(!agentPanelOpen)}
          agentAlertCount={agentAlertCount}
        />
      )}

      <InboxPanel
        isOpen={inboxOpen}
        onClose={() => setInboxOpen(false)}
        alerts={alerts}
        onRemove={removeAlert}
      />

      {currentProctorId && (
        <AgentPanel
          proctorId={currentProctorId}
          isOpen={agentPanelOpen}
          onClose={() => setAgentPanelOpen(false)}
          onAlertCountChange={setAgentAlertCount}
        />
      )}

      <main className="content">
        {children}
      </main>
    </div>
  );
}

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppProvider>
        <AppContent>{children}</AppContent>
      </AppProvider>
    </QueryProvider>
  );
}
