"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Alert {
  id: string;
  message: string;
  time: string;
  type: string;
  isPinned: boolean;
}

interface AppContextType {
  academicYear: string;
  setAcademicYear: (year: string) => void;
  inboxOpen: boolean;
  setInboxOpen: (open: boolean) => void;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [academicYear, setAcademicYear] = useState("2027");
  const [inboxOpen, setInboxOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  return (
    <AppContext.Provider 
      value={{ 
        academicYear, 
        setAcademicYear, 
        inboxOpen, 
        setInboxOpen, 
        alerts, 
        setAlerts 
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
