import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, X, Gift } from 'lucide-react';
import '@/styles/BirthdayBanner.css';

interface BirthdayBannerProps {
  studentName: string;
}

export default function BirthdayBanner({ studentName }: BirthdayBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
          className="birthday-banner-container"
        >
          <div className="birthday-banner-content">
            <div className="birthday-icon-container">
              <PartyPopper size={24} className="text-yellow-400 animate-bounce-slow" />
            </div>
            <div className="birthday-text-container">
              <h3 className="birthday-title">Happy Birthday, {studentName.split(' ')[0]}! 🎉</h3>
              <p className="birthday-subtitle">Wishing you a fantastic day and a great year ahead!</p>
            </div>
          </div>
          <button 
            className="birthday-close-btn" 
            onClick={() => setIsVisible(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
          
          {/* Decorative elements */}
          <Gift size={32} className="birthday-deco-gift" opacity={0.2} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
