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
  durationMs = 6000, // 6 segundos confortáveis para visualização da montagem
  forcePlay = false,
  userName
}: VersusPreloaderProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [resolvedUserName, setResolvedUserName] = useState<string>(userName || "");
  const [assemblyStage, setAssemblyStage] = useState<number>(0);

  // Tenta resolver o nome do usuário caso não tenha sido passado via props
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

  // ================= ESTÁGIOS DA MONTAGEM DO SISTEMA =================
  useEffect(() => {
    const stage1 = setTimeout(() => setAssemblyStage(1), durationMs * 0.35);
    const stage2 = setTimeout(() => setAssemblyStage(2), durationMs * 0.75);

    return () => {
      clearTimeout(stage1);
      clearTimeout(stage2);
    };
  }, [durationMs]);

  // ================= 1. MOTOR 3D THREE.JS: OCEANO DE DADOS (DATA WAVE) + MONÓLITO "V" =================
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Cena com Névoa Atmosférica Idêntica à Tela de Login
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.025);

    // Câmera de Estúdio com a mesma perspectiva da tela de login
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 15, 36);
    camera.lookAt(0, 2, 0);

    // Renderer com Antialias e Alpha
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // ================= HELPER PARA TEXTURA CIRCULAR DAS PARTÍCULAS =================
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

    // ================= OCEANO DE DADOS (DATA WAVE - IDÊNTICO À TELA DE LOGIN) =================
    const SEPARATION = 3, AMOUNTX = 75, AMOUNTY = 75;
    const numParticles = AMOUNTX * AMOUNTY;
    const wavePositions = new Float32Array(numParticles * 3);

    let pIdx = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        wavePositions[pIdx] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
        wavePositions[pIdx + 1] = -4; // Nível base do oceano abaixo do V
        wavePositions[pIdx + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);
        pIdx += 3;
      }
    }

    const waveGeometry = new THREE.BufferGeometry();
    waveGeometry.setAttribute("position", new THREE.BufferAttribute(wavePositions, 3));

    const waveMaterial = new THREE.PointsMaterial({
      color: 0x00d2ff, // Ciano de Acento Oficial VERSUS
      size: 0.28,
      map: createCircleTexture(),
      alphaTest: 0.5,
      transparent: true,
      opacity: 0.65
    });

    const waveParticles = new THREE.Points(waveGeometry, waveMaterial);
    scene.add(waveParticles);

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
    vGeometry.center(); // Centraliza o pivô no baricentro

    // Material Metálico em Titânio Escuro
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
    vMesh.scale.set(0.85, 0.85, 0.85);
    vMesh.position.set(0, 4.2, 0); // Flutua graciosamente acima do oceano de dados
    scene.add(vMesh);

    // Linhas de borda luminosas (Edges sutis ciano neon)
    const vEdges = new THREE.EdgesGeometry(vGeometry, 24);
    const vEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const vEdgeLines = new THREE.LineSegments(vEdges, vEdgeMaterial);
    vMesh.add(vEdgeLines);

    // ================= ILUMINAÇÃO DE ESTÚDIO CINEMATOGRÁFICA =================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Key Light Direcional (Ciano)
    const keyLight = new THREE.DirectionalLight(0x00d2ff, 2.6);
    keyLight.position.set(16, 20, 20);
    scene.add(keyLight);

    // Rim Light Oposta (Azul Cobalto Corporativo)
    const rimLight = new THREE.DirectionalLight(0x2563eb, 2.2);
    rimLight.position.set(-18, -12, -15);
    scene.add(rimLight);

    // Feixe Pontual Orbitante (Reflexos dinâmicos nas facetas do V)
    const glintLight = new THREE.PointLight(0x00d2ff, 3.5, 45);
    scene.add(glintLight);

    // ================= INTERAÇÃO DE MOUSE (PARALLAX 3D COM INÉRCIA) =================
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onPointerMove = (e: MouseEvent) => {
      targetX = (e.clientX - windowHalfX) * 0.06;
      targetY = (e.clientY - windowHalfY) * 0.06;
    };

    window.addEventListener("mousemove", onPointerMove);

    // ================= LOOP DE RENDERIZAÇÃO =================
    let animId: number;
    let count = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Interpolação suave do mouse (lerp)
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Câmera acompanha sutilmente o mouse
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY + 15 - camera.position.y) * 0.05;
      camera.lookAt(0, 2, 0);

      // 1. ONDA SENOIDAL DO OCEANO DE DADOS (Mesma fórmula da tela de login)
      const positions = waveParticles.geometry.attributes.position.array as Float32Array;
      let posIdx = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          positions[posIdx + 1] =
            -4 +
            (Math.sin((ix + count) * 0.3) * 2) +
            (Math.sin((iy + count) * 0.4) * 2);
          posIdx += 3;
        }
      }
      waveParticles.geometry.attributes.position.needsUpdate = true;
      count += 0.035;

      // 2. LEVITAÇÃO E PARALLAX DO MONÓLITO "V"
      vMesh.rotation.y = Math.sin(elapsedTime * 0.75) * 0.16 + (mouseX * 0.02);
      vMesh.rotation.x = Math.cos(elapsedTime * 0.55) * 0.08 - (mouseY * 0.02);
      vMesh.rotation.z = Math.sin(elapsedTime * 0.35) * 0.04;
      vMesh.position.y = 4.2 + Math.sin(elapsedTime * 1.3) * 0.35; // Levitação orgânica acima da onda

      // 3. ÓRBITA DA LUZ DE REFLEXO NAS FACETAS
      glintLight.position.x = Math.sin(elapsedTime * 1.3) * 14;
      glintLight.position.y = Math.cos(elapsedTime * 1.0) * 8 + 4;
      glintLight.position.z = Math.cos(elapsedTime * 1.3) * 12 + 8;

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
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      waveGeometry.dispose();
      waveMaterial.dispose();
      vGeometry.dispose();
      vMaterial.dispose();
      vEdges.dispose();
      vEdgeMaterial.dispose();
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
    // Transição de fade-out suave (1000ms) para não ter cortes secos
    setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete("/dashboard");
    }, 1000);
  };

  // Timer automático para o início da transição após durationMs
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs]);

  // Tecla ESC, Enter ou Espaço para dispensar instantaneamente
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

  const stageLabels = [
    "Inicializando ecossistema corporativo...",
    "Sincronizando barramento neural e workspaces...",
    "Ambiente pronto para operação."
  ];

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
          0%, 100% { filter: drop-shadow(0 0 25px rgba(0, 210, 255, 0.45)); opacity: 0.94; }
          50% { filter: drop-shadow(0 0 50px rgba(0, 210, 255, 0.85)); opacity: 1; }
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

      {/* Canvas 3D Three.js do Oceano de Dados + "V" Monolítico de Fundo */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Glow Orbs idênticos à Tela de Login para Transição 100% Perfeita */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Topo: Indicador sutil e limpo */}
      <div className="w-full flex items-center justify-end z-10 pt-2 opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-[11px] font-mono tracking-wider text-slate-400">
          Pressione ESC ou clique para entrar
        </span>
      </div>

      {/* CENTRO: Destaque Exclusivo no Monólito "V" 3D + Mensagem de Boas-Vindas */}
      <div className="w-full my-auto flex flex-col items-center justify-center text-center z-10 pointer-events-none mt-40 sm:mt-52">

        {/* Mensagem de Boas-Vindas Elegante & Montagem do Sistema */}
        <div className="mt-8 flex flex-col items-center space-y-3">
          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${assemblyStage === 2 ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"} shadow-[0_0_8px_#00d2ff]`} />
            <span>
              {resolvedUserName
                ? `Bem-vindo de volta, ${resolvedUserName}`
                : "Bem-vindo ao seu ecossistema corporativo"}
            </span>
          </p>

          {/* Status Dinâmico de Montagem Suave */}
          <p className="text-[11px] text-slate-400 font-mono tracking-wider transition-all duration-500">
            {stageLabels[assemblyStage]}
          </p>

          {/* Linha Luminescente Monocromática Minimalista */}
          <div className="w-48 h-[2px] bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-24 anim-shimmer" />
          </div>
        </div>

      </div>

      {/* RODAPÉ: Botão Discreto de Acesso Direto */}
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
