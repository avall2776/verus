"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, MessageCircle } from "lucide-react";
import { useTheme, Theme } from "@/contexts/ThemeContext";

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
  const { theme, setTheme, toggleTheme, isDark, isClean, isWhatsApp } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevenir discrepância de hidratação do SSR
  if (!mounted) {
    return (
      <div
        className={`h-8 w-24 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center opacity-50 ${className}`}
        aria-hidden="true"
      />
    );
  }

  // Variante: Menu Item (Sidebar / Dropdown de Usuário)
  if (variant === "menu-item") {
    return (
      <div className={`w-full px-3 py-2 flex flex-col gap-1.5 rounded-xl text-xs transition-colors ${
        isClean ? "bg-slate-50 border border-slate-200" : "bg-slate-800/50 border border-slate-700/60"
      } ${className}`}>
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span>Estilo Visual</span>
          <span className="font-mono text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
            {theme === "whatsapp" ? "WhatsApp" : theme === "dark" ? "Dark" : "Clean"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              theme === "light"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Modo Clean (Claro / Diurno)"
          >
            <Sun size={12} className={theme === "light" ? "text-amber-500" : ""} />
            <span>Clean</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Modo Dark (Executivo / Noturno)"
          >
            <Moon size={12} className={theme === "dark" ? "text-white" : ""} />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("whatsapp")}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              theme === "whatsapp"
                ? "bg-[#00A884] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
            title="Modo WhatsApp (Verde Petróleo Web)"
          >
            <MessageCircle size={12} className={theme === "whatsapp" ? "text-white" : ""} />
            <span>Whats</span>
          </button>
        </div>
      </div>
    );
  }

  // Variante: Segmented Pill (Desktop Topbar - 3 Opções em 1 Clique)
  if (variant === "pill") {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
          isClean
            ? "bg-slate-100 border-slate-200"
            : isWhatsApp
            ? "bg-[#111B21] border-[#222D34]"
            : "bg-slate-900/90 border-slate-700/80"
        } ${className}`}
        role="group"
        aria-label="Seletor de tema"
      >
        {/* Opção 1: Clean (Claro) */}
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === "light"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
          title="Modo Clean (Claro)"
        >
          <Sun size={13} className={theme === "light" ? "text-amber-500" : "text-slate-400"} />
          <span className="hidden md:inline">Clean</span>
        </button>

        {/* Opção 2: Dark (Executivo) */}
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === "dark"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
          title="Modo Dark (Executivo)"
        >
          <Moon size={13} className={theme === "dark" ? "text-white" : "text-slate-400"} />
          <span className="hidden md:inline">Dark</span>
        </button>

        {/* Opção 3: WhatsApp Web (Verde Petróleo) */}
        <button
          type="button"
          onClick={() => setTheme("whatsapp")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === "whatsapp"
              ? "bg-[#00A884] text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
          title="Modo WhatsApp Web (Verde Petróleo)"
        >
          <MessageCircle size={13} className={theme === "whatsapp" ? "text-white" : "text-slate-400"} />
          <span className="hidden md:inline">WhatsApp</span>
        </button>
      </div>
    );
  }

  // Variante Padrão: Botão Compacto com Ciclo entre os 3 temas
  const getThemeInfo = () => {
    if (theme === "whatsapp") {
      return {
        label: "WhatsApp",
        next: "Clean (Claro)",
        icon: <MessageCircle size={16} className="text-[#00A884]" />,
        badgeColor: "bg-[#00A884]/15 border-[#00A884]/30 text-[#00A884]",
      };
    }
    if (theme === "light") {
      return {
        label: "Clean",
        next: "Dark (Noturno)",
        icon: <Sun size={16} className="text-amber-500 hover:rotate-90 transition-transform duration-300" />,
        badgeColor: "bg-amber-50 border-amber-200 text-amber-700",
      };
    }
    return {
      label: "Dark",
      next: "WhatsApp Web",
      icon: <Moon size={16} className="text-blue-500 hover:-rotate-12 transition-transform duration-300" />,
      badgeColor: "bg-blue-600/15 border-blue-500/30 text-blue-400",
    };
  };

  const themeInfo = getThemeInfo();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center cursor-pointer border ${
        isClean
          ? "bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-sm"
          : isWhatsApp
          ? "bg-[#202C33] hover:bg-[#2A3942] text-slate-200 border-[#222D34] shadow-sm"
          : "bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600 shadow-sm"
      } ${className}`}
      title={`Tema: ${themeInfo.label}. Clique para alternar para ${themeInfo.next}`}
      aria-label="Alternar tema entre Clean, Dark e WhatsApp"
    >
      {themeInfo.icon}
      {showLabel && (
        <span className="ml-2 text-xs font-semibold">
          {themeInfo.label}
        </span>
      )}
    </button>
  );
}
