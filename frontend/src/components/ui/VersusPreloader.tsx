"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import { VallGlyph, RGlyph } from "./VallorGlyphs";

interface VersusPreloaderProps {
  onComplete?: (targetHref?: string) => void;
  durationMs?: number;
  forcePlay?: boolean;
  userName?: string;
}

// ================= COMPONENTE OCEANO DE DADOS THREE.JS (AZUL CLÁSSICO FIXO DA VALLOR) =================
// Idêntico ao efeito visual da tela de login: azul corporativo clássico, sem quadradinhos, ondulação 3D contínua
const PreloaderParticles = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    // Fundo azul corporativo clássico e profundo (#070D1B)
    const bgColor = 0x070d1b;
    scene.fog = new THREE.FogExp2(bgColor, 0.022);

    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(bgColor, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Textura circular suave para as bolinhas de dados
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    const circleTexture = new THREE.CanvasTexture(canvas);

    // Grid 3D de Partículas (Onda com bolinhas / efeito paradoxo)
    const SEPARATION = 3,
      AMOUNTX = 70,
      AMOUNTY = 70;
    const numParticles = AMOUNTX * AMOUNTY;

    const positions = new Float32Array(numParticles * 3);
    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions[i] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        positions[i + 1] = 0;
        positions[i + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        i += 3;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Cor azul corporativo clássica da plataforma
    const material = new THREE.PointsMaterial({
      color: 0x3b82f6,
      size: 0.28,
      map: circleTexture,
      alphaTest: 0.3,
      transparent: true,
      opacity: 0.65,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onPointerMove = (e: MouseEvent) => {
      targetX = (e.clientX - windowHalfX) * 0.07;
      targetY = (e.clientY - windowHalfY) * 0.07;
    };
    window.addEventListener("mousemove", onPointerMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    let count = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY + 12 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      const posArray = particles.geometry.attributes.position.array as Float32Array;

      let pIdx = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          posArray[pIdx + 1] =
            Math.sin((ix + count) * 0.3) * 2 + Math.sin((iy + count) * 0.4) * 2;
          pIdx += 3;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      count += 0.035;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none overflow-hidden" />;
};

// ================= COMPONENTE PRINCIPAL VERSUSPRELOADER =================
// 100% FIXO NO AZUL CLÁSSICO CORPORATIVO DA VALLOR (NUNCA MUDA COM TEMA CLEAN OU WHATSAPP)
export default function VersusPreloader({
  onComplete,
  durationMs = 15000, // 15 segundos solicitados pelo usuário para leitura confortável
  forcePlay = false,
}: VersusPreloaderProps) {
  // Estágios da animação:
  // 0 = Initial Spin (0s - 3s): Círculo "O" gira isolado e centrado no meio da tela
  // 1 = Reveal Word (3s - 5.5s): "O" desloca lateralmente revelando "VALL" e "R"
  // 2 = Signature & Telemetry (5.5s - 13.5s): "by Avall" surge e telemetria de inicialização é exibida
  // 3 = Boot Ready (13.5s - 15s): Sistema pronto, scale-up 1.03 e transição suave de fade-out
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Status de telemetria legível com ritmo cinematográfico
  const [statusText, setStatusText] = useState("INICIALIZANDO MOTOR CENTRAL VALLOR...");
  const [progressPercent, setProgressPercent] = useState(14);

  // Detecção de viewport para cálculo dinâmico de coordenadas
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Atalho do teclado: Tecla ESC pula a introdução imediatamente
  const finishBootNow = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsFinished(true);
      try {
        sessionStorage.setItem("versus_boot_completed", "true");
      } catch (e) {}
      if (onComplete) onComplete("/dashboard");
    }, 450);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finishBootNow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Orquestração temporal dos 15 segundos cinematográficos
  useEffect(() => {
    setStage(0);
    setIsExiting(false);
    setIsFinished(false);
    setStatusText("INICIALIZANDO MOTOR CENTRAL VALLOR...");
    setProgressPercent(14);

    // 1. Aos 3.0 segundos: Inicia deslocamento lateral do 'O' e revela 'VALL' e 'R'
    const t1 = setTimeout(() => {
      setStage(1);
      setStatusText("IDENTIDADE VISUAL & MÓDULOS DE INTERFACE CARREGADOS");
      setProgressPercent(36);
    }, 3000);

    // 2. Aos 5.5 segundos: Palavra VALLOR consolidada, surge 'by Avall'
    const t2 = setTimeout(() => {
      setStage(2);
      setStatusText("VERIFICANDO PROTOCOLOS DE SEGURANÇA E CRIPTOGRAFIA");
      setProgressPercent(58);
    }, 5500);

    // 3. Aos 8.5 segundos: Carregando módulos de atendimento e CRM
    const t3 = setTimeout(() => {
      setStatusText("SINCRONIZANDO WORKFLOWS, ATENDIMENTO & FUNIL CRM");
      setProgressPercent(82);
    }, 8500);

    // 4. Aos 11.5 segundos: Conexão concluída com 100%
    const t4 = setTimeout(() => {
      setStage(3);
      setStatusText("CONEXÃO ESTÁVEL • SISTEMA PRONTO PARA OPERAÇÃO");
      setProgressPercent(100);
    }, 11500);

    // 5. Aos 14.2 segundos: Transição de saída suave (scale 1.03 + blur 10px)
    const exitLeadTime = 800;
    const exitDelay = Math.max(2000, durationMs - exitLeadTime);
    const tExit = setTimeout(() => {
      setIsExiting(true);
    }, exitDelay);

    // 6. Finalização e entrega do Dashboard aos 15 segundos
    const tFinish = setTimeout(() => {
      setIsFinished(true);
      try {
        sessionStorage.setItem("versus_boot_completed", "true");
      } catch (e) {}
      if (onComplete) {
        onComplete("/dashboard");
      }
    }, durationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tExit);
      clearTimeout(tFinish);
    };
  }, [durationMs, onComplete, forcePlay]);

  if (isFinished && !forcePlay) return null;

  // ================= GEOMETRIA E ALINHAMENTO MATEMÁTICO DOS GLIFOS =================
  // Proporções oficiais extraídas da marca VALLOR (viewBox: 290 168 1340 232)
  // Altura base no desktop: 64px (destaque visual imponente) | mobile: 48px
  const logoHeight = isMobile ? 48 : 64;
  const vallWidth = isMobile ? 177 : 236;
  const oWidth = isMobile ? 48 : 64;
  const rWidth = isMobile ? 47 : 62;
  const gap1 = isMobile ? 2 : 3;
  const gap2 = isMobile ? 4 : 5;
  const totalWordWidth = vallWidth + gap1 + oWidth + gap2 + rWidth;

  // Distância necessária para o centro de 'O' coincidir com o centro da tela no Estágio 0
  const shiftX = Math.round(vallWidth + gap1 + oWidth / 2 - totalWordWidth / 2);

  return (
    <motion.aside
      role="status"
      aria-live="polite"
      aria-label="Carregando plataforma VALLOR"
      initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      animate={
        isExiting
          ? { opacity: 0, scale: 1.03, filter: "blur(10px)" }
          : { opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        backgroundColor: "#070D1B",
        pointerEvents: isExiting ? "none" : "auto",
      }}
    >
      {/* 1. FUNDO THREE.JS: OCEANO DE DADOS AZUL CORPORATIVO (SEM QUADRADINHOS) */}
      <PreloaderParticles />

      {/* 2. GRADIENTE RADIAL AZUL MARINHO PROFUNDO (DEEP NAVY / OBSIDIANA) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(11, 25, 44, 0.65) 0%, rgba(7, 13, 27, 0.92) 55%, #050814 100%)",
        }}
      />

      {/* 3. AURA LUMINOSA TRANSLÚCIDA (BACKLIGHT GLOW AZUL/CIANO ATRÁS DO LOGO) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[500px] h-[200px] rounded-full blur-[100px] pointer-events-none transition-all duration-700 animate-pulse z-[2] bg-gradient-to-r from-blue-600/40 via-cyan-400/35 to-blue-500/40"
        style={{ animationDuration: "3.2s" }}
      />

      {/* 4. CONTEÚDO CENTRAL: LOGO MOTION DESIGN COM VETORES INLINE (ZERO 404) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        
        {/* CONTAINER DO LOGOTIPO VALLOR (LARGURA FIXA E RIGOROSAMENTE CENTRALIZADA) */}
        <div
          className="relative flex items-center justify-center"
          style={{ height: logoHeight, width: totalWordWidth }}
        >
          {/* ================= LETRAS 'V - A - L - L' (VETOR EMBEDDED - ZERO 404) ================= */}
          <motion.div
            style={{ width: vallWidth, height: logoHeight }}
            initial={{ opacity: 0, x: -45 }}
            animate={
              stage >= 1
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: -45 }
            }
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="shrink-0 flex items-center justify-end overflow-hidden"
          >
            <VallGlyph
              className="h-full w-auto select-none pointer-events-none transition-all brightness-100 opacity-95 drop-shadow-[0_2px_20px_rgba(255,255,255,0.12)]"
            />
          </motion.div>

          {/* GAP 1 */}
          <div style={{ width: gap1 }} className="shrink-0" />

          {/* ================= ÍCONE 'O' - SPINNER PROTAGONISTA DE MOTION DESIGN ================= */}
          {/* Começa em x: -shiftX (centro exato da tela) e desliza suavemente para x: 0 */}
          <motion.div
            style={{ width: oWidth, height: logoHeight }}
            initial={{ x: -shiftX }}
            animate={{ x: stage >= 1 ? 0 : -shiftX }}
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative shrink-0 flex items-center justify-center z-20"
          >
            {/* Rotação perpétua de 60/120fps sem interrupção */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 1.4,
                ease: "linear",
              }}
              className="w-full h-full flex items-center justify-center origin-center"
            >
              <svg
                viewBox="6 6 244 244"
                className="w-full h-full"
                style={{
                  filter: "drop-shadow(0 0 22px rgba(0, 210, 255, 0.65))",
                }}
              >
                <defs>
                  {/* Gradiente vetorial azul corporativo da marca VALLOR */}
                  <linearGradient id="preloaderMainSpinnerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00A8FF" />
                    <stop offset="50%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>

                {/* Anel de base dimensional sutil */}
                <circle
                  cx="128"
                  cy="128"
                  r="98"
                  fill="none"
                  stroke="rgba(0, 168, 255, 0.22)"
                  strokeWidth="48"
                />

                {/* Anel principal vetorial da VALLOR atuando como spinner */}
                <circle
                  cx="128"
                  cy="128"
                  r="98"
                  fill="none"
                  stroke="url(#preloaderMainSpinnerGrad)"
                  strokeWidth="48"
                  strokeLinecap="round"
                />

                {/* Partícula/Ponto de luz orbital nítido no ápice do gradiente */}
                <circle
                  cx="197"
                  cy="59"
                  r="7.5"
                  fill="#ffffff"
                  opacity="0.95"
                  filter="drop-shadow(0 0 6px rgba(255,255,255,0.95))"
                />
              </svg>
            </motion.div>
          </motion.div>

          {/* GAP 2 */}
          <div style={{ width: gap2 }} className="shrink-0" />

          {/* ================= LETRA 'R' (VETOR EMBEDDED - ZERO 404) ================= */}
          <motion.div
            style={{ width: rWidth, height: logoHeight }}
            initial={{ opacity: 0, x: 35 }}
            animate={
              stage >= 1
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: 35 }
            }
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="shrink-0 flex items-center justify-start overflow-hidden"
          >
            <RGlyph
              className="h-full w-auto select-none pointer-events-none transition-all brightness-100 opacity-95 drop-shadow-[0_2px_20px_rgba(255,255,255,0.12)]"
            />
          </motion.div>
        </div>

        {/* 5. ASSINATURA ELEGANTE 'by Avall' COM FADE-IN SUAVE E TRACKING EXPANSIVO */}
        <motion.div
          initial={{ opacity: 0, y: 12, letterSpacing: "0.18em" }}
          animate={
            stage >= 2
              ? { opacity: 1, y: 0, letterSpacing: "0.36em" }
              : { opacity: 0, y: 12, letterSpacing: "0.18em" }
          }
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 flex items-center justify-center select-none"
        >
          <span
            className="text-xs sm:text-[14px] font-medium tracking-[0.36em] uppercase transition-colors text-cyan-400/95 drop-shadow-[0_0_16px_rgba(0,210,255,0.35)]"
          >
            by Avall
          </span>
        </motion.div>

        {/* 6. TELEMETRIA E BARRA DE PROGRESSO DE ALTA FIDELIDADE (LEGÍVEL E CONFORTÁVEL) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={stage >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.8 }}
          className="mt-8 flex flex-col items-center gap-3 w-full max-w-[340px] sm:max-w-[420px]"
        >
          {/* Trilho de Progresso com Preenchimento Gradativo em Tempo Real */}
          <div className="relative w-full h-[2.5px] rounded-full overflow-hidden bg-slate-800/90">
            <motion.div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-400 shadow-[0_0_14px_#00D2FF]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Linha com Status Legível e Contador Numérico de Percentual */}
          <div className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-mono tracking-wider">
            <p
              key={statusText}
              className="uppercase font-semibold transition-all duration-500 animate-fadeIn text-cyan-400"
            >
              {statusText}
            </p>
            <span
              className="font-mono font-bold shrink-0 ml-3 text-cyan-400/80"
            >
              {progressPercent}%
            </span>
          </div>
        </motion.div>

        {/* 7. BOTÃO DISCRETO PARA PULAR [ESC] (CASO O OPERADOR DESEJE AGILIDADE) */}
        <button
          onClick={finishBootNow}
          className="mt-8 text-[10px] font-mono tracking-[0.25em] text-slate-500 hover:text-slate-300 transition-colors uppercase cursor-pointer"
          title="Pressione ESC ou clique para entrar imediatamente no sistema"
        >
          Pular Introdução [ESC]
        </button>

      </div>

      {/* ESTILOS DE ANIMAÇÃO NATIVOS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInAnim {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeInAnim 0.4s ease-out forwards;
        }
      `}} />
    </motion.aside>
  );
}
