"use client";

import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import "@/styles/SubjectDetail.css";

/* ── Assessment type maps ── */
const ASSESSMENT_ICONS: Record<string, string> = { T1: 'T1', T2: 'T2', AQ1: 'Q1', AQ2: 'Q2' };
const ASSESSMENT_COLORS: Record<string, { bg: string, color: string }> = {
  T1: { bg: 'rgba(173,198,255,0.12)', color: '#adc6ff' },
  T2: { bg: 'rgba(255,182,144,0.12)', color: '#ffb690' },
  AQ1: { bg: 'rgba(78,222,163,0.12)', color: '#4edea3' },
  AQ2: { bg: 'rgba(255,180,171,0.12)', color: '#ffb4ab' },
};
const ASSESSMENT_LABELS: Record<string, string> = {
  T1: 'Test 1', T2: 'Test 2', AQ1: 'Quiz 1', AQ2: 'Quiz 2'
};

const getMaxMarks = (type: string) => {
  if (type === 'T1' || type === 'T2') return 30;
  if (type === 'AQ1' || type === 'AQ2') return 10;
  return null;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="sd-chart-tooltip">
      <p className="sd-tooltip-label">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="sd-tooltip-row">
          <span className="sd-tooltip-dot" style={{ background: p.color }} />
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

interface SubjectDetailProps {
  subject: any;
  allSubjects: any[];
  onSubjectChange: (subject: any) => void;
  onBack: () => void;
}

const SubjectDetail: React.FC<SubjectDetailProps> = ({ subject, allSubjects, onSubjectChange, onBack }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [targetPct, setTargetPct] = useState(75);

  if (!subject) return null;

  /* ── Attendance data ── */
  const attendanceDetails = subject.attendance_details || {};
  const presentDates = attendanceDetails.present_dates || [];
  const absentDates = attendanceDetails.absent_dates || [];
  const presentCount = attendanceDetails.present ?? presentDates.length;
  const absentCount = attendanceDetails.absent ?? absentDates.length;
  const remainingCount = attendanceDetails.remaining ?? 0;
  const totalClasses = presentCount + absentCount + remainingCount;

  /* ── Attendance calculator ── */
  const T = targetPct / 100;
  const canMiss = Math.floor(presentCount + remainingCount - T * totalClasses);

  /* ── Calendar grid ── */
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++)    calendarDays.push(i);

  const getDateStatus = (day: number) => {
    const d = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
    if (presentDates.includes(d)) return 'present';
    if (absentDates.includes(d)) return 'absent';
    return 'remaining';
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const goToPrev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const goToNext = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  /* ── Chart data ── */
  const chartData = useMemo(() => {
    return (subject.assessments || [])
      .filter((a: any) => ['T1', 'T2', 'AQ1', 'AQ2'].includes(a.type))
      .map((a: any) => ({
        type: a.type,
        obtained: parseFloat(a.obtained_marks) || 0,
        classAvg: parseFloat(a.class_average) || 0,
      }));
  }, [subject]);

  const chartYMax = useMemo(() => {
    if (!chartData.length) return 30;
    const max = Math.max(...chartData.flatMap(d => [d.obtained, d.classAvg]));
    return Math.max(10, Math.ceil(max / 10) * 10);
  }, [chartData]);

  const tableAssessments = (subject.assessments || [])
    .filter((a: any) => ['T1', 'T2', 'AQ1', 'AQ2'].includes(a.type));

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const attColor = canMiss > 0 ? 'var(--accent-primary)' : canMiss === 0 ? '#ffb690' : '#EF4444';

  return (
    <div className="sd-page">
      <div className="sd-page-titlebar">
        <button className="sd-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="sd-subject-meta">
          <div className="sd-title-wrap">
            <h1 className="sd-subject-name">{subject.name}</h1>
            <div className="sd-switcher-container">
              <select 
                className="sd-subject-select"
                value={subject.code}
                onChange={(e) => {
                  const selected = allSubjects.find(s => s.code === e.target.value);
                  if (selected) onSubjectChange(selected);
                }}
              >
                {allSubjects.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              <div className="sd-switcher-trigger">
                Switch Subject <ChevronRight size={14} className="sd-switcher-icon" />
              </div>
            </div>
          </div>
          {subject.code && <span className="sd-subject-code">{subject.code}</span>}
        </div>
        <div className="sd-header-kpis">
          <div className="sd-kpi">
            <span className="sd-kpi-label">Attendance</span>
            <span className="sd-kpi-value" style={{ color: 'var(--accent-primary)' }}>
              {Math.round(subject.attendance || 0)}%
            </span>
          </div>
          <div className="sd-kpi">
            <span className="sd-kpi-label">CIE Score</span>
            <span className="sd-kpi-value" style={{ color: 'var(--text-primary)' }}>
              {subject.marks || 0}<span className="sd-kpi-max">/50</span>
            </span>
          </div>
        </div>
      </div>

      <div className="sd-2x2-grid">
        <section className="sd-card sd-calendar-card">
          <div className="sd-card-header">
            <h3 className="sd-card-title">Attendance</h3>
            <div className="sd-cal-nav">
              <button className="sd-cal-nav-btn" onClick={goToPrev}>
                <ChevronLeft size={18} />
              </button>
              <span className="sd-cal-month-label">
                {monthNames[currentMonth].slice(0, 3).toUpperCase()} {currentYear}
              </span>
              <button className="sd-cal-nav-btn" onClick={goToNext}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="sd-cal-weekdays">
            {dayLabels.map((d, i) => <div key={i} className="sd-cal-weekday">{d}</div>)}
          </div>

          <div className="sd-cal-days">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} className="sd-cal-day sd-cal-empty" />;
              const status = getDateStatus(day);
              return (
                <div key={idx} className={`sd-cal-day sd-cal-${status}${isToday(day) ? ' sd-cal-today' : ''}`}>
                  {day}
                </div>
              );
            })}
          </div>

          <div className="sd-cal-legend">
            <div className="sd-legend-item">
              <span className="sd-legend-dot" style={{ background: '#4edea3' }} />
              <span className="sd-legend-text">PRESENT</span>
              <span className="sd-legend-count sd-count-present">{presentCount}</span>
            </div>
            <div className="sd-legend-item">
              <span className="sd-legend-dot" style={{ background: '#ffb4ab' }} />
              <span className="sd-legend-text">ABSENT</span>
              <span className="sd-legend-count sd-count-absent">{absentCount}</span>
            </div>
            <div className="sd-legend-item">
              <span className="sd-legend-dot" style={{ background: '#32353c' }} />
              <span className="sd-legend-text">REMAINING</span>
              <span className="sd-legend-count sd-count-remaining">{remainingCount}</span>
            </div>
          </div>
        </section>

        <section className="sd-card sd-calc-card">
          <div className="sd-card-header">
            <div>
              <h3 className="sd-card-title">Attendance Calculator</h3>
              <p className="sd-card-subtitle">Track your attendance threshold</p>
            </div>
            <div className="sd-att-target-pills">
              {[65, 75, 85].map(pct => (
                <button
                  key={pct}
                  className={`sd-target-pill ${targetPct === pct ? 'sd-target-pill-active' : ''}`}
                  onClick={() => setTargetPct(pct)}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="sd-calc-stat-row">
            <div className="sd-calc-stat">
              <span className="sd-calc-stat-label">Current</span>
              <span className="sd-calc-stat-val" style={{ color: attColor }}>
                {Math.round(subject.attendance || 0)}%
              </span>
            </div>
            <div className="sd-calc-stat-divider" />
            <div className="sd-calc-stat">
              <span className="sd-calc-stat-label">Target</span>
              <span className="sd-calc-stat-val" style={{ color: '#ffb690' }}>{targetPct}%</span>
            </div>
            <div className="sd-calc-stat-divider" />
            <div className="sd-calc-stat">
              <span className="sd-calc-stat-label">Total</span>
              <span className="sd-calc-stat-val" style={{ color: '#c6c6cd' }}>{totalClasses}</span>
            </div>
          </div>

          <div className="sd-att-progress-wrap">
            <div className="sd-att-progress-bar">
              <div
                className="sd-att-progress-fill"
                style={{
                  width: `${Math.min(100, Math.round(subject.attendance || 0))}%`,
                  background: attColor
                }}
              />
              <div
                className="sd-att-progress-target"
                style={{ left: `${Math.min(targetPct, 99)}%` }}
                title={`${targetPct}% threshold`}
              />
            </div>
            <div className="sd-att-progress-labels">
              <span style={{ color: attColor }}>{Math.round(subject.attendance || 0)}% current</span>
              <span style={{ color: '#c6c6cd' }}>{targetPct}% target</span>
            </div>
          </div>

          {totalClasses === 0 ? (
            <p className="sd-att-calc-na">No attendance data available</p>
          ) : canMiss > 0 ? (
            <div className="sd-att-result sd-att-result-ok">
              <div className="sd-att-result-icon">✓</div>
              <div>
                <p className="sd-att-result-main">
                  You can miss <strong>{canMiss}</strong> more class{canMiss !== 1 ? 'es' : ''}
                </p>
                <p className="sd-att-result-sub">and still maintain {targetPct}% attendance</p>
              </div>
            </div>
          ) : canMiss === 0 ? (
            <div className="sd-att-result sd-att-result-warn">
              <div className="sd-att-result-icon">!</div>
              <div>
                <p className="sd-att-result-main">No more absences allowed</p>
                <p className="sd-att-result-sub">Attend all remaining classes to stay at {targetPct}%</p>
              </div>
            </div>
          ) : (
            <div className="sd-att-result sd-att-result-danger">
              <div className="sd-att-result-icon">✗</div>
              <div>
                <p className="sd-att-result-main">
                  Need <strong>{Math.abs(canMiss)}</strong> more class{Math.abs(canMiss) !== 1 ? 'es' : ''}
                </p>
                <p className="sd-att-result-sub">
                  {Math.abs(canMiss) <= remainingCount
                    ? `Attend next ${Math.abs(canMiss)} classes without fail to reach ${targetPct}%`
                    : `Cannot reach ${targetPct}% — not enough classes remaining`}
                </p>
              </div>
            </div>
          )}

          <div className="sd-calc-breakdown">
            <div className="sd-calc-breakdown-row">
              <span>Classes attended</span>
              <span style={{ color: '#4edea3', fontWeight: 700 }}>{presentCount}</span>
            </div>
            <div className="sd-calc-breakdown-row">
              <span>Classes missed</span>
              <span style={{ color: '#ffb4ab', fontWeight: 700 }}>{absentCount}</span>
            </div>
            <div className="sd-calc-breakdown-row">
              <span>Classes remaining</span>
              <span style={{ color: '#c6c6cd', fontWeight: 700 }}>{remainingCount}</span>
            </div>
            <div className="sd-calc-breakdown-row sd-calc-breakdown-total">
              <span>Total classes</span>
              <span style={{ color: '#e1e2eb', fontWeight: 800 }}>{totalClasses}</span>
            </div>
          </div>
        </section>

        <section className="sd-card sd-chart-card">
          <div className="sd-card-header">
            <div>
              <h3 className="sd-card-title">Test Scores</h3>
              <p className="sd-card-subtitle">Assessment Performance Analysis</p>
            </div>
            <div className="sd-chart-legend">
              <div className="sd-chart-legend-item">
                <span className="sd-chart-legend-line" style={{ background: 'var(--accent-primary)', boxShadow: '0 0 5px var(--accent-glow)' }} />
                <span className="sd-chart-legend-label">YOUR MARKS</span>
              </div>
              <div className="sd-chart-legend-item">
                <span className="sd-chart-legend-line" style={{ background: 'var(--text-muted)' }} />
                <span className="sd-chart-legend-label">CLASS AVG</span>
              </div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="sd-chart-area">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 10, right: 16, left: -20, bottom: 8 }}>
                  <defs>
                    <filter id="sd-glow-blue">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="sd-glow-orange">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(225,226,235,0.05)" horizontal vertical={false} />
                  <XAxis
                    dataKey="type"
                    stroke="rgba(198,198,205,0.4)"
                    tick={{ fill: 'rgba(198,198,205,0.4)', fontSize: 10, fontWeight: 700 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    domain={[0, chartYMax]}
                    stroke="rgba(198,198,205,0.4)"
                    tick={{ fill: 'rgba(198,198,205,0.4)', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone" dataKey="obtained" stroke="var(--accent-primary)" strokeWidth={3}
                    name="Your Marks" dot={{ fill: 'var(--accent-primary)', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'var(--accent-primary)', strokeWidth: 0 }}
                    filter="url(#sd-glow-blue)"
                  />
                  <Line
                    type="monotone" dataKey="classAvg" stroke="var(--text-muted)" strokeWidth={2}
                    name="Class Avg" dot={{ fill: 'var(--text-muted)', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: 'var(--text-muted)', strokeWidth: 0 }}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="sd-no-data"><p>No assessment data available yet</p></div>
          )}
        </section>

        <section className="sd-card sd-table-card">
          <div className="sd-table-header">
            <h3 className="sd-card-title">Recent Assessments</h3>
          </div>
          <div className="sd-table-scroll">
            <table className="sd-table">
              <thead>
                <tr>
                  <th className="sd-th">Assessment</th>
                  <th className="sd-th sd-th-center">Your Marks</th>
                  <th className="sd-th sd-th-center">Class Avg</th>
                  <th className="sd-th sd-th-right">Diff</th>
                </tr>
              </thead>
              <tbody>
                {tableAssessments.length > 0 ? tableAssessments.map((a: any, idx: number) => {
                  const obtained = parseFloat(a.obtained_marks) || 0;
                  const classAvg = parseFloat(a.class_average) || 0;
                  const diff = obtained - classAvg;
                  const maxMarks = a.max_marks || getMaxMarks(a.type) || '—';
                  const colors = ASSESSMENT_COLORS[a.type] || { bg: 'rgba(198,198,205,0.12)', color: '#c6c6cd' };

                  return (
                    <tr key={idx} className="sd-tr">
                      <td className="sd-td">
                        <div className="sd-assessment-cell">
                          <div className="sd-assessment-icon" style={{ background: colors.bg, color: colors.color }}>
                            {ASSESSMENT_ICONS[a.type] || a.type}
                          </div>
                          <div>
                            <p className="sd-assessment-name">{ASSESSMENT_LABELS[a.type] || a.type}</p>
                            <p className="sd-assessment-sub">Out of {maxMarks}</p>
                          </div>
                        </div>
                      </td>
                      <td className="sd-td sd-td-center">
                        <span className="sd-marks-value">{obtained}/{maxMarks}</span>
                      </td>
                      <td className="sd-td sd-td-center">
                        <span className="sd-avg-value">{classAvg.toFixed(1)}/{maxMarks}</span>
                      </td>
                      <td className="sd-td sd-td-right">
                        <span className={`sd-diff-badge ${diff > 0 ? 'sd-diff-pos' : diff < 0 ? 'sd-diff-neg' : 'sd-diff-eq'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="sd-table-empty">No assessment data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SubjectDetail;
