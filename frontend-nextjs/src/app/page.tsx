"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BarChart2, Shield, Zap } from 'lucide-react';
import heroImg from '../assets/hero.png';

export default function Home() {
    return (
        <div className="landing-page">
            {/* Background Grid Pattern */}
            <div className="grid-overlay"></div>
            
            <header className="hero-section">
                <div className="container hero-grid">
                    <div className="hero-content fade-in">
                        <div className="tech-badge">
                            <Zap size={14} className="badge-icon" />
                            <span>Next-Gen Academic Reporting</span>
                        </div>
                        
                        <h1 className="hero-headline">
                            Academic reporting <br />
                            <span className="gradient-text">reimagined.</span>
                        </h1>
                        
                        <p className="hero-subtext">
                            A high-performance platform for students and proctors. 
                            Track attendance, analyze CIE performance, and generate comprehensive 
                            academic reports with technical precision.
                        </p>
                        
                        <div className="action-stack">
                            <Link href="/student-login" className="btn-primary-saas">
                                Start as Student <ArrowRight size={18} />
                            </Link>
                            <Link href="/proctor-login" className="btn-secondary-saas">
                                Proctor Portal
                            </Link>
                        </div>

                        <div className="trust-badges">
                            <div className="trust-item">
                                <BarChart2 size={16} />
                                <span>Real-time Analytics</span>
                            </div>
                            <div className="trust-item">
                                <Shield size={16} />
                                <span>Secure Verification</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="visual-container">
                            <Image
                                src={heroImg}
                                alt="Dashboard Preview"
                                width={800}
                                height={600}
                                className="mockup-image"
                                priority
                            />
                            <div className="visual-glow"></div>
                        </div>
                    </div>
                </div>
            </header>

            <style jsx>{`
                .landing-page {
                    background: #0A0A0A;
                    color: #EDEDED;
                    min-height: calc(100vh - var(--nav-height));
                    position: relative;
                    overflow: hidden;
                }

                .grid-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(to right, #1F1F1F 1px, transparent 1px),
                        linear-gradient(to bottom, #111111 1px, transparent 1px);
                    background-size: 50px 50px;
                    mask-image: radial-gradient(circle at 0% 0%, black, transparent 80%);
                    opacity: 0.3;
                    pointer-events: none;
                }

                .hero-section {
                    padding: 80px 0 120px 0;
                    position: relative;
                    z-index: 10;
                }

                .hero-grid {
                    display: grid;
                    grid-template-columns: 1.15fr 1fr;
                    align-items: center;
                    gap: 64px;
                }

                .hero-content {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .tech-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: #111111;
                    border: 1px solid #1F1F1F;
                    border-radius: 99px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #00ADB5;
                    width: fit-content;
                }

                .hero-headline {
                    font-size: 72px;
                    font-weight: 800;
                    line-height: 1;
                    letter-spacing: -0.05em;
                    margin: 0;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #EDEDED 0%, #00ADB5 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .hero-subtext {
                    font-size: 1.2rem;
                    color: #A1A1A1;
                    line-height: 1.6;
                    max-width: 540px;
                    margin: 0;
                }

                .action-stack {
                    display: flex;
                    gap: 16px;
                }

                .btn-primary-saas {
                    background: #EDEDED;
                    color: #0A0A0A;
                    padding: 12px 28px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .btn-primary-saas:hover {
                    background: #FFFFFF;
                    transform: translateY(-2px);
                }

                .btn-secondary-saas {
                    background: #111111;
                    color: #EDEDED;
                    border: 1px solid #1F1F1F;
                    padding: 12px 28px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1rem;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-secondary-saas:hover {
                    background: #171717;
                    border-color: #333333;
                }

                .trust-badges {
                    display: flex;
                    gap: 32px;
                    margin-top: 16px;
                }

                .trust-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #737373;
                    font-size: 14px;
                    font-weight: 500;
                }

                .hero-visual {
                    position: relative;
                }

                .visual-container {
                    position: relative;
                    border-radius: 16px;
                    border: 1px solid #1F1F1F;
                    background: #111111;
                    padding: 8px;
                    overflow: hidden;
                    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
                }

                .mockup-image {
                    width: 100%;
                    height: auto;
                    border-radius: 12px;
                    mix-blend-mode: plus-lighter;
                    opacity: 0.9;
                }

                .visual-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 50%, rgba(0, 173, 181, 0.15), transparent 70%);
                    pointer-events: none;
                }

                @media (max-width: 1024px) {
                    .hero-grid {
                        grid-template-columns: 1fr;
                        text-align: center;
                        gap: 80px;
                    }
                    .hero-content {
                        align-items: center;
                    }
                    .hero-headline {
                        font-size: 56px;
                    }
                    .action-stack {
                        justify-content: center;
                    }
                    .trust-badges {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
