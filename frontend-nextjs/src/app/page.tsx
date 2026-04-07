"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { FASTAPI_BASE_URL } from '@/config/api.config';

// Import from src/assets using relative path
import heroImg from '../assets/hero_academic_v2.png';

export default function Home() {
    const [data, setData] = useState("");

    useEffect(() => {
        axios.get(`${FASTAPI_BASE_URL}/`)
            .then(res => setData(res.data.message))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="container fade-in">
            <header className="hero" style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4rem', flexDirection: 'row' }}>
                <div style={{ flex: '1', textAlign: 'left' }}>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', fontWeight: '800', lineHeight: '1.2' }}>
                        Academic Performance Dashboard
                    </h1>
                    <p style={{ fontSize: '1.15rem', maxWidth: '500px', margin: '0 0 3rem 0', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                        A centralized platform for students and proctors to monitor academic progress, track attendance, analyze performance trends, and generate comprehensive reports.
                    </p>
                    <div className="cta-buttons" style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-start' }}>
                        <Link href="/student-login" className="btn btn-primary" style={{ minWidth: '160px' }}>
                            Student Portal
                        </Link>
                        <Link href="/proctor-login" className="btn btn-secondary" style={{ minWidth: '160px' }}>
                            Proctor Portal
                        </Link>
                    </div>
                </div>
                <div style={{ flex: '1.2', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Image
                        src={heroImg}
                        alt="AI Academic Reporting Dashboard Illustration"
                        width={700}
                        height={600}
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            maxHeight: '600px',
                            opacity: 0.85,
                            filter: 'brightness(0.85) drop-shadow(0 0 2rem rgba(255, 138, 0, 0.15))',
                            maskImage: 'radial-gradient(ellipse at center, black 45%, transparent 75%)',
                            WebkitMaskImage: 'radial-gradient(ellipse at center, black 45%, transparent 75%)',
                            objectFit: 'cover',
                            transform: 'translateX(12%)'
                        }}
                    />
                </div>
            </header>
        </div>
    );
}
