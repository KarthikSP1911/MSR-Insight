"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import ToastViewport from "@/components/ui/ToastViewport";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string, duration: number = DEFAULT_DURATION) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const value: ToastContextValue = {
    success: (message, duration) => push("success", message, duration),
    error: (message, duration) => push("error", message, duration),
    warning: (message, duration) => push("warning", message, duration),
    info: (message, duration) => push("info", message, duration),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
