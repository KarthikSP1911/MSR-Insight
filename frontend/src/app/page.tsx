"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowRight, BarChart3, ShieldCheck, Zap, Layers,
    PieChart, FileText, Database, Brain, Mail, Clock, Send,
    Globe, Cpu, FileCheck, GraduationCap, Users, Settings
} from 'lucide-react';
import HomeNavbar from '@/components/navbar/HomeNavbar';
import HeroIllustration from '@/components/home/HeroIllustration';
import Reveal from '@/components/motion/Reveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { fadeUp, fadeIn, scaleIn } from '@/components/motion/variants';
import dynamic from 'next/dynamic';

const PlacementAnalytics = dynamic(() => import('@/components/home/PlacementAnalytics'), { ssr: false });

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
            <div className="radial-glow features-bg-glow"></div>

            <div className="landing-layout-wrapper">
                <main className="landing-main">
                    <div className="hero-section">
                        <div className="container hero-grid">
                            <StaggerGroup className="hero-content" stagger={0.12}>
                                <StaggerItem className="tech-badge">
                                    <Zap size={12} className="badge-icon" />
                                    <span>Enterprise Academic Intelligence</span>
                                </StaggerItem>

                                <motion.h1 className="hero-headline" variants={fadeUp}>
                                    Academic reporting <br />
                                    <span className="gradient-accent">reimagined.</span>
                                </motion.h1>

                                <StaggerItem>
                                    <p className="hero-subtext">
                                        The industry standard for engineering college analytics.
                                        Automate reporting, monitor attendance, and predict student
                                        success with technical precision.
                                    </p>
                                </StaggerItem>

                                <StaggerItem className="action-stack">
                                    <Link href="/student-login" className="btn-primary-saas">
                                        Get Started <ArrowRight size={18} />
                                    </Link>
                                    <Link href="/proctor-login" className="btn-secondary-saas">
                                        Login as Proctor
                                    </Link>
                                </StaggerItem>

                                <StaggerItem className="hero-trust-row">
                                    <span>Trusted for</span>
                                    <strong>Attendance</strong>
                                    <span className="hero-trust-dot" />
                                    <strong>CIE &amp; CGPA</strong>
                                    <span className="hero-trust-dot" />
                                    <strong>Placement Analytics</strong>
                                </StaggerItem>
                            </StaggerGroup>

                            <motion.div
                                className="hero-visual"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <div className="visual-wrapper">
                                    <div className="floating-card-container">
                                        <HeroIllustration />
                                        <motion.div
                                            className="floating-ui-element stat-panel"
                                            initial={{ opacity: 0, y: -12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.7 }}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <PieChart size={20} className="text-cyan" />
                                            <div>
                                                <div className="ui-label"></div>
                                                <div className="ui-value"></div>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            className="floating-ui-element activity-panel"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.85 }}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <Layers size={20} className="text-teal" />
                                            <div>
                                                <div className="ui-label">Sync Status</div>
                                                <div className="ui-value text-success">Active</div>
                                            </div>
                                        </motion.div>
                                    </div>
                                    <div className="visual-haze"></div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    <section className="features-section" id="features">
                        <div className="container">
                            <Reveal className="section-intro">
                                <h2 className="section-title">Superior Intelligent Tools</h2>
                                <p className="section-subtitle">A comprehensive suite engineered for institutional excellence.</p>
                            </Reveal>

                            <StaggerGroup className="features-grid" stagger={0.08} amount={0.15}>
                                {features.map((feature, i) => (
                                    <StaggerItem
                                        key={i}
                                        className="feature-card"
                                        variants={scaleIn}
                                        whileHover={{ y: -6 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <motion.div
                                            className="feature-icon-wrapper"
                                            whileHover={{ scale: 1.08, rotate: -4 }}
                                            transition={{ type: "spring", stiffness: 350, damping: 18 }}
                                        >
                                            {React.cloneElement(feature.icon as React.ReactElement<Record<string, unknown>>, { className: "f-icon" })}
                                        </motion.div>
                                        <h3 className="feature-card-title">{feature.title}</h3>
                                        <p className="feature-card-desc">{feature.desc}</p>
                                    </StaggerItem>
                                ))}
                            </StaggerGroup>
                        </div>
                    </section>

                    <section className="workflow-section" id="workflow">
                        <div className="container">
                            <Reveal className="section-intro">
                                <h2 className="section-title">Automated Ecosystem</h2>
                                <p className="section-subtitle">How MSR Insight transforms raw portal data into intelligence.</p>
                            </Reveal>

                            <StaggerGroup className="workflow-container" stagger={0.15} amount={0.15}>
                                {workflowSteps.map((step, i) => (
                                    <React.Fragment key={i}>
                                        <StaggerItem className="workflow-step" variants={scaleIn}>
                                            <motion.div
                                                className="workflow-icon"
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ type: "spring", stiffness: 350, damping: 18 }}
                                            >
                                                {step.icon}
                                            </motion.div>
                                            <div className="workflow-info">
                                                <h4>{step.title}</h4>
                                                <p>{step.desc}</p>
                                            </div>
                                        </StaggerItem>
                                        {i < workflowSteps.length - 1 && (
                                            <motion.div className="workflow-arrow" variants={fadeIn}>
                                                <ArrowRight size={24} />
                                            </motion.div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </StaggerGroup>
                        </div>
                    </section>

                    {/* <PlacementAnalytics /> */}

                    <section className="roles-section" id="roles">
                        <div className="container">
                            <Reveal className="section-intro">
                                <h2 className="section-title">One Platform, Three Perspectives</h2>
                            </Reveal>

                            <StaggerGroup className="roles-grid" stagger={0.1} amount={0.15}>
                                <StaggerItem className="role-card" variants={scaleIn}>
                                    <GraduationCap className="role-icon student" />
                                    <h3>Student</h3>
                                    <ul>
                                        <li>Interactive Performance Dashboard</li>
                                        <li>Attendance & Marks Tracking</li>
                                        <li>Predictive Grade Analysis</li>
                                    </ul>
                                </StaggerItem>
                                <StaggerItem
                                    className="role-card featured"
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.94, y: 16 },
                                        show: { opacity: 1, scale: 1.05, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                                    }}
                                >
                                    <Users className="role-icon proctor" />
                                    <h3>Proctor</h3>
                                    <ul>
                                        <li>Monitor Assigned Student Groups</li>
                                        <li>Automated Low-Attendance Alerts</li>
                                        <li>One-Click Smart Reports</li>
                                    </ul>
                                </StaggerItem>
                                <StaggerItem className="role-card" variants={scaleIn}>
                                    <Settings className="role-icon admin" />
                                    <h3>Admin</h3>
                                    <ul>
                                        <li>Dynamic Proctor-Student Mapping</li>
                                        <li>System-Wide Health Monitoring</li>
                                        <li>Departmental Analytics Export</li>
                                    </ul>
                                </StaggerItem>
                            </StaggerGroup>
                        </div>
                    </section>

                    <section className="cta-section">
                        <div className="container">
                            <Reveal className="cta-content" variants={scaleIn}>
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
                            </Reveal>
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
