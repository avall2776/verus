"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  variant?: "icon" | "badge" | "menu-item" | "pill";
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  variant = "icon",
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevenir discrepância de hidratação do SSR
  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center opacity-50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (variant === "menu-item") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer group ${
          isDark
            ? "text-slate-300 hover:text-white hover:bg-slate-800/70"
            : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
        } ${className}`}
        title={`Alternar para ${isDark ? "Modo Claro (Dia)" : "Modo Escuro (Noite)"}`}
      >
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <Sun size={15} className="text-amber-400 group-hover:rotate-45 transition-transform duration-200" />
          ) : (
            <Moon size={15} className="text-blue-500 group-hover:-rotate-12 transition-transform duration-200" />
          )}
          <span>Tema: {isDark ? "Modo Escuro" : "Modo Claro"}</span>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isDark
              ? "bg-slate-800 text-slate-400 border border-slate-700"
              : "bg-slate-200 text-slate-600 border border-slate-300"
          }`}
        >
          {isDark ? "Noite" : "Dia"}
        </span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer ${
          isDark
            ? "bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-600"
            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-slate-200/50"
        } ${className}`}
        title={`Alternar para ${isDark ? "Modo Claro" : "Modo Escuro"}`}
        aria-label="Alternar tema"
      >
        {isDark ? (
          <Sun size={14} className="text-amber-400 animate-in spin-in-180 duration-300" />
        ) : (
          <Moon size={14} className="text-blue-600 animate-in spin-in-180 duration-300" />
        )}
        <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
      </button>
    );
  }

  // Ícone padrão com micro-interações
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center cursor-pointer border ${
        isDark
          ? "bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600 shadow-sm"
          : "bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm"
      } ${className}`}
      title={isDark ? "Ativar Modo Claro (Clean Corporativo)" : "Ativar Modo Escuro"}
      aria-label="Alternar tema"
    >
      {isDark ? (
        <Sun size={16} className="text-amber-400 hover:text-amber-300 transition-transform duration-300 hover:rotate-90" />
      ) : (
        <Moon size={16} className="text-blue-600 hover:text-blue-700 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="ml-2 text-xs font-medium">
          {isDark ? "Modo Noite" : "Modo Dia"}
        </span>
      )}
    </button>
  );
}
