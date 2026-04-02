import React, { useState, useRef, useEffect } from "react";
import "./CustomDropdown.css";

/**
 * CustomDropdown: A polished, dark-themed dropdown component
 * designed specifically for dashboard filters.
 */
const CustomDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`custom-dropdown ${isOpen ? "is-open" : ""}`} ref={dropdownRef}>
      <div className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="selected-label">
          {selectedOption && selectedOption.value !== "All" 
            ? selectedOption.label 
            : placeholder}
        </span>
        <svg 
          className="chevron-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="dropdown-menu fade-in-scale">
          {options.map((option) => (
            <div
              key={option.value}
              className={`dropdown-item ${value === option.value ? "is-selected" : ""}`}
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
              {value === option.value && (
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
