import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import './SubjectDetail.css';

const SubjectDetail = ({ subject, onBack }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  if (!subject) return null;

  // Parse attendance dates
  const attendanceDetails = subject.attendance_details || {};
  const presentDates = attendanceDetails.present_dates || [];
  const absentDates = attendanceDetails.absent_dates || [];

  // Get available months from dates
  const getAvailableMonths = () => {
    const months = new Set();
    [...presentDates, ...absentDates].forEach(dateStr => {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        months.add(`${year}-${month}`);
      }
    });
    return Array.from(months).sort();
  };

  const availableMonths = getAvailableMonths();

  // Generate calendar for current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Helper to check if date is present/absent
  const getDateStatus = (day) => {
    const dateStr = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
    if (presentDates.includes(dateStr)) return 'present';
    if (absentDates.includes(dateStr)) return 'absent';
    return null;
  };

  // Navigate months
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Prepare bar chart data - only show T1, T2, AQ1, AQ2
  const chartData = useMemo(() => {
    const assessments = subject.assessments || [];
    const filtered = assessments.filter(a => 
      ['T1', 'T2', 'AQ1', 'AQ2'].includes(a.type)
    );
    return filtered.map(a => ({
      type: a.type,
      obtained: parseFloat(a.obtained_marks) || 0,
      classAvg: parseFloat(a.class_average) || 0
    }));
  }, [subject]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="subject-detail-page">
      {/* Header */}
      <div className="subject-detail-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back to Performance</span>
        </button>
        <div className="subject-header-content">
          <h1 className="subject-detail-title">{subject.name}</h1>
          <span className="subject-detail-code">{subject.code}</span>
        </div>
        <div className="subject-header-stats">
          <div className="header-stat">
            <span className="stat-label">Attendance</span>
            <span className="stat-value">{Math.round(subject.attendance || 0)}%</span>
          </div>
          <div className="header-stat">
            <span className="stat-label">CIE Score</span>
            <span className="stat-value">{subject.marks || 0}/50</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="subject-detail-grid">
        {/* Attendance Calendar Section */}
        <div className="subject-section attendance-section">
          <div className="section-header">
            <h2 className="section-title">Attendance Calendar</h2>
            <div className="attendance-summary">
              <div className="summary-item present">
                <span className="summary-dot"></span>
                <span>Present: {attendanceDetails.present || 0}</span>
              </div>
              <div className="summary-item absent">
                <span className="summary-dot"></span>
                <span>Absent: {attendanceDetails.absent || 0}</span>
              </div>
              <div className="summary-item remaining">
                <span className="summary-dot"></span>
                <span>Remaining: {attendanceDetails.remaining || 0}</span>
              </div>
            </div>
          </div>

          <div className="calendar-container">
            <div className="calendar-navigation">
              <button 
                className="nav-button"
                onClick={goToPreviousMonth}
                title="Previous month"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="calendar-month-year">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <button 
                className="nav-button"
                onClick={goToNextMonth}
                title="Next month"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="calendar-weekdays">
              {dayNames.map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-days">
              {calendarDays.map((day, idx) => {
                const status = day ? getDateStatus(day) : null;
                return (
                  <div
                    key={idx}
                    className={`calendar-day ${status ? status : 'empty'}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-color present"></div>
                <span>Present</span>
              </div>
              <div className="legend-item">
                <div className="legend-color absent"></div>
                <span>Absent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Scores Section */}
        <div className="subject-section scores-section">
          <div className="section-header">
            <h2 className="section-title">Test Scores</h2>
          </div>

          {chartData.length > 0 ? (
            <div className="scores-content">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis 
                      dataKey="type" 
                      stroke="#64748b"
                      style={{ fontSize: '14px', fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      domain={[0, 50]}
                      ticks={[0, 10, 20, 30, 40, 50]}
                      style={{ fontSize: '13px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      formatter={(value) => `${value}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="square"
                    />
                    <Bar
                      dataKey="obtained"
                      fill="#3b82f6"
                      name="Your Marks"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    />
                    <Line
                      type="monotone"
                      dataKey="classAvg"
                      stroke="#f97316"
                      strokeWidth={3}
                      name="Class Average"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="scores-table-container">
                <table className="scores-table">
                  <thead>
                    <tr>
                      <th>Assessment</th>
                      <th>Your Marks</th>
                      <th>Class Average</th>
                      <th>Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.assessments && subject.assessments
                      .filter(a => ['T1', 'T2', 'AQ1', 'AQ2'].includes(a.type))
                      .map((assessment, idx) => {
                        const obtained = parseFloat(assessment.obtained_marks) || 0;
                        const classAvg = parseFloat(assessment.class_average) || 0;
                        const diff = obtained - classAvg;
                        const diffStatus = diff > 0 ? 'better' : diff < 0 ? 'lower' : 'equal';

                        return (
                          <tr key={idx}>
                            <td className="assessment-name">
                              <strong>{assessment.type}</strong>
                            </td>
                            <td className="marks-obtained">
                              <span className="mark-badge">{obtained}</span>
                            </td>
                            <td className="class-avg">
                              <span className="mark-badge class-avg-badge">{classAvg}</span>
                            </td>
                            <td className={`difference ${diffStatus}`}>
                              <span className={`diff-value ${diffStatus}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="no-data-message">
              <p>No test score data available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;
