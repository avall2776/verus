"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { ArrowRight } from "lucide-react";

interface VersusPreloaderProps {
  onComplete?: (targetHref?: string) => void;
  durationMs?: number;
  forcePlay?: boolean;
  userName?: string;
}

export default function VersusPreloader({
  onComplete,
  durationMs = 3200,
  forcePlay = false,
  userName
}: VersusPreloaderProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [resolvedUserName, setResolvedUserName] = useState<string>(userName || "");

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

  // ================= 1. MOTOR 3D THREE.JS: MONÓLITO "V" + PARALLAX =================
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Cena e Névoa Atmosférica Corporativa
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.015);

    // Câmera de Estúdio
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

    // Renderer com Antialias e Alpha
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // ================= CONSTRUÇÃO DA LETRA "V" 3D =================
    const shape = new THREE.Shape();
    // Braço esquerdo externo para topo esquerdo
    shape.moveTo(-5.5, 6.5);
    // Braço esquerdo interno
    shape.lineTo(-2.2, 6.5);
    // Vale central interno
    shape.lineTo(0, -0.8);
    // Braço direito interno
    shape.lineTo(2.2, 6.5);
    // Braço direito externo
    shape.lineTo(5.5, 6.5);
    // Base direita externa
    shape.lineTo(1.1, -5.5);
    // Vértice inferior
    shape.lineTo(0, -7.5);
    // Base esquerda externa
    shape.lineTo(-1.1, -5.5);
    shape.closePath();

    // Extrusão 3D com chanfros geométricos polidos
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 2,
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.45,
      bevelOffset: 0,
      bevelSegments: 5,
    };

    const vGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    vGeometry.center(); // Centraliza o pivô no exato baricentro do V

    // Material Metálico Escuro Estilo Titânio Corporativo
    const vMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a1322,
      metalness: 0.92,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
      transmission: 0.05,
    });

    const vMesh = new THREE.Mesh(vGeometry, vMaterial);
    // Posiciona o V ligeiramente elevado no campo de visão
    vMesh.position.set(0, 2.2, 0);
    scene.add(vMesh);

    // Linhas de borda luminosas (Edges sutis ciano neon)
    const vEdges = new THREE.EdgesGeometry(vGeometry, 24);
    const vEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const vEdgeLines = new THREE.LineSegments(vEdges, vEdgeMaterial);
    vMesh.add(vEdgeLines);

    // ================= ILUMINAÇÃO DE ESTÚDIO CINEMATOGRÁFICA =================
    // Luz ambiente suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Key Light Direcional (Ciano)
    const keyLight = new THREE.DirectionalLight(0x00d2ff, 2.6);
    keyLight.position.set(16, 20, 20);
    scene.add(keyLight);

    // Rim Light Oposta (Azul Cobalto Corporativo)
    const rimLight = new THREE.DirectionalLight(0x2563eb, 2.0);
    rimLight.position.set(-18, -12, -15);
    scene.add(rimLight);

    // Feixe Pontual Orbitante (Gera os reflexos dinâmicos nas facetas do V)
    const glintLight = new THREE.PointLight(0x00d2ff, 3.2, 45);
    scene.add(glintLight);

    // ================= MICRO-PARTÍCULAS ESTELARES (PROFUNDIDADE 3D) =================
    const particleCount = 600;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 85;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 65;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    // Textura circular suave para as partículas
    const pCanvas = document.createElement("canvas");
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext("2d");
    if (pCtx) {
      const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 14);
      grad.addColorStop(0, "rgba(0, 210, 255, 0.9)");
      grad.addColorStop(0.5, "rgba(37, 99, 235, 0.35)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.55,
      map: pTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // ================= INTERAÇÃO DE MOUSE (PARALLAX 3D COM INÉRCIA) =================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // ================= LOOP DE RENDERIZAÇÃO =================
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Interpolação suave (lerp) para amortecimento de inércia física
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Animação da Letra "V": Respiração gravitacional + inclinação suave pelo mouse
      vMesh.rotation.y = Math.sin(elapsedTime * 0.75) * 0.18 + mouse.x * 0.5;
      vMesh.rotation.x = Math.cos(elapsedTime * 0.55) * 0.1 - mouse.y * 0.3;
      vMesh.rotation.z = Math.sin(elapsedTime * 0.35) * 0.05;
      vMesh.position.y = 2.2 + Math.sin(elapsedTime * 1.4) * 0.35; // Levitação orgânica

      // Órbita da luz de reflexo nas facetas
      glintLight.position.x = Math.sin(elapsedTime * 1.3) * 14;
      glintLight.position.y = Math.cos(elapsedTime * 1.0) * 9 + 2;
      glintLight.position.z = Math.cos(elapsedTime * 1.3) * 12 + 8;

      // Rotação suave do campo de partículas
      particles.rotation.y = elapsedTime * 0.03;
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
      vGeometry.dispose();
      vMaterial.dispose();
      vEdges.dispose();
      vEdgeMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      pTexture.dispose();
      renderer.dispose();
    };
  }, []);

  // ================= 2. TRANSIÇÃO SUAVE / DISMISS =================
  const handleDismiss = () => {
    if (isExiting) return;
    try {
      sessionStorage.setItem("versus_boot_completed", "true");
    } catch (e) {}

    setIsExiting(true);
    // Tempo exato para a transição de fade-out (1000ms) se concluir suavemente
    setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete("/dashboard");
    }, 1000);
  };

  // Timer automático para início da transição suave após o durationMs
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs]);

  // Tecla ESC ou Espaço para dispensar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isFinished && !forcePlay) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 bg-[#050814] overflow-hidden select-none cursor-pointer transition-all duration-1000 ease-in-out ${
        isExiting
          ? "opacity-0 scale-105 pointer-events-none filter blur-md"
          : "opacity-100 scale-100 filter blur-0"
      }`}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {/* Estilos CSS Inline de Animações Especiais */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 25px rgba(0, 210, 255, 0.45)); opacity: 0.92; }
          50% { filter: drop-shadow(0 0 50px rgba(0, 210, 255, 0.8)); opacity: 1; }
        }
        @keyframes shimmerLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .anim-pulse-glow {
          animation: pulseGlow 3.5s ease-in-out infinite;
        }
        .anim-shimmer {
          animation: shimmerLine 2.2s ease-in-out infinite;
        }
      `}} />

      {/* Canvas 3D Three.js do "V" Monolítico de Fundo */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Iluminação Volumétrica Central Suave */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Topo: Espaço limpo e sem poluição */}
      <div className="w-full flex items-center justify-end z-10 pt-2 opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-[11px] font-mono tracking-wider text-slate-400">
          Pressione ESC ou clique para entrar
        </span>
      </div>

      {/* CENTRO: Logomarca VERSUS + Frase de Efeito (Posicionada harmonicamente abaixo do V 3D) */}
      <div className="w-full my-auto flex flex-col items-center justify-center text-center z-10 pointer-events-none mt-32 sm:mt-40">
        
        {/* Logomarca VERSUS */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-[0.32em] pl-4 anim-pulse-glow leading-none drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
          VERSUS
        </h1>

        {/* Frase de Efeito Oficial */}
        <p className="text-xs sm:text-sm font-semibold tracking-[0.26em] uppercase text-slate-300 mt-4 max-w-xl leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          Inteligência em Vendas &amp; Atendimento Omnichannel
        </p>

        {/* Mensagem de Boas-Vindas Elegante */}
        <div className="mt-8 flex flex-col items-center space-y-3">
          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00d2ff]" />
            <span>
              {resolvedUserName
                ? `Bem-vindo de volta, ${resolvedUserName}`
                : "Bem-vindo ao seu ecossistema corporativo"}
            </span>
          </p>

          {/* Linha Luminescente Monocromática Minimalista */}
          <div className="w-44 h-[2px] bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-24 anim-shimmer" />
          </div>
        </div>

      </div>

      {/* RODAPÉ: Ação Discreta de Entrada */}
      <div className="w-full flex flex-col items-center pb-4 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="group inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0B1224]/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-xl transition-all shadow-xl hover:shadow-cyan-500/10"
        >
          <span>Acessar Painel Principal</span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
