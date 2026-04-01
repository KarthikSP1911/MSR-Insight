import React, { useState, useEffect } from "react";

const DOBSelector = ({ value, onChange, className = "" }) => {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Initialize from value (YYYY-MM-DD)
  useEffect(() => {
    if (value && value.includes("-")) {
      const [vYear, vMonth, vDay] = value.split("-");
      setYear(vYear);
      setMonth(vMonth);
      setDay(parseInt(vDay).toString());
    }
  }, [value]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => (currentYear - i).toString());
  const months = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];

  // Calculate days in month
  const getDaysInMonth = (m, y) => {
    if (!m) return 31;
    const monthNum = parseInt(m);
    const yearNum = y ? parseInt(y) : 2024; // Use leap year as default for Feb check if year not selected
    return new Date(yearNum, monthNum, 0).getDate();
  };

  const daysCount = getDaysInMonth(month, year);
  const days = Array.from({ length: daysCount }, (_, i) => (i + 1).toString());

  const updateDOB = (d, m, y) => {
    if (d && m && y) {
      const formattedMonth = m.padStart(2, "0");
      const formattedDay = d.padStart(2, "0");
      onChange(`${y}-${formattedMonth}-${formattedDay}`);
    } else {
      onChange("");
    }
  };

  const handleDayChange = (e) => {
    const val = e.target.value;
    setDay(val);
    updateDOB(val, month, year);
  };

  const handleMonthChange = (e) => {
    const val = e.target.value;
    setMonth(val);
    
    // Validate day if it exceeds new month's limit
    const newDaysCount = getDaysInMonth(val, year);
    let currentDay = day;
    if (day && parseInt(day) > newDaysCount) {
      currentDay = newDaysCount.toString();
      setDay(currentDay);
    }
    
    updateDOB(currentDay, val, year);
  };

  const handleYearChange = (e) => {
    const val = e.target.value;
    setYear(val);

    // Re-check leap year if month is Feb
    if (month === "02") {
      const newDaysCount = getDaysInMonth(month, val);
      let currentDay = day;
      if (day && parseInt(day) > newDaysCount) {
        currentDay = newDaysCount.toString();
        setDay(currentDay);
      }
      updateDOB(currentDay, month, val);
    } else {
      updateDOB(day, month, val);
    }
  };

  const selectStyles = {
    flex: 1,
    cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    paddingRight: "40px",
    appearance: "none",
    backgroundColor: "var(--bg-primary)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
    borderRadius: "var(--radius-sm)",
    padding: "0.45rem 0.75rem",
    fontSize: "0.85rem",
    fontFamily: "inherit"
  };

  return (
    <div className={`dob-selector-container ${className}`} style={{ display: "flex", gap: "8px", flex: 1.5 }}>
      <select 
        value={day} 
        onChange={handleDayChange}
        style={{ ...selectStyles, flex: 0.8 }}
      >
        <option value="">Day</option>
        {days.map(d => <option key={d} value={d} style={{ backgroundColor: 'var(--bg-card)' }}>{d}</option>)}
      </select>

      <select 
        value={month} 
        onChange={handleMonthChange}
        style={{ ...selectStyles, flex: 1.5 }}
      >
        <option value="">Month</option>
        {months.map(m => <option key={m.value} value={m.value} style={{ backgroundColor: 'var(--bg-card)' }}>{m.label}</option>)}
      </select>

      <select 
        value={year} 
        onChange={handleYearChange}
        style={{ ...selectStyles, flex: 1.2 }}
      >
        <option value="">Year</option>
        {years.map(y => <option key={y} value={y} style={{ backgroundColor: 'var(--bg-card)' }}>{y}</option>)}
      </select>
    </div>
  );
};

export default DOBSelector;
