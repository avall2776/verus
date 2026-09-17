"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";

interface VersusPreloaderProps {
  onComplete?: (targetHref?: string) => void;
  durationMs?: number;
  forcePlay?: boolean;
  userName?: string;
}

export default function VersusPreloader({
  onComplete,
  durationMs = 15000,
  forcePlay = false,
  userName
}: VersusPreloaderProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [resolvedUserName, setResolvedUserName] = useState<string>(userName || "");
  const [progress, setProgress] = useState<number>(0);

  // Tenta resolver o nome do usuário se não foi passado via props
  useEffect(() => {
    if (userName) {
      setResolvedUserName(userName);
      return;
    }
    try {
      const stored = localStorage.getItem("versus_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) {
          const firstName = parsed.name.split(" ")[0];
          setResolvedUserName(firstName);
        }
      }
    } catch (e) {}
  }, [userName]);

  // ================= MOTOR 3D THREE.JS: BOLÍCULAS SUTIS COM TRANSPARÊNCIA =================
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1224, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x0b1224, 1);
    container.appendChild(renderer.domElement);

    const createCircleTexture = () => {
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
      return new THREE.CanvasTexture(canvas);
    };

    // Campo de bolículas sutis
    const particleCount = 280;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 55;
      particlePositions[i + 1] = (Math.random() - 0.5) * 45;
      particlePositions[i + 2] = (Math.random() - 0.5) * 35;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const pTexture = createCircleTexture();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x3b82f6,
      size: 0.28,
      map: pTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x += (mouse.x * 2 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      particles.rotation.y = elapsedTime * 0.025;
      particles.rotation.x = elapsedTime * 0.015;

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
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      pTexture.dispose();
      renderer.dispose();
    };
  }, []);

  // ================= PROGRESSO DE 15 SEGUNDOS COM TRANSIÇÃO AUTOMÁTICA =================
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(p);

      if (p >= 100) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [durationMs]);

  const handleDismiss = () => {
    if (isExiting) return;
    try {
      sessionStorage.setItem("versus_boot_completed", "true");
    } catch (e) {}

    setIsExiting(true);

    // Fade-out suave automático de 1.000ms antes de transferir a rota
    setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete("/dashboard");
    }, 1000);
  };

  if (isFinished && !forcePlay) return null;

  // Texto dinâmico alternando o carregamento das ferramentas do sistema
  const getToolStatusText = (p: number) => {
    if (p < 20) return "Carregando Operação de Atendimento...";
    if (p < 40) return "Carregando Chat da Equipe...";
    if (p < 60) return "Carregando Funil Comercial & CRM...";
    if (p < 80) return "Sincronizando Módulos de Inteligência Artificial...";
    if (p < 95) return "Carregando Painel Executivo & Métricas...";
    return "Ambiente pronto para operação!";
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 bg-[#0B1224] overflow-hidden select-none transition-all duration-1000 ease-in-out pointer-events-none ${
        isExiting
          ? "opacity-0 scale-105 filter blur-xl"
          : "opacity-100 scale-100 filter blur-0"
      }`}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {/* Canvas 3D de Fundo com bolículas sutis */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Iluminação volumétrica suave */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-950/20 rounded-full blur-[160px] pointer-events-none" />

      {/* CONTEÚDO CENTRALIZADO: Apenas Boas-Vindas + Barra + Status das Ferramentas */}
      <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto px-4 z-10">
        
        {/* Texto de Boas-Vindas */}
        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-wide flex items-center justify-center gap-3.5 drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_#3b82f6]" />
          <span>Bem-vindo de volta, {resolvedUserName || "Felipe"}</span>
        </h2>

        {/* Barra de Status Centralizada */}
        <div className="w-72 sm:w-96 h-[3px] bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Texto de Status das Ferramentas (Alternância Dinâmica) */}
        <p className="text-sm sm:text-base font-mono tracking-wider text-slate-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all duration-300">
          {getToolStatusText(progress)}
        </p>

      </div>
    </div>
  );
}
