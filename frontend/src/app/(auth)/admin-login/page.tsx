"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (localStorage.getItem("adminAuthenticated") === "true") {
            router.push("/admin");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setError("Please enter the admin password");
            return;
        }
        setError("");
        setLoading(true);

        // Client-side authentication simulation for Admin Panel
        setTimeout(() => {
            if (password === "admin123") {
                localStorage.setItem("adminAuthenticated", "true");
                router.push("/admin");
            } else {
                setError("Invalid credentials");
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div className="login-page fade-in">
            <div className="login-card">
                <header className="login-header">
                    <h1 className="login-title">System Admin</h1>
                    <p className="login-subtitle">Master control panel access</p>
                </header>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Master Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="form-error">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? "Authenticating..." : "Access Control Panel"}
                    </button>

                    <div className="login-footer">
                        Highly restricted area. Unauthorized access prohibited.
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
                    max-width: 400px;
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
                    color: var(--error);
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
                .login-btn {
                    margin-top: 10px;
                    font-weight: 600;
                    height: 44px;
                    background: var(--error);
                    color: white;
                    border: none;
                }
                .login-btn:hover {
                    background: #dc2626;
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
                        max-width: 360px;
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
