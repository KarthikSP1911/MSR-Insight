"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api.config";

const CustomSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="custom-select-container">
            <div
                className="select-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? "value-text" : "placeholder-text"}>
                    {value || placeholder}
                </span>
                <span className="chevron">▼</span>
            </div>
            {isOpen && (
                <div className="select-dropdown">
                    {options.map((opt) => (
                        <div
                            key={opt}
                            className={`select-option ${value === opt ? "selected" : ""}`}
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

            <style jsx>{`
                .custom-select-container { position: relative; flex: 1; }
                .select-trigger {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-subtle);
                    padding: 10px 14px;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }
                .select-trigger:hover { border-color: var(--border-bright); background: var(--bg-secondary); }
                .value-text { color: var(--text-primary); }
                .placeholder-text { color: var(--text-muted); }
                .chevron { font-size: 8px; color: var(--text-muted); opacity: 0.7; }
                .select-dropdown {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    right: 0;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-md);
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 100;
                    box-shadow: var(--shadow-lg);
                    padding: 4px;
                }
                .select-option {
                    padding: 8px 12px;
                    cursor: pointer;
                    border-radius: var(--radius-sm);
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    transition: all 0.2s ease;
                }
                .select-option:hover { background: var(--bg-surface); color: var(--text-primary); }
                .select-option.selected { background: var(--bg-surface); color: var(--accent-primary); font-weight: 600; }
                .select-overlay { position: fixed; inset: 0; z-index: 90; }
            `}</style>
        </div>
    );
};

export default function StudentLogin() {
    const router = useRouter();
    const [usn, setUsn] = useState("");
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => String(currentYear - i - 15));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usn || !day || !month || !year) {
            setError("Please fill in all fields");
            return;
        }
        setError("");
        setLoading(true);

        const monthIndex = String(months.indexOf(month) + 1).padStart(2, "0");
        const formattedDay = String(day).padStart(2, "0");
        const formattedDate = `${formattedDay}-${monthIndex}-${year}`;

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                usn,
                dob: formattedDate,
            });

            if (response.data.success) {
                const { sessionId, usn: userUsn } = response.data.data;
                localStorage.setItem("studentSessionId", sessionId);
                localStorage.setItem("studentUsn", userUsn);
                router.push("/student/dashboard");
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Invalid credentials"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card fade-in">
                <header className="login-header">
                    <h1 className="login-title">Student Portal</h1>
                    <p className="login-subtitle">Sign in to access your reports</p>
                </header>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">University Seat Number</label>
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
                        <div className="dob-grid">
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
                        <div className="form-error">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? "Verifying..." : "Sign In"}
                    </button>
                    
                    <div className="login-footer">
                        Secure academic access powered by Smart Report
                    </div>
                </form>
            </div>

            <style jsx>{`
                .login-page {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: calc(100vh - var(--nav-height));
                    background: var(--bg-primary);
                }
                .login-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-lg);
                    padding: 40px;
                    width: 100%;
                    max-width: 440px;
                    box-shadow: var(--shadow-lg);
                }
                .login-header {
                    margin-bottom: 32px;
                    text-align: center;
                }
                .login-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    margin-bottom: 8px;
                    color: var(--text-primary);
                }
                .login-subtitle {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                }
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .dob-grid {
                    display: flex;
                    gap: 10px;
                }
                .login-btn {
                    margin-top: 10px;
                    font-weight: 600;
                    height: 44px;
                }
                .form-error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: var(--error);
                    padding: 10px;
                    border-radius: var(--radius-md);
                    font-size: 0.85rem;
                    text-align: center;
                }
                .login-footer {
                    margin-top: 24px;
                    text-align: center;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                @media (max-width: 768px) {
                    .login-card {
                        padding: 32px 24px;
                        max-width: 380px;
                        margin: 20px;
                    }
                    .login-title {
                        font-size: 1.5rem;
                    }
                }

                @media (max-width: 480px) {
                    .login-page {
                        align-items: flex-start;
                        padding-top: 40px;
                    }
                    .login-card {
                        padding: 24px 20px;
                        margin: 16px;
                        border-radius: var(--radius-md);
                    }
                    .dob-grid {
                        flex-direction: column;
                        gap: 12px;
                    }
                    .login-title {
                        font-size: 1.35rem;
                    }
                    .login-subtitle {
                        font-size: 0.85rem;
                    }
                }
            `}</style>
        </div>
    );
}

