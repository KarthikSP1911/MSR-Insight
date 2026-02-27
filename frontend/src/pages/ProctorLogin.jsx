import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

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
        <section className="auth-wrapper">
            <div className="auth-card">
                <h1>Proctor login</h1>
                <p className="auth-subtitle">
                    Access the administrative dashboard using your proctor ID and password.
                </p>
                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="field">
                        <label htmlFor="proctorId">Proctor ID</label>
                        <input
                            id="proctorId"
                            type="text"
                            autoComplete="off"
                            value={proctorId}
                            onChange={(e) => setProctorId(e.target.value)}
                            placeholder="P1102"
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
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

export default ProctorLogin;
