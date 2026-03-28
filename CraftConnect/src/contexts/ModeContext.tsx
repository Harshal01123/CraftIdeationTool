import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

export type Mode = "artisan" | "customer" | "learner";

interface ModeContextType {
  activeMode: Mode;
  setActiveMode: (mode: Mode) => void;
  availableModes: Mode[];
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const { profile, authLoading } = useAuth();
  
  // Available modes based on the underlying DB role
  const isArtisan = profile?.role === "artisan";
  const availableModes: Mode[] = isArtisan
    ? ["artisan", "customer", "learner"]
    : ["customer", "learner"];

  // Default mode depends on the user's role
  const defaultMode: Mode = isArtisan ? "artisan" : "customer";

  const [activeMode, setActiveModeState] = useState<Mode>(defaultMode);

  // Sync with localStorage
  useEffect(() => {
    if (authLoading || !profile) return;

    const storedMode = localStorage.getItem(`craftconnect_mode_${profile.id}`) as Mode | null;
    
    // Validate stored mode against available modes
    if (storedMode && availableModes.includes(storedMode)) {
      setActiveModeState(storedMode);
    } else {
      setActiveModeState(defaultMode);
      localStorage.setItem(`craftconnect_mode_${profile.id}`, defaultMode);
    }
  }, [profile, authLoading]); // Only re-run when profile/authLoading changes

  // Update active mode and persist to localStorage
  const setActiveMode = (mode: Mode) => {
    if (availableModes.includes(mode) && profile) {
      setActiveModeState(mode);
      localStorage.setItem(`craftconnect_mode_${profile.id}`, mode);
    }
  };

  return (
    <ModeContext.Provider value={{ activeMode, setActiveMode, availableModes }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
