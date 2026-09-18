"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import * as THREE from "three";

// ================= COMPONENTE OCEANO DE DADOS (THREE.JS) =================
const BackgroundParticles = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1224, 0.022);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b1224, 1);
    mountRef.current.appendChild(renderer.domElement);

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

    const SEPARATION = 3, AMOUNTX = 70, AMOUNTY = 70;
    const numParticles = AMOUNTX * AMOUNTY;
    const positions = new Float32Array(numParticles * 3);

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
        positions[i + 1] = 0;
        positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);
        i += 3;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xef4444,
      size: 0.22,
      map: createCircleTexture(),
      alphaTest: 0.4,
      transparent: true,
      opacity: 0.45,
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
            (Math.sin((ix + count) * 0.3) * 2) +
            (Math.sin((iy + count) * 0.4) * 2);
          pIdx += 3;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      count += 0.03;

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

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// ================= TELA DE BLOQUEIO CORPORATIVO COMPACTA =================
export default function BlockedPage() {
  const router = useRouter();
  const [reason, setReason] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Invalidação preventiva rigorosa
      localStorage.removeItem("versus_auth_token");
      localStorage.removeItem("versus_token");
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("versus_user");

      const storedReason = sessionStorage.getItem("versus_blocked_reason");
      if (storedReason) {
        setReason(storedReason);
      }
    }
  }, []);

  const handleReturnToLogin = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("versus_blocked_reason");
    }
    router.push("/login");
  };

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      handleReturnToLogin();
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-[#0B1224] select-none">
      {/* Background: Ondas Three.js em tons corporativos sutis */}
      <BackgroundParticles />

      {/* Brilhos volumétricos idênticos à tela de login */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-950/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-slate-900/30 rounded-full blur-[140px] pointer-events-none" />

      {/* Container Central com as dimensões exatas da tela de login (max-w-[440px] p-6) */}
      <div className="w-full max-w-[440px] p-6 relative z-10 animate-[hologramBoot_1.5s_ease-out_forwards,float_7s_ease-in-out_2s_infinite_alternate]">
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes float {
              0% { transform: translateY(-4px); }
              100% { transform: translateY(6px); }
            }
            @keyframes hologramBoot {
              0% { 
                opacity: 0; 
                filter: blur(16px); 
                transform: scale(0.92) translateY(30px);
              }
              60% {
                opacity: 0.85;
                filter: blur(4px); 
                transform: scale(1.01) translateY(-4px);
              }
              100% { 
                opacity: 1; 
                filter: blur(0px);
                transform: scale(1) translateY(0);
              }
            }
          `,
          }}
        />

        {/* Card de Vidro Corporativo (Mesmos paddings e bordas do login: px-8 py-10 sm:px-10 sm:py-12) */}
        <div
          className="bg-[#0B1224]/50 border border-slate-800/80 rounded-[20px] px-8 py-10 sm:px-10 sm:py-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col relative overflow-hidden group"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
          }}
        >
          {/* Spotlight sutil corporativo */}
          <div
            className="pointer-events-none absolute -inset-px rounded-[20px] opacity-0 transition duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(239, 68, 68, 0.08), transparent 40%)`,
            }}
          />

          {/* Header Centralizado */}
          <div className="mb-6 text-center flex flex-col items-center relative z-10">
            {/* Badge GOVERNANÇA & SEGURANÇA */}
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-[0.65rem] uppercase tracking-[0.2em] font-semibold py-1 px-4 rounded-full mb-4 flex items-center gap-1.5 shadow-sm">
              <AlertTriangle size={11} className="text-red-400" />
              <span>ACESSO SUSPENSO</span>
            </div>

            {/* Ícone de Escudo Compacto */}
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <ShieldAlert size={24} className="text-red-400" />
            </div>

            {/* Logotipo VERSUS */}
            <div className="flex justify-center py-1 mb-1">
              <h1 className="text-3xl md:text-[2.2rem] font-black tracking-[0.2em] text-white">
                VERSUS
              </h1>
            </div>

            <p className="text-slate-400 text-xs mt-1">
              Acesso Corporativo Bloqueado
            </p>
          </div>

          {/* Box de Motivo do Bloqueio (Layout refinado idêntico aos inputs do login) */}
          <div className="w-full bg-slate-950/60 border border-slate-800 rounded-[10px] p-4 text-left mb-6 relative z-10">
            <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-red-400 uppercase tracking-wider mb-1.5">
              <span>MOTIVO DO BLOQUEIO</span>
            </div>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {reason || "O acesso desta organização foi temporariamente suspenso pela administração central para fins de governança ou regularização de plano."}
            </p>
          </div>

          {/* Botões de Ação com o Design System de Login */}
          <div className="w-full flex flex-col gap-3 relative z-10">
            {/* Botão Primário: Voltar ao Login */}
            <button
              type="button"
              onClick={handleReturnToLogin}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-[0.88rem] rounded-[10px] text-[0.84rem] tracking-wider uppercase transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>VOLTAR AO LOGIN</span>
            </button>

            {/* Botão Secundário: Testar Reativação */}
            <button
              type="button"
              onClick={handleRetry}
              disabled={isChecking}
              className="w-full bg-slate-950/60 hover:bg-slate-900 active:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold py-[0.85rem] rounded-[10px] text-[0.82rem] tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isChecking ? "animate-spin text-blue-400" : "text-slate-400"} />
              <span>{isChecking ? "VERIFICANDO..." : "TESTAR REATIVAÇÃO"}</span>
            </button>
          </div>

          {/* Rodapé Idêntico ao do Login */}
          <div className="flex justify-between items-center text-xs text-slate-500 mt-7 relative z-10">
            <span>suporte@versus.com.br</span>
            <a 
              href="mailto:suporte@versus.com.br" 
              className="hover:text-slate-300 transition-colors"
            >
              Canal de Suporte
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
