"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Kanban,
  Activity,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  BarChart3,
  Layers,
  Lightbulb,
  Clock,
  ChevronRight,
  Shield,
  Zap,
  Terminal,
  Cpu
} from "lucide-react";
import * as THREE from "three";
import VersusPreloader from "@/components/ui/VersusPreloader";

interface WelcomeDashboardProps {
  onViewMetrics?: () => void;
  hasMetrics?: boolean;
}

// ================= COMPONENTE DE ONDAS / PARTÍCULAS THREE.JS =================
const WelcomeParticlesBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070D1B, 0.03);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 16, 32);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mountRef.current.appendChild(renderer.domElement);

    // Textura circular suave para as partículas
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    const circleTexture = new THREE.CanvasTexture(canvas);

    // Grid de Partículas (Ondulação sutil de dados corporativos)
    const SEPARATION = 2.4, AMOUNTX = 60, AMOUNTY = 60;
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

    const material = new THREE.PointsMaterial({
      color: 0x00d2ff, // VERSUS Cyan Glow Accent
      size: 0.3,
      map: circleTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let count = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      count += 0.035;

      const pos = geometry.attributes.position.array as Float32Array;
      let idx = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          pos[idx + 1] = Math.sin((ix + count) * 0.3) * 1.5 + Math.sin((iy + count) * 0.5) * 1.5;
          idx += 3;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-50"
    />
  );
};

// ================= COMPONENTE PRINCIPAL WELCOMEDASHBOARD =================
export default function WelcomeDashboard({ onViewMetrics, hasMetrics = true }: WelcomeDashboardProps) {
  const [userName, setUserName] = useState<string>("Operador");
  const [userRole, setUserRole] = useState<string>("Atendente");
  const [companyName, setCompanyName] = useState<string>("VERSUS");
  const [showPreloader, setShowPreloader] = useState<boolean>(false);
  const [forcePlayPreloader, setForcePlayPreloader] = useState<boolean>(false);

  useEffect(() => {
    try {
      const alreadyBooted = sessionStorage.getItem("versus_boot_completed");
      if (!alreadyBooted) {
        setShowPreloader(true);
      }
    } catch (e) {}

    try {
      const stored = localStorage.getItem("versus_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.role) {
          setUserRole(parsed.role === "ADMIN" || parsed.role === "SUPER_ADMIN" ? "Administrador" : "Atendente");
        }
        if (parsed.tenant?.name) setCompanyName(parsed.tenant.name);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handlePreloaderComplete = (targetHref?: string) => {
    try {
      sessionStorage.setItem("versus_boot_completed", "true");
    } catch (e) {}
    setShowPreloader(false);
    setForcePlayPreloader(false);
  };

  const quickModules = [
    {
      title: "WhatsApp & Inbox",
      description: "Atendimento ao vivo, canais conectados e transbordo inteligente de IA.",
      href: "/inbox",
      icon: MessageSquare,
      badge: "Operação ao Vivo",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Funil Comercial (CRM)",
      description: "Gestão ágil de oportunidades, qualificação de leads e propostas de vendas.",
      href: "/crm",
      icon: Kanban,
      badge: "Vendas & CRM",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      title: "Monitor em Tempo Real",
      description: "Acompanhamento ao vivo de filas de espera, status dos atendentes e tráfego.",
      href: "/monitor",
      icon: Activity,
      badge: "Métricas de Fluxo",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
      title: "Central de Suporte",
      description: "Chamados técnicos, autoatendimento inteligente estilo Lero e base de conhecimento.",
      href: "/support",
      icon: LifeBuoy,
      badge: "Suporte Corporativo",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
  ];

  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-8 px-4 overflow-hidden">
      {/* Preloader de Alto Impacto com Three.js */}
      {showPreloader && (
        <VersusPreloader
          durationMs={3200}
          userName={userName}
          forcePlay={forcePlayPreloader}
          onComplete={handlePreloaderComplete}
        />
      )}

      {/* Estilos e Animações em Cascata de Alta Fidelidade */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cascadeSlideUp {
          0% {
            opacity: 0;
            filter: blur(8px);
            transform: translateY(24px) scale(0.98);
          }
          100% {
            opacity: 1;
            filter: blur(0px);
            transform: translateY(0) scale(1);
          }
        }
        @keyframes ambientGlowPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.28; transform: scale(1.08); }
        }
        .anim-cascade-1 {
          animation: cascadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          opacity: 0;
        }
        .anim-cascade-2 {
          animation: cascadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
          opacity: 0;
        }
        .anim-cascade-3 {
          animation: cascadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
        }
        .anim-cascade-4 {
          animation: cascadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
          opacity: 0;
        }
        .anim-cascade-5 {
          animation: cascadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
          opacity: 0;
        }
      `}} />

      {/* Ondas de Partículas Interativas Three.js no Fundo */}
      <WelcomeParticlesBackground />

      {/* Iluminação de Fundo Monocromática Corporativa */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"
        style={{ animation: "ambientGlowPulse 8s ease-in-out infinite" }}
      />

      {/* Container Central com Revelação em Cascata */}
      <div className="w-full max-w-4xl flex flex-col gap-6 relative z-10">
        
        {/* HERO CARD PRINCIPAL */}
        <div className="anim-cascade-1 bg-[#0B1224]/90 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
          {/* Brilho sutil no canto do card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3.5">
              
              {/* Badges de Identidade e Sessão */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wide">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>VERSUS ENTERPRISE CORE</span>
                </span>
                
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#070D1B] border border-slate-700/80 text-slate-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Sessão Ativa: {userRole}</span>
                </span>
              </div>

              {/* Saudação de Alto Impacto */}
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Bem-vindo de volta, <span className="text-blue-400">{userName}</span>!
              </h1>

              {/* Frase de Impacto Institucional */}
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                A mais avançada plataforma corporativa de inteligência em vendas, atendimento omnichannel e automações empresariais para <strong className="text-white font-bold">{companyName}</strong>.
              </p>
            </div>

            {/* Ações de Topo: Boot e Métricas */}
            <div className="shrink-0 flex flex-wrap md:flex-col gap-2.5">
              <button
                onClick={() => setShowPreloader(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold transition-all shadow-md group"
                title="Executar animação cinematográfica de boot do sistema"
              >
                <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                <span>Boot do Sistema (Preloader)</span>
              </button>

              {hasMetrics && onViewMetrics && (
                <button
                  onClick={onViewMetrics}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#070D1B] hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-blue-500/40 text-xs font-bold transition-all shadow-md group"
                >
                  <BarChart3 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Ver Métricas do Dia</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CARD DICA DE PRODUTIVIDADE */}
        <div className="anim-cascade-2 bg-[#070D1B]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md shadow-lg">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider">
                  Dica de Produtividade do Dia
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pressione <kbd className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-xs text-blue-300 font-bold shadow-sm">Ctrl + K</kbd> para comandos rápidos ou expanda as categorias na barra lateral para acessar seus módulos operacionais.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0 bg-[#0B1224] px-3 py-1.5 rounded-xl border border-slate-800/80">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Workspace pronto</span>
          </div>
        </div>

        {/* CARDS DE ACESSO RÁPIDO AOS MÓDULOS */}
        <div className="anim-cascade-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Módulos Operacionais em Destaque
            </span>
            <span className="text-[11px] text-slate-500">
              Clique em qualquer módulo ou use o menu à esquerda
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {quickModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="p-5 rounded-2xl bg-[#0B1224]/90 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between group hover:bg-[#0B1224] shadow-xl hover:shadow-blue-600/5 backdrop-blur-md relative overflow-hidden"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#070D1B] border border-slate-800 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:border-blue-500/40 transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                      {item.title}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                    <span>Iniciar Operação</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
