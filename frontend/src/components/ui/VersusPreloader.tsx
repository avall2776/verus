"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Gerenciamento de estágios de motion design:
  // 0 = Initial Spin: o círculo "O" gira isolado e perfeitamente centralizado na tela
  // 1 = Reveal Word: o "O" faz movimento lateral revelando "VALL" e "R", compondo "VALLOR"
  // 2 = Signature & Ready: a palavra está fixa e centralizada, "O" continua girando como spinner, "by Avall" surge
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Fallback seguro de tema baseado no contexto e classes DOM
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

  // Detecção de viewport para cálculo dinâmico de coordenadas
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Orquestração temporal da coreografia visual (respeita durationMs >= 2200ms)
  useEffect(() => {
    // Reset para replay forçado
    setStage(0);
    setIsExiting(false);
    setIsFinished(false);

    // Etapa 1: O "O" começa no centro e inicia o movimento lateral aos 750ms
    const timerStage1 = setTimeout(() => {
      setStage(1);
    }, 750);

    // Etapa 2: Aos 1550ms a palavra VALLOR está completa, "by Avall" surge com tracking
    const timerStage2 = setTimeout(() => {
      setStage(2);
    }, 1550);

    // Etapa 3: Transição de saída suave (scale 1.03 + blur fade-out) 650ms antes do encerramento
    const exitLeadTime = 650;
    const exitDelay = Math.max(1600, durationMs - exitLeadTime);
    const timerExit = setTimeout(() => {
      setIsExiting(true);
    }, exitDelay);

    // Etapa 4: Finalização e liberação do Dashboard
    const timerFinish = setTimeout(() => {
      setIsFinished(true);
      try {
        sessionStorage.setItem("versus_boot_completed", "true");
      } catch (e) {}
      if (onComplete) {
        onComplete("/dashboard");
      }
    }, durationMs);

    return () => {
      clearTimeout(timerStage1);
      clearTimeout(timerStage2);
      clearTimeout(timerExit);
      clearTimeout(timerFinish);
    };
  }, [durationMs, onComplete, forcePlay]);

  if (isFinished && !forcePlay) return null;

  // ================= GEOMETRIA E ALINHAMENTO MATEMÁTICO DOS GLIFOS =================
  // Altura base: 54px no desktop, 44px no mobile
  // Proporções oficiais extraídas da marca VALLOR (viewBox total: 290 168 1340 232):
  // "VALL": 855 / 232 -> ratio ~ 3.6853
  // "O": 243 / 232 -> círculo vetorial 1:1 concentricamente centrado
  // "R": 225 / 232 -> ratio ~ 0.9698
  const logoHeight = isMobile ? 44 : 54;
  const vallWidth = isMobile ? 162 : 199;
  const oWidth = isMobile ? 44 : 54;
  const rWidth = isMobile ? 43 : 52;
  const gap1 = 2; // gap entre VALL e O
  const gap2 = isMobile ? 3 : 4; // gap entre O e R
  const totalWordWidth = vallWidth + gap1 + oWidth + gap2 + rWidth;

  // Distância exata necessária para o centro de "O" coincidir com o centro da tela no Estágio 0
  // Centro da palavra = totalWordWidth / 2
  // Centro do "O" dentro da palavra = vallWidth + gap1 + (oWidth / 2)
  // shiftX = (centro do "O") - (centro da palavra)
  const shiftX = Math.round(vallWidth + gap1 + oWidth / 2 - totalWordWidth / 2);

  return (
    <motion.aside
      role="status"
      aria-live="polite"
      aria-label="Carregando sistema VALLOR"
      initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      animate={
        isExiting
          ? { opacity: 0, scale: 1.03, filter: "blur(8px)" }
          : { opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        backgroundColor: effectiveIsWhatsApp
          ? "#0B141A"
          : isCleanTheme
            ? "#F8FAFC"
            : "#050814",
        pointerEvents: isExiting ? "none" : "auto",
      }}
    >
      {/* 1. CENÁRIO & ILUMINAÇÃO: DEGRADÊ RADIAL CINEMATOGRÁFICO DE ESTÚDIO */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: effectiveIsWhatsApp
            ? "radial-gradient(ellipse at 50% 50%, #052E24 0%, rgba(11, 20, 26, 0.88) 55%, #0B141A 100%)"
            : isCleanTheme
              ? "radial-gradient(ellipse at 50% 50%, #FFFFFF 0%, #F1F5F9 60%, #E2E8F0 100%)"
              : "radial-gradient(ellipse at 50% 50%, #002244 0%, #0A192F 42%, #050814 100%)",
        }}
      />

      {/* 2. MALHA / GRID DE ENGENHARIA HIGH-TECH (OPACIDADE SUTIL COM NÓS DE CONEXÃO) */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${
          isCleanTheme ? "opacity-[0.04] text-slate-900" : "opacity-[0.035] text-white"
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="vallor-preloader-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="44" cy="0" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="0" cy="44" r="1.5" fill="currentColor" opacity="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vallor-preloader-grid)" />
      </svg>

      {/* 3. AURA LUMINOSA (BACKLIGHT GLOW TRANSLÚCIDO ATRÁS DO LOGO COM BLUR INTENSO) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[440px] h-[160px] rounded-full blur-[95px] pointer-events-none transition-all duration-700 animate-pulse ${
          effectiveIsWhatsApp
            ? "bg-gradient-to-r from-emerald-600/35 via-teal-400/25 to-emerald-500/35"
            : isCleanTheme
              ? "bg-gradient-to-r from-blue-200/40 via-cyan-100/35 to-blue-200/40"
              : "bg-gradient-to-r from-blue-600/35 via-cyan-400/30 to-blue-500/35"
        }`}
        style={{ animationDuration: "2.8s" }}
      />

      {/* 4. CONTEÚDO CENTRAL: LOGO MOTION DESIGN COM O 'O' COMO SPINNER PROTAGONISTA */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        
        {/* CONTAINER DO LOGOTIPO VALLOR (LARGURA FIXA E CENTRALIZADA NO VIEWPORT) */}
        <div
          className="relative flex items-center justify-center"
          style={{ height: logoHeight, width: totalWordWidth }}
        >
          {/* ================= LETRAS 'V - A - L - L' ================= */}
          <motion.div
            style={{ width: vallWidth, height: logoHeight }}
            initial={{ opacity: 0, x: -35 }}
            animate={
              stage >= 1
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: -35 }
            }
            transition={{
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="shrink-0 flex items-center justify-end overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/preloader/vallor_vall.svg"
              alt="VALL"
              className={`h-full w-auto object-contain select-none pointer-events-none transition-all ${
                isCleanTheme
                  ? "brightness-0 opacity-85"
                  : effectiveIsWhatsApp
                    ? "brightness-100 opacity-95 drop-shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                    : "brightness-100 opacity-95 drop-shadow-[0_2px_15px_rgba(255,255,255,0.1)]"
              }`}
            />
          </motion.div>

          {/* GAP 1 */}
          <div style={{ width: gap1 }} className="shrink-0" />

          {/* ================= ÍCONE 'O' - SPINNER PROTAGONISTA ================= */}
          {/* Inicia com x: -shiftX (perfeitamente no centro da tela) e translada para x: 0 */}
          <motion.div
            style={{ width: oWidth, height: logoHeight }}
            initial={{ x: -shiftX }}
            animate={{ x: stage >= 1 ? 0 : -shiftX }}
            transition={{
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1], // Desaceleração suave padrão Apple/Framer
            }}
            className="relative shrink-0 flex items-center justify-center z-20"
          >
            {/* Rotação linear perpétua e independente do spinner (60/120fps) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 1.35,
                ease: "linear",
              }}
              className="w-full h-full flex items-center justify-center origin-center"
            >
              <svg
                viewBox="6 6 244 244"
                className="w-full h-full"
                style={{
                  filter: effectiveIsWhatsApp
                    ? "drop-shadow(0 0 14px rgba(16, 185, 129, 0.45))"
                    : isCleanTheme
                      ? "drop-shadow(0 0 10px rgba(37, 99, 235, 0.35))"
                      : "drop-shadow(0 0 18px rgba(0, 210, 255, 0.55))",
                }}
              >
                <defs>
                  {/* Gradiente dinâmico adaptativo da marca VALLOR */}
                  <linearGradient id="vallorPreloaderSpinnerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    {effectiveIsWhatsApp ? (
                      <>
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="50%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#10B981" />
                      </>
                    ) : isCleanTheme ? (
                      <>
                        <stop offset="0%" stopColor="#1D4ED8" />
                        <stop offset="50%" stopColor="#38BDF8" />
                        <stop offset="100%" stopColor="#2563EB" />
                      </>
                    ) : (
                      <>
                        <stop offset="0%" stopColor="#00A8FF" />
                        <stop offset="50%" stopColor="#00E5FF" />
                        <stop offset="100%" stopColor="#2563EB" />
                      </>
                    )}
                  </linearGradient>
                </defs>

                {/* Anel de base dimensional sutil */}
                <circle
                  cx="128"
                  cy="128"
                  r="98"
                  fill="none"
                  stroke={
                    effectiveIsWhatsApp
                      ? "rgba(16, 185, 129, 0.15)"
                      : isCleanTheme
                        ? "rgba(37, 99, 235, 0.12)"
                        : "rgba(0, 168, 255, 0.18)"
                  }
                  strokeWidth="48"
                />

                {/* Anel principal vetorial da VALLOR como spinner contínuo */}
                <circle
                  cx="128"
                  cy="128"
                  r="98"
                  fill="none"
                  stroke="url(#vallorPreloaderSpinnerGrad)"
                  strokeWidth="48"
                  strokeLinecap="round"
                />

                {/* Partícula/Ponto de luz orbital ultra-nítido acompanhando a varredura */}
                <circle
                  cx="197"
                  cy="59"
                  r="7"
                  fill="#ffffff"
                  opacity="0.95"
                  filter="drop-shadow(0 0 6px rgba(255,255,255,0.9))"
                />
              </svg>
            </motion.div>
          </motion.div>

          {/* GAP 2 */}
          <div style={{ width: gap2 }} className="shrink-0" />

          {/* ================= LETRA 'R' ================= */}
          <motion.div
            style={{ width: rWidth, height: logoHeight }}
            initial={{ opacity: 0, x: 25 }}
            animate={
              stage >= 1
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: 25 }
            }
            transition={{
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="shrink-0 flex items-center justify-start overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/preloader/vallor_r.svg"
              alt="R"
              className={`h-full w-auto object-contain select-none pointer-events-none transition-all ${
                isCleanTheme
                  ? "brightness-0 opacity-85"
                  : effectiveIsWhatsApp
                    ? "brightness-100 opacity-95 drop-shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                    : "brightness-100 opacity-95 drop-shadow-[0_2px_15px_rgba(255,255,255,0.1)]"
              }`}
            />
          </motion.div>
        </div>

        {/* 5. ASSINATURA ELEGANTE 'by Avall' COM FADE-IN E TRACKING TIPOGRÁFICO EXPANSIVO */}
        <motion.div
          initial={{ opacity: 0, y: 10, letterSpacing: "0.15em" }}
          animate={
            stage >= 2
              ? { opacity: 1, y: 0, letterSpacing: "0.32em" }
              : { opacity: 0, y: 10, letterSpacing: "0.15em" }
          }
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 flex items-center justify-center select-none"
        >
          <span
            className={`text-xs sm:text-[13px] font-medium tracking-[0.32em] uppercase transition-colors ${
              effectiveIsWhatsApp
                ? "text-emerald-400/90 drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : isCleanTheme
                  ? "text-slate-500 font-semibold"
                  : "text-slate-400 dark:text-cyan-400/90 drop-shadow-[0_0_14px_rgba(0,210,255,0.3)]"
            }`}
          >
            by Avall
          </span>
        </motion.div>

        {/* 6. PULSO LASER DE ALTA PRECISÃO E STATUS DO SISTEMA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={stage >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 flex flex-col items-center gap-2.5"
        >
          {/* Trilho base sutil da linha laser */}
          <div
            className={`relative w-36 sm:w-44 h-[1.5px] rounded-full overflow-hidden ${
              isCleanTheme
                ? "bg-slate-300"
                : effectiveIsWhatsApp
                  ? "bg-emerald-950/80"
                  : "bg-slate-800/80"
            }`}
          >
            <div
              className={`absolute top-0 bottom-0 laser-pulse-beam ${
                effectiveIsWhatsApp
                  ? "bg-gradient-to-r from-transparent via-[#10B981] to-transparent shadow-[0_0_10px_#10B981]"
                  : isCleanTheme
                    ? "bg-gradient-to-r from-transparent via-slate-600 to-transparent"
                    : "bg-gradient-to-r from-transparent via-[#00D2FF] to-transparent shadow-[0_0_12px_#00D2FF]"
              }`}
            />
          </div>

          <p
            className={`text-[9.5px] sm:text-[10px] font-mono tracking-[0.22em] uppercase font-semibold ${
              effectiveIsWhatsApp
                ? "text-emerald-500/80"
                : isCleanTheme
                  ? "text-slate-400"
                  : "text-cyan-500/80"
            }`}
          >
            VALLOR CORE • SYSTEM ACTIVE
          </p>
        </motion.div>

      </div>

      {/* ESTILOS CSS NATIVOS PARA O FEIXE LASER (ALTÍSSIMA TAXA DE QUADROS / 60-120FPS) */}
      <style dangerouslySetInnerHTML={{ __html: `
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
    </motion.aside>
  );
}
