import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
    const [data, setData] = useState("");

    useEffect(() => {
        axios.get("http://localhost:5000/api/fastapi")
            .then(res => setData(res.data.message))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="container fade-in">
            <header className="hero" style={{ padding: '8rem 0', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', fontWeight: '800' }}>
                    {data || "AI-Powered Academic Insights"}
                </h1>
                <p style={{ fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto 3rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                    The centralized platform for students to track academic growth and proctors to manage performance with enterprise-grade AI analysis.
                </p>
                <div className="cta-buttons" style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center' }}>
                    <Link to="/student-login" className="btn btn-primary" style={{ minWidth: '180px' }}>
                        Student Portal
                    </Link>
                    <Link to="/proctor-login" className="btn btn-secondary" style={{ minWidth: '180px' }}>
                        Proctor Portal
                    </Link>
                </div>
            </header>

            <section className="dashboard-grid" style={{ marginTop: '2rem' }}>
                <div className="card">
                    <h3>AI Remarks</h3>
                    <p>Automated performance analysis and improvement suggestions for every student.</p>
                </div>
                <div className="card">
                    <h3>Visual Insights</h3>
                    <p>Clean, professional data presentation that highlights key academic trends.</p>
                </div>
                <div className="card">
                    <h3>PDF Export</h3>
                    <p>Production-ready PDF generation for physical record keeping and distribution.</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
