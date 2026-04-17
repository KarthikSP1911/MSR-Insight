"use client";

import React, { useEffect, useState } from 'react';
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
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
            <style jsx global>{`
                html, body {
                    overflow-x: hidden;
                    width: 100%;
                }
                .app-wrapper {
                    overflow-x: hidden;
                }
            `}</style>

            <div className="grid-overlay"></div>
            <div className="radial-glow hero-bg-glow"></div>
            <div className="radial-glow features-bg-glow"></div>
            
            <div className="landing-layout-wrapper">
                <main className="landing-main">
                    <div className="hero-section">
                        <div className="container hero-grid">
                            <div className={`hero-content ${isMounted ? 'fade-up-active' : 'fade-up'}`}>
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

                            <div className={`hero-visual ${isMounted ? 'fade-up-active delay-1' : 'fade-up'}`}>
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
                                            {React.cloneElement(feature.icon as React.ReactElement, { className: "f-icon" })}
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

            <style jsx>{`
                .landing-page {
                    background: #080808;
                    color: #FFFFFF;
                    position: relative;
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                .landing-layout-wrapper {
                    display: flex;
                    flex-direction: column;
                }

                .landing-main {
                    flex: 1;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                .grid-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
                    background-size: 80px 80px;
                    mask-image: radial-gradient(circle at center, black 10%, transparent 100%);
                    pointer-events: none;
                }

                .radial-glow {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(120px);
                    pointer-events: none;
                    opacity: 0.1;
                    z-index: 0;
                }

                .hero-bg-glow { width: 600px; height: 600px; background: radial-gradient(circle, #00ADB5 0%, transparent 70%); top: -100px; left: -100px; }
                .features-bg-glow { width: 800px; height: 800px; background: radial-gradient(circle, #00ADB5 0%, transparent 70%); bottom: 20%; right: -200px; }

                section { padding: 80px 0; }

                .hero-section { padding: 100px 0 60px 0; position: relative; z-index: 10; }
                .hero-grid { display: grid; grid-template-columns: 1.15fr 1fr; align-items: center; gap: 80px; }
                .hero-content { display: flex; flex-direction: column; gap: 32px; }

                .fade-up { opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                .fade-up-active { opacity: 1; transform: translateY(0); }
                .delay-1 { transition-delay: 0.2s; }

                .tech-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 14px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 99px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #00ADB5;
                    width: fit-content;
                }

                .hero-headline { font-size: 82px; font-weight: 950; line-height: 0.95; letter-spacing: -0.05em; margin: 0; }
                .gradient-accent { background: linear-gradient(135deg, #00ADB5 0%, #00F5FF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .hero-subtext { font-size: 1.15rem; color: #94A3B8; line-height: 1.6; max-width: 520px; margin: 0; }

                .action-stack { display: flex; gap: 16px; }
                .action-stack.centered { justify-content: center; }

                .btn-primary-saas {
                    background: linear-gradient(135deg, #00ADB5 0%, #008f95 100%);
                    color: #FFFFFF; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 1rem;
                    display: flex; align-items: center; gap: 12px; text-decoration: none; transition: all 0.3s ease;
                    box-shadow: 0 10px 20px rgba(0, 173, 181, 0.15);
                }
                .btn-primary-saas:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0, 173, 181, 0.3); }

                .btn-secondary-saas {
                    background: transparent; color: #EDEDED; border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 1rem;
                    text-decoration: none; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center;
                }
                .btn-secondary-saas:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.2); transform: translateY(-3px); }

                .hero-visual { perspective: 1200px; }
                .visual-wrapper { position: relative; transform: rotateY(-18deg) rotateX(12deg); }
                .floating-card-container {
                    position: relative; background: #111; padding: 10px; border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: -40px 40px 80px rgba(0, 0, 0, 0.8);
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                .mockup-image { width: 100%; height: auto; border-radius: 14px; display: block; opacity: 0.9; }

                .floating-ui-element {
                    position: absolute; background: rgba(18, 18, 18, 0.85); backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 18px; border-radius: 14px;
                    display: flex; align-items: center; gap: 12px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                }
                .stat-panel { top: -20px; right: -40px; }
                .activity-panel { bottom: 40px; left: -50px; }
                .ui-label { font-size: 9px; text-transform: uppercase; color: #737373; font-weight: 800; }
                .ui-value { font-size: 16px; font-weight: 800; }
                .text-cyan { color: #00F5FF; } .text-teal { color: #00ADB5; } .text-success { color: #10B981; }

                .section-intro { text-align: center; margin-bottom: 64px; }
                .section-title { font-size: 42px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 16px; }
                .section-subtitle { color: #94A3B8; font-size: 1.1rem; }

                .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .feature-card {
                    background: #111111; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 32px;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .feature-card:hover { transform: translateY(-6px); border-color: #00ADB544; background: #141414; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4); }
                .feature-icon-wrapper { width: 48px; height: 48px; background: rgba(0, 173, 181, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; color: #00ADB5; }
                .feature-card-title { font-size: 18px; margin-bottom: 12px; font-weight: 700; color: #F8FAFC; }
                .feature-card-desc { color: #64748B; font-size: 0.95rem; line-height: 1.6; }

                .workflow-container { display: flex; justify-content: space-between; align-items: center; padding: 40px 0; }
                .workflow-step { text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 20px; }
                .workflow-icon { width: 64px; height: 64px; border-radius: 50%; background: #111; border: 1px solid #222; display: flex; align-items: center; justify-content: center; color: #00ADB5; }
                .workflow-info h4 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
                .workflow-info p { font-size: 13px; color: #64748B; }
                .workflow-arrow { color: #1F1F1F; }

                .roles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
                .role-card { background: #0F0F0F; border: 1px solid #1A1A1A; padding: 48px 32px; border-radius: 24px; text-align: center; }
                .role-card.featured { background: #111; border-color: #222; transform: scale(1.05); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); }
                .role-icon { width: 48px; height: 48px; margin: 0 auto 24px; }
                .role-icon.student { color: #3B82F6; } .role-icon.proctor { color: #00ADB5; } .role-icon.admin { color: #8B5CF6; }
                .role-card h3 { font-size: 24px; margin-bottom: 24px; }
                .role-card ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; }
                .role-card li { font-size: 14px; color: #94A3B8; }

                .cta-section { background: radial-gradient(circle at center, #00ADB511 0%, transparent 70%); border-top: 1px solid #111; }
                .cta-content { text-align: center; }
                .cta-content h2 { font-size: 48px; margin-bottom: 20px; }
                .cta-content p { font-size: 1.25rem; color: #94A3B8; margin-bottom: 40px; }

                .footer { background: #050505; border-top: 1px solid #111; padding: 80px 0 0 0; }
                .footer-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 80px; padding-bottom: 60px; }
                .footer-brand { display: flex; flex-direction: column; gap: 20px; max-width: 320px; }
                .footer-logo { width: 32px; height: 32px; color: #00ADB5; }
                .brand-name { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
                .footer-brand p { font-size: 14px; color: #64748B; }
                .footer-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
                .link-group h5 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #EDEDED; margin-bottom: 24px; }
                .link-group { display: flex; flex-direction: column; gap: 12px; }
                .link-group a { text-decoration: none; color: #64748B; font-size: 14px; transition: color 0.2s; }
                .link-group a:hover { color: #00ADB5; }
                .footer-bottom { border-top: 1px solid #111; padding: 32px 0; }
                .bottom-content { display: flex; justify-content: space-between; align-items: center; color: #475569; font-size: 13px; }
                .social-links { display: flex; gap: 24px; }
                .social-links a { color: #475569; text-decoration: none; transition: color 0.2s; }
                .social-links a:hover { color: #EDEDED; }

                @media (max-width: 1024px) {
                    .hero-grid { grid-template-columns: 1fr; text-align: center; }
                    .hero-content { align-items: center; }
                    .features-grid, .roles-grid { grid-template-columns: repeat(2, 1fr); }
                    .workflow-container { flex-direction: column; gap: 40px; }
                    .workflow-arrow { transform: rotate(90deg); }
                }

                @media (max-width: 768px) {
                    .features-grid, .roles-grid, .footer-grid, .footer-links { grid-template-columns: 1fr; gap: 40px; }
                    .hero-headline { font-size: 56px; }
                }
            `}</style>
        </div>
    );
}
