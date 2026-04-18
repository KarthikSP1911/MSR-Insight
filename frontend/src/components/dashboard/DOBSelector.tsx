"use client";

import React, { useState, useEffect } from "react";

interface DOBSelectorProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

const DOBSelector: React.FC<DOBSelectorProps> = ({ value, onChange, className = "" }) => {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

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
    { value: "01", label: "Jan" }, { value: "02", label: "Feb" }, { value: "03", label: "Mar" },
    { value: "04", label: "Apr" }, { value: "05", label: "May" }, { value: "06", label: "Jun" },
    { value: "07", label: "Jul" }, { value: "08", label: "Aug" }, { value: "09", label: "Sep" },
    { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
  ];

  const getDaysInMonth = (m: string, y: string) => {
    if (!m) return 31;
    const monthNum = parseInt(m);
    const yearNum = y ? parseInt(y) : 2024;
    return new Date(yearNum, monthNum, 0).getDate();
  };

  const daysCount = getDaysInMonth(month, year);
  const days = Array.from({ length: daysCount }, (_, i) => (i + 1).toString());

  const updateDOB = (d: string, m: string, y: string) => {
    if (d && m && y) {
      const formattedMonth = m.padStart(2, "0");
      const formattedDay = d.padStart(2, "0");
      onChange(`${y}-${formattedMonth}-${formattedDay}`);
    } else {
      onChange("");
    }
  };

  const selectStyles: React.CSSProperties = {
    flex: 1, backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)", borderRadius: "var(--radius-sm)", padding: "0.45rem 0.75rem",
    fontSize: "0.85rem", fontFamily: "inherit"
  };

  return (
    <div className={`dob-selector-container ${className}`} style={{ display: "flex", gap: "8px", flex: 1.5 }}>
      <select value={day} onChange={(e) => { setDay(e.target.value); updateDOB(e.target.value, month, year); }} style={{ ...selectStyles, flex: 0.8 }}>
        <option value="">Day</option>
        {days.map(d => <option key={d} value={d} style={{ backgroundColor: 'var(--bg-card)' }}>{d}</option>)}
      </select>
      <select value={month} onChange={(e) => { setMonth(e.target.value); updateDOB(day, e.target.value, year); }} style={{ ...selectStyles, flex: 1.5 }}>
        <option value="">Month</option>
        {months.map(m => <option key={m.value} value={m.value} style={{ backgroundColor: 'var(--bg-card)' }}>{m.label}</option>)}
      </select>
      <select value={year} onChange={(e) => { setYear(e.target.value); updateDOB(day, month, e.target.value); }} style={{ ...selectStyles, flex: 1.2 }}>
        <option value="">Year</option>
        {years.map(y => <option key={y} value={y} style={{ backgroundColor: 'var(--bg-card)' }}>{y}</option>)}
      </select>
    </div>
  );
};

export default DOBSelector;
