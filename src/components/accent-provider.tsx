"use client";

import * as React from "react";

export const ACCENTS = [
  { key: "indigo", label: "Indigo", swatch: "#4f46e5" },
  { key: "sky", label: "Sky", swatch: "#0284c7" },
  { key: "emerald", label: "Emerald", swatch: "#059669" },
  { key: "violet", label: "Violet", swatch: "#7c3aed" },
  { key: "rose", label: "Rose", swatch: "#e11d48" },
  { key: "amber", label: "Amber", swatch: "#d97706" },
] as const;

export type AccentKey = (typeof ACCENTS)[number]["key"];

const STORAGE_KEY = "taskcraft-accent";
const DEFAULT_ACCENT: AccentKey = "indigo";

function isAccentKey(value: string | null): value is AccentKey {
  return !!value && ACCENTS.some((a) => a.key === value);
}

const AccentContext = React.createContext<{ accent: AccentKey; setAccent: (next: AccentKey) => void } | null>(null);

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<AccentKey>(DEFAULT_ACCENT);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isAccentKey(stored)) setAccentState(stored);
  }, []);

  const setAccent = React.useCallback((next: AccentKey) => {
    setAccentState(next);
    document.documentElement.setAttribute("data-accent", next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>;
}

export function useAccent() {
  const ctx = React.useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used within AccentProvider");
  return ctx;
}

export const ACCENT_INIT_SCRIPT = `(function(){try{var a=localStorage.getItem("${STORAGE_KEY}");if(a)document.documentElement.setAttribute("data-accent",a);}catch(e){}})();`;
