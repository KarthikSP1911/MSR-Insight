"use client";

import React from "react";

interface Alert {
  id: string;
  message: string;
  time: string;
  type: string;
  isPinned: boolean;
}

interface InboxPanelProps {
  alerts: Alert[];
  onRemove: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const InboxPanel: React.FC<InboxPanelProps> = ({ alerts, onRemove, isOpen, onClose }) => {
  // Group flat subject-level alerts by student name.
  const grouped = React.useMemo(() => {
    const map = new Map<string, { student: string | null; subjects: string[]; ids: string[]; time: string }>();
    alerts.forEach(alert => {
      // Skip summary alerts
      if (alert.message.includes('has low attendance in')) return;

      // Parse: "STUDENT NAME - Subject is 67%"
      const dashIdx = alert.message.indexOf(' - ');
      if (dashIdx === -1) {
        // Info/system alerts
        if (!map.has('__system__')) {
          map.set('__system__', { student: null, subjects: [], ids: [], time: alert.time });
        }
        map.get('__system__')?.subjects.push(alert.message);
        map.get('__system__')?.ids.push(alert.id);
        return;
      }

      const studentName = alert.message.slice(0, dashIdx).trim();
      const subjectDetail = alert.message.slice(dashIdx + 3).trim(); 

      if (!map.has(studentName)) {
        map.set(studentName, { student: studentName, subjects: [], ids: [], time: alert.time });
      }
      map.get(studentName)?.subjects.push(subjectDetail);
      map.get(studentName)?.ids.push(alert.id);
    });
    return Array.from(map.values());
  }, [alerts]);

  const handleDismissGroup = (ids: string[]) => {
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
              <span className="inbox-badge">
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
              {grouped.map((group) => (
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

                  <span className="alert-time">{group.time}</span>
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
};

export default InboxPanel;
