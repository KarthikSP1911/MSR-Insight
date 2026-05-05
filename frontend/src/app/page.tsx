"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowRight, BarChart3, ShieldCheck, Zap, Layers,
    PieChart, FileText, Database, Brain, Mail, Clock, Send,
    Globe, Cpu, FileCheck, GraduationCap, Users, Settings
} from 'lucide-react';
import HomeNavbar from '@/components/navbar/HomeNavbar';
import heroImg from '@/assets/hero.png';

export default function Home() {

    const features = [
        { icon: <Database />, title: "Automated Extraction", desc: "Seamlessly pulls attendance, CIE, and CGPA from college portals." },
        { icon: <Brain />, title: "AI-Powered Insights", desc: "Advanced analysis of performance trends and future grade predictions." },
        { icon: <FileText />, title: "PDF Report Engine", desc: "Generate professional, agency-grade academic reports in seconds." },
        { icon: <Mail />, title: "Automated Messaging", desc: "Sends critical performance reports directly to parent email addresses." },
        { icon: <ShieldCheck />, title: "Multitenant Access", desc: "Segregated and secure dashboards for students, proctors, and admins." },
        { icon: <Clock />, title: "Real-time Monitoring", desc: "Instant alerts for low attendance or sudden dips in academic performance." }
    ];

    const workflowSteps = [
        { icon: <Globe />, title: "Portal Sync", desc: "Connect to College Portal" },
        { icon: <Cpu />, title: "Data Processing", desc: "Clean & Extract Records" },
        { icon: <Brain />, title: "AI Analysis", desc: "Generate Smart Insights" },
        { icon: <FileCheck />, title: "Final Synthesis", desc: "Produce Dynamic PDF" },
        { icon: <Send />, title: "Notification", desc: "Dispatch to Stakeholders" }
    ];

    return (
        <div className="landing-page">
            <HomeNavbar />
            <div className="grid-overlay"></div>
            <div className="radial-glow hero-bg-glow"></div>
            <div className="radial-glow features-bg-glow"></div>

            <div className="landing-layout-wrapper">
                <main className="landing-main">
                    <div className="hero-section">
                        <div className="container hero-grid">
                            <div className="hero-content fade-up-animate">
                                <div className="tech-badge">
                                    <Zap size={12} className="badge-icon" />
                                    <span>Enterprise Academic Intelligence</span>
                                </div>

                                <h1 className="hero-headline">
                                    Academic reporting <br />
                                    <span className="gradient-accent">reimagined.</span>
                                </h1>

                                <p className="hero-subtext">
                                    The industry standard for engineering college analytics.
                                    Automate reporting, monitor attendance, and predict student
                                    success with technical precision.
                                </p>

                                <div className="flex items-center gap-4 mt-6">

                                    {/* Primary CTA */}
                                    <Link
                                        href="/student-login"
                                        className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg 
               bg-gradient-to-r from-cyan-400 to-teal-500 
               text-black font-semibold 
               hover:shadow-lg hover:shadow-cyan-500/30 
               transition-all duration-300 ease-out 
               hover:scale-[1.03]"
                                    >
                                        Start as Student
                                        <ArrowRight
                                            size={18}
                                            className="transition-transform duration-300 group-hover:translate-x-1 "
                                        />
                                    </Link>

                                    {/* Secondary CTA */}
                                    <Link
                                        href="/proctor-login"
                                        className="inline-flex items-center px-6 py-3 rounded-lg 
               border border-zinc-700 text-zinc-300 
               hover:text-white hover:border-zinc-500 
               hover:bg-zinc-900/50 
               transition-all duration-300"
                                    >
                                        Proctor Portal
                                    </Link>

                                </div>
                            </div>

                            <div className="hero-visual fade-up-animate delay-1">
                                <div className="visual-wrapper">
                                    <div className="floating-card-container">
                                        <Image
                                            src={heroImg}
                                            alt="Dashboard Preview"
                                            width={900}
                                            height={600}
                                            className="mockup-image"
                                            priority
                                        />
                                        <div className="floating-ui-element stat-panel">
                                            <PieChart size={20} className="text-cyan" />
                                            <div>
                                                <div className="ui-label">Avg. CGPA</div>
                                                <div className="ui-value">8.92</div>
                                            </div>
                                        </div>
                                        <div className="floating-ui-element activity-panel">
                                            <Layers size={20} className="text-teal" />
                                            <div>
                                                <div className="ui-label">Sync Status</div>
                                                <div className="ui-value text-success">Active</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="visual-haze"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <section className="features-section" id="features">
                        <div className="container">
                            <div className="section-intro">
                                <h2 className="section-title">Superior Intelligent Tools</h2>
                                <p className="section-subtitle">A comprehensive suite engineered for institutional excellence.</p>
                            </div>

                            <div className="features-grid">
                                {features.map((feature, i) => (
                                    <div key={i} className="feature-card">
                                        <div className="feature-icon-wrapper">
                                            {React.cloneElement(feature.icon as React.ReactElement<Record<string, unknown>>, { className: "f-icon" })}
                                        </div>
                                        <h3 className="feature-card-title">{feature.title}</h3>
                                        <p className="feature-card-desc">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="workflow-section" id="workflow">
                        <div className="container">
                            <div className="section-intro">
                                <h2 className="section-title">Automated Ecosystem</h2>
                                <p className="section-subtitle">How MSR Insight transforms raw portal data into intelligence.</p>
                            </div>

                            <div className="workflow-container">
                                {workflowSteps.map((step, i) => (
                                    <React.Fragment key={i}>
                                        <div className="workflow-step">
                                            <div className="workflow-icon">{step.icon}</div>
                                            <div className="workflow-info">
                                                <h4>{step.title}</h4>
                                                <p>{step.desc}</p>
                                            </div>
                                        </div>
                                        {i < workflowSteps.length - 1 && (
                                            <div className="workflow-arrow">
                                                <ArrowRight size={24} />
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="roles-section" id="roles">
                        <div className="container">
                            <div className="section-intro">
                                <h2 className="section-title">One Platform, Three Perspectives</h2>
                            </div>

                            <div className="roles-grid">
                                <div className="role-card">
                                    <GraduationCap className="role-icon student" />
                                    <h3>Student</h3>
                                    <ul>
                                        <li>Interactive Performance Dashboard</li>
                                        <li>Attendance & Marks Tracking</li>
                                        <li>Predictive Grade Analysis</li>
                                    </ul>
                                </div>
                                <div className="role-card featured">
                                    <Users className="role-icon proctor" />
                                    <h3>Proctor</h3>
                                    <ul>
                                        <li>Monitor Assigned Student Groups</li>
                                        <li>Automated Low-Attendance Alerts</li>
                                        <li>One-Click Smart Reports</li>
                                    </ul>
                                </div>
                                <div className="role-card">
                                    <Settings className="role-icon admin" />
                                    <h3>Admin</h3>
                                    <ul>
                                        <li>Dynamic Proctor-Student Mapping</li>
                                        <li>System-Wide Health Monitoring</li>
                                        <li>Departmental Analytics Export</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="cta-section">
                        <div className="container">
                            <div className="cta-content">
                                <h2 className="cta-title">Transform Academic Monitoring</h2>
                                <p className="cta-subtitle">Ready to deploy high-precision reporting in your department?</p>
                                <div className="action-stack centered">
                                    <Link href="/student-login" className="btn-primary-saas">
                                        Get Started Now <ArrowRight size={18} />
                                    </Link>
                                    <Link href="/proctor-login" className="btn-secondary-saas">
                                        Login as Proctor
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="footer">
                    <div className="container footer-grid">
                        <div className="footer-brand">
                            <Zap className="footer-logo" />
                            <span className="brand-name">MSR Insight</span>
                            <p>Next-generation academic reporting for modern engineering institutions.</p>
                        </div>
                        <div className="footer-links">
                            <div className="link-group">
                                <h5>Product</h5>
                                <Link href="#">Features</Link>
                                <Link href="#">Analytics</Link>
                                <Link href="#">Predictors</Link>
                            </div>
                            <div className="link-group">
                                <h5>Contact</h5>
                                <Link href="#">Support</Link>
                                <Link href="#">Feedback</Link>
                                <Link href="#">Security</Link>
                            </div>
                            <div className="link-group">
                                <h5>Legal</h5>
                                <Link href="#">Privacy</Link>
                                <Link href="#">Terms</Link>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <div className="container bottom-content">
                            <span>© 2026 MSR Insight. All rights reserved.</span>
                            <div className="social-links">
                                <Link href="#">Twitter</Link>
                                <Link href="#">LinkedIn</Link>
                                <Link href="#">GitHub</Link>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

        </div>
    );
}
