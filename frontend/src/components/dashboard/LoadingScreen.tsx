"use client";

import React from "react";
import { motion } from "framer-motion";

const LoadingScreen = () => {
    return (
        <div className="fresh-loading-container">
            <div className="visual-core">
                <motion.div
                    className="logo-pulse-container"
                    animate={{ 
                        scale: [1, 1.1, 1],
                        filter: [
                            "drop-shadow(0 0 15px rgba(0, 173, 181, 0.1))",
                            "drop-shadow(0 0 30px rgba(0, 173, 181, 0.4))",
                            "drop-shadow(0 0 15px rgba(0, 173, 181, 0.1))"
                        ]
                    }}
                    transition={{ 
                        duration: 1.8, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                >
                    <img 
                        src="/logo-icon.svg" 
                        alt="Loading MSR Insight..." 
                        style={{ width: '80px', height: 'auto', objectFit: 'contain' }} 
                    />
                </motion.div>
            </div>

            <style jsx>{`
                .fresh-loading-container {
                    position: fixed;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--bg-primary, #0A0A0A);
                    z-index: 99999;
                    overflow: hidden;
                }

                .visual-core {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo-pulse-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    will-change: transform, filter;
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
