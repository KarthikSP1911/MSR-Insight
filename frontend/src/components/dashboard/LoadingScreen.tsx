"use client";

import React from "react";
import { motion } from "framer-motion";

const LoadingScreen = () => {
    return (
        <div className="fresh-loading-container">
            <div className="visual-core">
                {/* Modern Pulse Rings */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="pulse-ring"
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.6,
                            ease: "easeOut"
                        }}
                    />
                ))}
                
                {/* Central Focus Dot */}
                <motion.div 
                    className="central-dot"
                    animate={{ 
                        scale: [1, 1.1, 1],
                        boxShadow: [
                            "0 0 20px var(--accent-glow)",
                            "0 0 40px var(--accent-glow)",
                            "0 0 20px var(--accent-glow)"
                        ]
                    }}
                    transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                />
            </div>

            <motion.div 
                className="loading-meta"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <span className="brand-name">MSR INSIGHT</span>
                <div className="shimmer-text">Initializing Academic Data</div>
            </motion.div>

            <style jsx>{`
                .fresh-loading-container {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--bg-primary, #0A0A0A);
                    background-image: 
                        radial-gradient(circle at 50% 50%, rgba(0, 173, 181, 0.05) 0%, transparent 50%);
                    z-index: 99999;
                    overflow: hidden;
                }

                .visual-core {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .pulse-ring {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    border: 1px solid var(--accent-primary, #00ADB5);
                    border-radius: 50%;
                }

                .central-dot {
                    width: 12px;
                    height: 12px;
                    background-color: var(--accent-primary, #00ADB5);
                    border-radius: 50%;
                    z-index: 10;
                }

                .loading-meta {
                    margin-top: 60px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .brand-name {
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 0.4em;
                    color: var(--text-muted, #737373);
                    text-transform: uppercase;
                }

                .shimmer-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-secondary, #A1A1A1);
                    background: linear-gradient(
                        90deg, 
                        var(--text-secondary) 0%, 
                        var(--text-primary) 50%, 
                        var(--text-secondary) 100%
                    );
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 2s linear infinite;
                }

                @keyframes shimmer {
                    to { background-position: 200% center; }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
