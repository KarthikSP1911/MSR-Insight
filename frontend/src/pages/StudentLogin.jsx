import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const CustomSelect = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="custom-select-container">
            <div
                className={`custom-select-trigger ${isOpen ? "open" : ""} ${!value ? "placeholder" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {value || placeholder}
                <span className="arrow"></span>
            </div>
            {isOpen && (
                <div className="custom-options-list">
                    {options.map((opt) => (
                        <div
                            key={opt}
                            className={`custom-option ${value === opt ? "selected" : ""}`}
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
            {isOpen && <div className="select-overlay" onClick={() => setIsOpen(false)} />}
        </div>
    );
};

const StudentLogin = () => {
    const navigate = useNavigate();
    const [usn, setUsn] = useState("");
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => String(currentYear - i - 15));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usn || !day || !month || !year) {
            setError("Please fill in all fields");
            return;
        }
        setError("");
        setLoading(true);

        const monthIndex = months.indexOf(month) + 1;
        const formattedDate = `${year}-${String(monthIndex).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        try {
            const response = await axios.post("http://localhost:5000/api/auth/login", {
                usn,
                dob: formattedDate,
            });

            if (response.data.success) {
                const { sessionId, usn: userUsn } = response.data.data;
                localStorage.setItem("studentSessionId", sessionId);
                localStorage.setItem("studentUsn", userUsn);
                navigate("/student/dashboard");
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-wrapper">
            <div className="auth-card">
                <h1>Student login</h1>
                <p className="auth-subtitle">
                    Use your university seat number and date of birth to sign in.
                </p>
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="field">
                        <label htmlFor="usn">USN</label>
                        <input
                            id="usn"
                            type="text"
                            autoComplete="off"
                            value={usn}
                            onChange={(e) => setUsn(e.target.value.toUpperCase())}
                            placeholder="1MS24CS001"
                            required
                        />
                    </div>

                    <div className="field">
                        <label>Date of Birth</label>
                        <div className="dob-selects">
                            <CustomSelect
                                value={day}
                                onChange={setDay}
                                options={days}
                                placeholder="Day"
                            />
                            <CustomSelect
                                value={month}
                                onChange={setMonth}
                                options={months}
                                placeholder="Month"
                            />
                            <CustomSelect
                                value={year}
                                onChange={setYear}
                                options={years}
                                placeholder="Year"
                            />
                        </div>
                    </div>

                    <div className="auth-error-slot">
                        {error && <span className="auth-error">{error}</span>}
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default StudentLogin;
