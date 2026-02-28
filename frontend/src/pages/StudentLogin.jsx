import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CustomSelect = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="custom-select-container" style={{ position: 'relative', flex: 1 }}>
            <div
                className="input-field"
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {value || placeholder}
                </span>
                <span style={{ fontSize: '10px' }}>▼</span>
            </div>
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-bright)',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    {options.map((opt) => (
                        <div
                            key={opt}
                            style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                color: value === opt ? 'var(--accent-primary)' : 'var(--text-primary)',
                                background: value === opt ? 'var(--accent-glow)' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.target.style.background = value === opt ? 'var(--accent-glow)' : 'transparent'}
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
            {isOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setIsOpen(false)} />}
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
        <div className="container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - var(--nav-height))' }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%', padding: 'var(--space-xl)' }}>
                <h1 style={{ marginBottom: 'var(--space-xs)', textAlign: 'center' }}>Student Login</h1>
                <p style={{ textAlign: 'center', marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
                    Access your personalized academic report.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">University Seat Number (USN)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={usn}
                            onChange={(e) => setUsn(e.target.value.toUpperCase())}
                            placeholder="e.g. 1MS24CS001"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
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

                    {error && (
                        <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: 'var(--space-sm)', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-sm)' }} disabled={loading}>
                        {loading ? "Authenticating..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentLogin;
