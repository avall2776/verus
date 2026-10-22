"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface VersusPreloaderProps {
  onComplete?: (targetHref?: string) => void;
  durationMs?: number;
  forcePlay?: boolean;
  userName?: string;
}

export default function VersusPreloader({
  onComplete,
  durationMs = 2800,
  forcePlay = false,
}: VersusPreloaderProps) {
  const { isDark, isWhatsApp } = useTheme();

  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Fallback seguro de tema baseado em classes DOM caso o contexto ainda esteja montando
  const [domTheme, setDomTheme] = useState<{ isDark: boolean; isWhatsApp: boolean }>({
    isDark: true,
    isWhatsApp: false,
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      setDomTheme({
        isDark: root.classList.contains("dark") || isDark,
        isWhatsApp: root.classList.contains("theme-whatsapp") || isWhatsApp,
      });
    }
  }, [isDark, isWhatsApp]);

  const effectiveIsWhatsApp = isWhatsApp || domTheme.isWhatsApp;
  const effectiveIsDark = isDark || domTheme.isDark;
  const isCleanTheme = !effectiveIsDark && !effectiveIsWhatsApp;

  // Gerenciamento de ciclo de vida do Preloader (2.5 a 3.0 segundos)
  useEffect(() => {
    // Inicia a transição de saída (scale-up suave 1.04 + fade-out) 650ms antes do final
    const exitLeadTime = 650;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, Math.max(800, durationMs - exitLeadTime));

    // Finaliza o preloader
    const finishTimer = setTimeout(() => {
      setIsFinished(true);
      try {
        sessionStorage.setItem("versus_boot_completed", "true");
      } catch (e) {}
      if (onComplete) {
        onComplete("/dashboard");
      }
    }, durationMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onComplete]);

  if (isFinished && !forcePlay) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Carregando sistema"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-700 ease-out ${
        isExiting
          ? "opacity-0 scale-[1.04] blur-md pointer-events-none"
          : "opacity-100 scale-100 blur-0 pointer-events-auto"
      }`}
      style={{
        backgroundColor: effectiveIsWhatsApp
          ? "#0B141A"
          : isCleanTheme
            ? "#F8FAFC"
            : "#050814",
      }}
    >
      {/* 1. CAMADA DE PROFUNDIDADE DE ESTÚDIO (GRADIENTE RADIAL DINÂMICO) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: effectiveIsWhatsApp
            ? "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.16) 0%, rgba(11, 20, 26, 0.85) 55%, #0B141A 100%)"
            : isCleanTheme
              ? "radial-gradient(circle at 50% 50%, rgba(241, 245, 249, 1) 0%, rgba(226, 232, 240, 0.75) 60%, #F8FAFC 100%)"
              : "radial-gradient(circle at 50% 50%, rgba(0, 85, 255, 0.16) 0%, rgba(5, 8, 20, 0.88) 55%, #050814 100%)",
        }}
      />

      {/* 2. MALHA / GRID DE ENGENHARIA HIGH-TECH (3% A 5% DE OPACIDADE COM PONTOS DE CONEXÃO) */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${
          isCleanTheme ? "opacity-[0.05] text-slate-900" : "opacity-[0.04] text-white"
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="vallor-preloader-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="44" cy="0" r="1.5" fill="currentColor" opacity="0.8" />
            <circle cx="0" cy="44" r="1.5" fill="currentColor" opacity="0.8" />
            <circle cx="22" cy="22" r="0.75" fill="currentColor" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vallor-preloader-grid)" />
      </svg>

      {/* 3. AURA LUMINOSA RESPIRATÓRIA ATRÁS DO LOGO (BACKLIGHT GLOW COM BLUR-3XL) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-36 rounded-full blur-[90px] pointer-events-none animate-pulse ${
          effectiveIsWhatsApp
            ? "bg-gradient-to-r from-emerald-600/35 via-teal-400/30 to-emerald-500/35"
            : isCleanTheme
              ? "bg-gradient-to-r from-slate-300/50 via-blue-200/40 to-slate-300/50"
              : "bg-gradient-to-r from-blue-600/40 via-cyan-400/35 to-blue-500/40"
        }`}
        style={{ animationDuration: "2.4s" }}
      />

      {/* 4. CONTEÚDO CENTRAL CINEMATOGRÁFICO: LOGO VALLOR + FEIXE SHIMMER + LINHA LASER */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
        
        {/* CONTAINER DO LOGO CENTRAL VALLOR COM EFEITO DE FEIXE DE LUZ (SHIMMER SWEEP) */}
        <div className="relative overflow-hidden group select-none py-2 px-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vallor/images/logo-vallor.svg"
            alt="VALLOR"
            className={`w-[240px] sm:w-[270px] h-auto object-contain transition-all duration-300 ${
              isCleanTheme
                ? "brightness-0 opacity-85 drop-shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                : effectiveIsWhatsApp
                  ? "brightness-0 invert opacity-100 drop-shadow-[0_0_30px_rgba(16,185,129,0.35)]"
                  : "opacity-95 drop-shadow-[0_0_35px_rgba(0,210,255,0.35)]"
            }`}
            onError={(e) => {
              // Fallback gracioso para a rota direta da marca
              const target = e.currentTarget as HTMLImageElement;
              if (target.src.indexOf("/vallor/Logo_valor_02.svg") === -1) {
                target.src = "/vallor/Logo_valor_02.svg";
              }
            }}
          />

          {/* Feixe de Luz Shimmer Sweep (Varredura de 0% a 100%) */}
          <div
            className="absolute inset-0 pointer-events-none shimmer-light-sweep"
            style={{
              background: isCleanTheme
                ? "linear-gradient(105deg, transparent 25%, rgba(0, 0, 0, 0.12) 50%, transparent 75%)"
                : effectiveIsWhatsApp
                  ? "linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.75) 48%, rgba(16, 185, 129, 0.5) 55%, transparent 80%)"
                  : "linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.8) 48%, rgba(0, 210, 255, 0.5) 55%, transparent 80%)",
            }}
          />
        </div>

        {/* 5. LINHA LASER DE BOOT TECNOLÓGICO (SUBSTITUINDO BARRAS DE LOADING GROSSEIRAS) */}
        {/* Espaçamento preciso de 32px (mt-8) abaixo do logo */}
        <div className="mt-8 relative w-[180px] h-[1.5px] rounded-full overflow-hidden">
          {/* Trilho base sutil da linha laser */}
          <div
            className={`absolute inset-0 ${
              isCleanTheme
                ? "bg-slate-300/80"
                : effectiveIsWhatsApp
                  ? "bg-emerald-950/80"
                  : "bg-slate-800/90"
            }`}
          />

          {/* Pulso laser em alta velocidade com feixe e brilho luminoso */}
          <div
            className={`absolute top-0 bottom-0 laser-pulse-beam ${
              effectiveIsWhatsApp
                ? "bg-gradient-to-r from-transparent via-[#10B981] to-transparent shadow-[0_0_12px_#10B981]"
                : isCleanTheme
                  ? "bg-gradient-to-r from-transparent via-slate-700 to-transparent shadow-[0_0_8px_rgba(0,0,0,0.25)]"
                  : "bg-gradient-to-r from-transparent via-[#00D2FF] to-transparent shadow-[0_0_14px_#00D2FF]"
            }`}
          />
        </div>

        {/* 6. TEXTO DE ALTA ELEGÂNCIA MONOESPAÇADO (TRACKING LARGO) */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <p
            className={`text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase font-semibold select-none ${
              effectiveIsWhatsApp
                ? "text-emerald-400/90 drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                : isCleanTheme
                  ? "text-slate-500"
                  : "text-cyan-400/90 drop-shadow-[0_0_10px_rgba(0,210,255,0.35)]"
            }`}
          >
            VALLOR ENTERPRISE CORE • SYSTEM ACTIVE
          </p>
        </div>

      </div>

      {/* ESTILOS DE ANIMAÇÃO NATIVOS PURAMENTE CSS (SEM PESO, ALTÍSSIMA TAXA DE QUADROS) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmerSweepAnim {
          0% {
            transform: translateX(-160%) skewX(-20deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(180%) skewX(-20deg);
            opacity: 0;
          }
        }

        .shimmer-light-sweep {
          animation: shimmerSweepAnim 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: transform, opacity;
        }

        @keyframes laserPulseAnim {
          0% {
            left: -40%;
            width: 35%;
            opacity: 0.2;
          }
          50% {
            width: 60%;
            opacity: 1;
          }
          100% {
            left: 100%;
            width: 35%;
            opacity: 0.2;
          }
        }

        .laser-pulse-beam {
          animation: laserPulseAnim 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: left, width, opacity;
        }
      `}} />
    </aside>
  );
}
