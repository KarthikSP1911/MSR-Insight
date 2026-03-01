import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import heroImg from '../assets/hero_academic_v2.png';

const Home = () => {
    const [data, setData] = useState("");

    useEffect(() => {
        axios.get("http://localhost:8000/")
            .then(res => setData(res.data.message))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="container fade-in">
            <header className="hero" style={{ padding: '6rem 0 8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4rem', flexDirection: 'row' }}>
                <div style={{ flex: '1', textAlign: 'left' }}>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', fontWeight: '800', lineHeight: '1.2' }}>
                        Academic Performance Dashboard
                    </h1>
                    <p style={{ fontSize: '1.15rem', maxWidth: '500px', margin: '0 0 3rem 0', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                        A centralized platform for students and proctors to monitor academic progress, track attendance, analyze performance trends, and generate comprehensive reports.
                    </p>
                    <div className="cta-buttons" style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-start' }}>
                        <Link to="/student-login" className="btn btn-primary" style={{ minWidth: '160px' }}>
                            Student Portal
                        </Link>
                        <Link to="/proctor-login" className="btn btn-secondary" style={{ minWidth: '160px' }}>
                            Proctor Portal
                        </Link>
                    </div>
                </div>
                <div style={{ flex: '1.2', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                        src={heroImg}
                        alt="AI Academic Reporting Dashboard Illustration"
                        style={{
                            maxWidth: '120%',
                            height: 'auto',
                            maxHeight: '600px',
                            opacity: 0.85,
                            filter: 'brightness(0.85) drop-shadow(0 0 2rem rgba(255, 138, 0, 0.15))',
                            maskImage: 'radial-gradient(ellipse at center, black 45%, transparent 75%)',
                            WebkitMaskImage: 'radial-gradient(ellipse at center, black 45%, transparent 75%)',
                            objectFit: 'cover',
                            transform: 'translateX(23%) scale(1.16)'
                        }}
                    />
                </div>
            </header>


        </div>
    );
};

export default Home;
