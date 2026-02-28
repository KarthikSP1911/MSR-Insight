import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProctorLogin = () => {
    const navigate = useNavigate();
    const [proctorId, setProctorId] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!proctorId || !password) {
            setError("Please fill in all fields");
            return;
        }
        setError("");
        setLoading(true);

        try {
            // Placeholder endpoint for proctor login
            const response = await axios.post("http://localhost:5001/api/auth/proctor-login", {
                proctorId,
                password,
            });

            if (response.data.success) {
                const { sessionId, proctorId: userProctorId } = response.data.data;
                localStorage.setItem("proctorSessionId", sessionId);
                localStorage.setItem("proctorId", userProctorId);
                navigate(`/proctor/${userProctorId}/dashboard`);
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
            <div className="card" style={{ maxWidth: '450px', width: '100%', padding: 'var(--space-xl)' }}>
                <h1 style={{ marginBottom: 'var(--space-xs)', textAlign: 'center' }}>Proctor Login</h1>
                <p style={{ textAlign: 'center', marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
                    Access your administrative dashboard.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Proctor ID</label>
                        <input
                            type="text"
                            className="input-field"
                            value={proctorId}
                            onChange={(e) => setProctorId(e.target.value)}
                            placeholder="e.g. P1102"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
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

export default ProctorLogin;
