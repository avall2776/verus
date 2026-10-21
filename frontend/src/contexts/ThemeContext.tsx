"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "whatsapp";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isClean: boolean;
  isWhatsApp: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Inicialização no cliente respeitando localStorage e preferência do SO
  useEffect(() => {
    try {
      const storedTheme = (localStorage.getItem("versus_theme") || localStorage.getItem("theme")) as Theme | null;
      if (storedTheme === "dark" || storedTheme === "light" || storedTheme === "whatsapp") {
        setThemeState(storedTheme);
        applyThemeClass(storedTheme);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: Theme = prefersDark ? "dark" : "light";
        setThemeState(initialTheme);
        applyThemeClass(initialTheme);
      }
    } catch (e) {
      console.warn("[THEME_INIT_ERROR]", e);
    } finally {
      setMounted(true);
    }

    // Ouvir alterações em outras abas
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === "versus_theme" || e.key === "theme") && e.newValue) {
        if (e.newValue === "dark" || e.newValue === "light" || e.newValue === "whatsapp") {
          setThemeState(e.newValue as Theme);
          applyThemeClass(e.newValue as Theme);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const applyThemeClass = (t: Theme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (t === "whatsapp") {
        root.classList.add("dark", "theme-whatsapp");
        root.classList.remove("light");
        root.setAttribute("data-theme", "whatsapp");
      } else if (t === "dark") {
        root.classList.add("dark");
        root.classList.remove("light", "theme-whatsapp");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark", "theme-whatsapp");
        root.classList.add("light");
        root.setAttribute("data-theme", "light");
      }
      // Notificar outros ouvintes no mesmo documento
      window.dispatchEvent(new CustomEvent("theme_changed", { detail: { theme: t } }));
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("versus_theme", newTheme);
      localStorage.setItem("theme", newTheme);
    } catch (e) {
      console.warn("[THEME_SAVE_ERROR]", e);
    }
    applyThemeClass(newTheme);
  };

  const toggleTheme = () => {
    // Ciclo entre os 3 temas: dark -> light -> whatsapp -> dark
    const nextTheme: Theme = 
      theme === "dark" ? "light" :
      theme === "light" ? "whatsapp" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark" || theme === "whatsapp",
        isClean: theme === "light",
        isWhatsApp: theme === "whatsapp",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser utilizado dentro de um ThemeProvider");
  }
  return context;
}
