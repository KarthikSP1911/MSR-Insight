"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { ToastItem } from "@/lib/ToastContext";
import "@/styles/Toast.css";

const ICONS: Record<ToastItem["type"], React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

export default function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`toast-card toast-${t.type}`}
            role="alert"
          >
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
              <X size={14} />
            </button>
            <span
              className="toast-progress"
              style={{ animationDuration: `${t.duration}ms` }}
              onAnimationEnd={() => onDismiss(t.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
