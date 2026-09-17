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
  durationMs = 6000,
  forcePlay = false,
  userName
}: VersusPreloaderProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [resolvedUserName, setResolvedUserName] = useState<string>(userName || "");
  const [progress, setProgress] = useState<number>(0);

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

  // ================= 1. MOTOR 3D THREE.JS: OCEANO DE DADOS & MONÓLITO "V" =================
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1224, 0.022);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 14, 34);
    camera.lookAt(0, 1.5, 0);

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

    const SEPARATION = 3, AMOUNTX = 75, AMOUNTY = 75;
    const numParticles = AMOUNTX * AMOUNTY;
    const wavePositions = new Float32Array(numParticles * 3);

    let pIdx = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        wavePositions[pIdx] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
        wavePositions[pIdx + 1] = -4;
        wavePositions[pIdx + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);
        pIdx += 3;
      }
    }

    const waveGeometry = new THREE.BufferGeometry();
    waveGeometry.setAttribute("position", new THREE.BufferAttribute(wavePositions, 3));

    const waveMaterial = new THREE.PointsMaterial({
      color: 0x3b82f6,
      size: 0.22,
      map: createCircleTexture(),
      alphaTest: 0.4,
      transparent: true,
      opacity: 0.45
    });

    const waveParticles = new THREE.Points(waveGeometry, waveMaterial);
    scene.add(waveParticles);

    // ================= MONÓLITO 3D "V" =================
    const shape = new THREE.Shape();
    shape.moveTo(-2.8, 4.6);
    shape.lineTo(-1.4, 4.6);
    shape.lineTo(0, -1.2);
    shape.lineTo(1.4, 4.6);
    shape.lineTo(2.8, 4.6);
    shape.lineTo(0.8, -4.6);
    shape.lineTo(-0.8, -4.6);
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 2,
      depth: 1.6,
      bevelEnabled: true,
      bevelThickness: 0.45,
      bevelSize: 0.35,
      bevelOffset: 0,
      bevelSegments: 5,
    };

    const vGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    vGeometry.center();

    const vMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.65,
      roughness: 0.25,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      reflectivity: 0.8,
    });

    const vMesh = new THREE.Mesh(vGeometry, vMaterial);

    const edgesGeom = new THREE.EdgesGeometry(vGeometry, 22);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.65,
    });
    const vEdges = new THREE.LineSegments(edgesGeom, edgesMat);
    vMesh.add(vEdges);

    vMesh.position.set(0, 3.4, 5.5);
    vMesh.scale.set(0.85, 0.85, 0.85);
    scene.add(vMesh);

    // Iluminação Sóbria
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xdbeafe, 2.4);
    keyLight.position.set(5, 14, 18);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 1.4);
    fillLight.position.set(-6, -2, 12);
    scene.add(fillLight);

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

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    let animId: number;
    let count = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY + 10 - camera.position.y) * 0.04;
      camera.position.z += (25 - camera.position.z) * 0.03;
      camera.lookAt(0, 1.5, 0);

      vMesh.position.y = 3.2 + Math.sin(count * 1.5) * 0.15;
      vMesh.rotation.y = mouseX * 0.2;
      vMesh.rotation.x = 0.05 + (-mouseY * 0.12);

      const positions = waveParticles.geometry.attributes.position.array as Float32Array;
      let posIdx = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          positions[posIdx + 1] =
            -4 +
            (Math.sin((ix + count) * 0.3) * 1.8) +
            (Math.sin((iy + count) * 0.4) * 1.8);
          posIdx += 3;
        }
      }
      waveParticles.geometry.attributes.position.needsUpdate = true;
      count += 0.032;

      renderer.render(scene, camera);
    };

    animate();

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
      edgesGeom.dispose();
      edgesMat.dispose();
      renderer.dispose();
    };
  }, []);

  // ================= 2. PROGRESSO CADENCIADO =================
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

  // Teclas de atalho para avançar (ESC, Enter, Espaço)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExiting]);

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);

    try {
      sessionStorage.setItem("versus_boot_completed", "true");
    } catch (e) {}

    setTimeout(() => {
      setIsFinished(true);
      if (onComplete) {
        let destination = "/dashboard";
        try {
          const stored = localStorage.getItem("versus_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.isSuperAdmin || parsed.role === "SUPER_ADMIN") {
              destination = "/super-admin/companies";
            }
          }
        } catch (e) {}
        onComplete(destination);
      }
    }, 1000);
  };

  if (isFinished) return null;

  const getStageText = (p: number) => {
    if (p < 30) return "Inicializando ecossistema corporativo...";
    if (p < 65) return "Sincronizando barramento neural e agentes de IA...";
    if (p < 95) return "Compilando canais de atendimento e telemetria...";
    return "Ambiente pronto para operação!";
  };

  const getStageSubtext = (p: number) => {
    if (p < 30) return "AUTENTICAÇÃO & WORKSPACES MULTITENANT";
    if (p < 65) return "NEURAL BUS & INSTÂNCIAS CONECTADAS";
    if (p < 95) return "FUNIS COMERCIAIS & REALTIME SOCKETS";
    return "CARREGANDO WORKSPACE VERSUS...";
  };

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 bg-[#0B1224] overflow-hidden select-none cursor-pointer transition-all duration-1000 ease-in-out ${
        isExiting
          ? "opacity-0 scale-105 pointer-events-none filter blur-xl"
          : "opacity-100 scale-100 filter blur-0"
      }`}
      style={{ willChange: "opacity, transform, filter" }}
    >
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Topo Sutil */}
      <div className="w-full flex items-center justify-end z-10 pt-2 opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-[11px] font-mono tracking-wider text-slate-400">
          Pressione ESC ou clique para entrar
        </span>
      </div>

      {/* ÁREA INFERIOR: Posicionada ergonomicamente abaixo do grande 'V' 3D (Sem Nenhuma Colisão) */}
      <div className="fixed inset-x-0 bottom-8 sm:bottom-12 flex flex-col items-center justify-center text-center z-20 px-4 space-y-4 pointer-events-none max-w-xl mx-auto">
        
        {/* Saudação com Ponto Luminescente em Azul Corporativo Sóbrio */}
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-wide flex items-center justify-center gap-3 drop-shadow-[0_8px_25px_rgba(0,0,0,0.9)]">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]" />
            <span>Bem-vindo de volta, {resolvedUserName || "Felipe"}</span>
          </h2>

          {/* Status Dinâmico de Inicialização */}
          <p className="text-xs sm:text-sm font-mono tracking-wider text-slate-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {getStageText(progress)}
          </p>
        </div>

        {/* Linha Luminescente Monocromática Minimalista dos 15 Segundos */}
        <div className="w-64 sm:w-80 h-[2.5px] bg-slate-800/90 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Subtexto Técnico dos Subsistemas */}
        <p className="text-[11px] text-slate-400 font-mono tracking-widest uppercase">
          {getStageSubtext(progress)}
        </p>

        {/* Botão de Acesso Direto */}
        <div className="pointer-events-auto pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="group inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium backdrop-blur-xl transition-all shadow-lg cursor-pointer"
          >
            <span>Acessar Painel Principal</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}
