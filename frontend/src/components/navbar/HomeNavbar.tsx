"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HomeNavbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`home-navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="container nav-content">
                <Link href="/" className="nav-logo flex g-3">
                    <Image
                        src="/logo-icon.svg"
                        alt="MSR Insight logo"
                        width={28}
                        height={28}
                        className="logo-icon"
                    />
                    <pre>  </pre>
                    <span className="logo-text">  MSR Insight</span>
                </Link>

                <div className="nav-actions">
                    <Link href="/student-login" className="link-secondary">
                        Student Login
                    </Link>
                    <Link href="/proctor-login" className="btn-primary-cta">
                        Proctor Portal
                    </Link>
                </div>
            </div>

        </nav>
    );
};

export default HomeNavbar;
