"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { Cpu, ShieldCheck, Sparkles, Zap, CheckCircle2, ArrowRight } from "lucide-react";

interface VersusPreloaderProps {
  onComplete?: () => void;
  durationMs?: number;
  mode?: "fullscreen" | "card";
  forcePlay?: boolean;
}

const BOOT_STAGES = [
  { percent: 18, label: "Sincronizando workspaces e credenciais multitenant...", tag: "AUTH · OK", color: "text-blue-400" },
  { percent: 42, label: "Inicializando barramento neural dos Agentes de IA...", tag: "NEURAL · ONLINE", color: "text-cyan-400" },
  { percent: 68, label: "Conectando instâncias do WhatsApp e WebSocket ao vivo...", tag: "SOCKET · CONECTADO", color: "text-emerald-400" },
  { percent: 88, label: "Compilando pipeline de vendas e telemetria do CRM...", tag: "CRM · SINCRONIZADO", color: "text-blue-400" },
  { percent: 100, label: "Núcleo VERSUS operacional. Inicializando workspace!", tag: "CORE · PRONTO", color: "text-emerald-400" }
];

export default function VersusPreloader({
  onComplete,
  durationMs = 2800,
  mode = "fullscreen",
  forcePlay = false
}: VersusPreloaderProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // ================= EFEITO 3D THREE.JS DE ALTO IMPACTO =================
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.02);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 38);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. Textura suave para partículas
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.3, "rgba(0, 210, 255, 0.8)");
      gradient.addColorStop(0.8, "rgba(37, 99, 235, 0.3)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    // 2. Campo de Partículas Quânticas Esféricas / Vortex
    const particleCount = 1400;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 12 + Math.random() * 26;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
      particleScales[i] = Math.random() * 0.8 + 0.4;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.65,
      map: particleTexture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 3. Anéis Holográficos Orbitais (Giroscópio Cibernético)
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const createHoloRing = (radius: number, color: number) => {
      const geom = new THREE.RingGeometry(radius - 0.05, radius + 0.05, 64);
      const edges = new THREE.EdgesGeometry(geom);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      });
      return new THREE.LineSegments(edges, mat);
    };

    const ring1 = createHoloRing(10, 0x00d2ff);
    const ring2 = createHoloRing(14, 0x2563eb);
    const ring3 = createHoloRing(18, 0x38bdf8);

    ringGroup.add(ring1);
    ringGroup.add(ring2);
    ringGroup.add(ring3);

    // 4. Núcleo Central de Pulso
    const coreGeometry = new THREE.IcosahedronGeometry(3.5, 1);
    const coreWireframe = new THREE.WireframeGeometry(coreGeometry);
    const coreMaterial = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.LineSegments(coreWireframe, coreMaterial);
    ringGroup.add(coreMesh);

    // Loop de Animação
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotação do campo de partículas
      particles.rotation.y = elapsedTime * 0.08;
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.12;

      // Movimento do giroscópio holográfico
      ring1.rotation.x = elapsedTime * 0.45;
      ring1.rotation.y = elapsedTime * 0.3;
      ring2.rotation.y = -elapsedTime * 0.35;
      ring2.rotation.z = elapsedTime * 0.25;
      ring3.rotation.x = -elapsedTime * 0.2;
      ring3.rotation.z = -elapsedTime * 0.4;

      // Pulsação suave do núcleo
      const scale = 1 + Math.sin(elapsedTime * 3) * 0.06;
      coreMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, []);

  // ================= PROGRESSÃO DA TELEMETRIA =================
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / durationMs) * 100));

      setProgress(rawProgress);

      // Atualiza o estágio correspondente
      const stageIdx = BOOT_STAGES.findIndex((s) => rawProgress <= s.percent);
      if (stageIdx !== -1) {
        setCurrentStageIndex(stageIdx);
      } else {
        setCurrentStageIndex(BOOT_STAGES.length - 1);
      }

      if (rawProgress >= 100) {
        clearInterval(interval);
        // Dispara transição suave de saída
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setIsFinished(true);
            if (onComplete) onComplete();
          }, 600);
        }, 300);
      }
    }, 25);

    // Suporte à tecla ESC para pular imediatamente
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearInterval(interval);
        setProgress(100);
        setIsExiting(true);
        setTimeout(() => {
          setIsFinished(true);
          if (onComplete) onComplete();
        }, 300);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [durationMs, onComplete]);

  if (isFinished && !forcePlay) return null;

  const currentStage = BOOT_STAGES[currentStageIndex] || BOOT_STAGES[BOOT_STAGES.length - 1];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050814] overflow-hidden transition-all duration-700 ease-out select-none ${
        isExiting ? "opacity-0 scale-105 pointer-events-none blur-sm" : "opacity-100 scale-100"
      }`}
    >
      {/* Estilos CSS Inline de Animações Especiais de Alto Impacto */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 25px rgba(0, 210, 255, 0.45)); opacity: 0.9; }
          50% { filter: drop-shadow(0 0 55px rgba(0, 210, 255, 0.85)); opacity: 1; }
        }
        .anim-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .anim-scanline {
          animation: scanline 4s linear infinite;
        }
      `}} />

      {/* Canvas 3D de Fundo */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Brilhos Volumétricos Monocromáticos de Fundo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Linha de Varredura Scanline Estilo Cyberpunk Corporativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="w-full h-24 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent anim-scanline" />
      </div>

      {/* Botão Superior Discreto para Pular */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              setIsFinished(true);
              if (onComplete) onComplete();
            }, 300);
          }}
          className="px-3.5 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 text-xs font-semibold backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 group"
        >
          <span>Pular</span>
          <span className="text-[10px] text-slate-500 font-mono group-hover:text-slate-300">ESC</span>
        </button>
      </div>

      {/* Conteúdo Central do Preloader */}
      <div className="relative z-10 w-full max-w-xl px-6 flex flex-col items-center text-center">
        
        {/* Badge Corporativo de Inicialização */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B1224]/90 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(0,210,255,0.2)] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <Cpu className="w-3.5 h-3.5" />
          <span>VERSUS ENTERPRISE CORE v2.4</span>
        </div>

        {/* Logotipo Central com Efeito Holográfico e Glow */}
        <div className="mb-6 flex flex-col items-center">
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-[0.25em] pl-3 anim-pulse-glow leading-none">
            VERSUS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-semibold tracking-[0.3em] uppercase mt-3 text-cyan-200/80">
            Inteligência em Vendas & Atendimento Omnichannel
          </p>
        </div>

        {/* Bloco de Telemetria e Barra de Progresso */}
        <div className="w-full bg-[#0B1224]/85 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-xl mt-4">
          
          {/* Header da Telemetria: Status e Porcentagem */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Inicializando Subsistemas
              </span>
            </div>
            <div className="flex items-baseline gap-1 font-mono font-black text-lg text-cyan-400 tracking-wider">
              <span>{progress}</span>
              <span className="text-xs text-slate-400">%</span>
            </div>
          </div>

          {/* Barra de Progresso com Glow e Gradiente */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/50 relative shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 transition-all duration-75 relative shadow-[0_0_15px_rgba(0,210,255,0.7)]"
              style={{ width: `${progress}%` }}
            >
              {/* Ponto luminescente na extremidade */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            </div>
          </div>

          {/* Log Dinâmico de Mensagens do Sistema */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: "4s" }} />
              </div>
              <p className="text-xs text-slate-300 font-mono truncate">
                {currentStage.label}
              </p>
            </div>
            
            <span className={`text-[10px] font-mono font-bold shrink-0 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 ${currentStage.color}`}>
              {currentStage.tag}
            </span>
          </div>

        </div>

        {/* Rodapé da Telemetria */}
        <div className="flex items-center justify-between w-full mt-6 px-2 text-[11px] text-slate-500 font-mono">
          <span>HOST: VERSUS-CLOUD</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sessão Criptografada SSL/TLS</span>
          </span>
          <span>LATÊNCIA: 12ms</span>
        </div>

      </div>

    </div>
  );
}
