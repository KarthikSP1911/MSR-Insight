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

            <style jsx>{`
                .home-navbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    z-index: 1000;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: transparent;
                    border-bottom: 1px solid transparent;
                }

                .home-navbar.scrolled {
                    height: 64px;
                    background: rgba(8, 8, 8, 0.8);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
                }

                .nav-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }

                .nav-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    transition: opacity 0.2s ease;
                }

                .nav-logo:hover {
                    opacity: 0.8;
                }

                .logo-text {
                    color: #FFFFFF;
                    font-size: 1.25rem;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                }

                .nav-actions {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }

                .link-secondary {
                    color: #94A3B8;
                    text-decoration: none;
                    font-size: 0.9rem;
                    font-weight: 500;
                    padding: 8px 16px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .link-secondary:hover {
                    color: #FFFFFF;
                    background: rgba(255, 255, 255, 0.05);
                }

                .btn-primary-cta {
                    background: linear-gradient(135deg, #00ADB5 0%, #00F5FF 100%);
                    color: #000000;
                    padding: 10px 24px;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 4px 15px rgba(0, 173, 181, 0.1);
                }

                .btn-primary-cta:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(0, 173, 181, 0.4);
                    filter: brightness(1.1);
                }

                @media (max-width: 640px) {
                    .nav-actions {
                        gap: 16px;
                    }
                    .link-secondary {
                        display: none;
                    }
                    .btn-primary-cta {
                        padding: 8px 16px;
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </nav>
    );
};

export default HomeNavbar;
