"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import {
  Cpu,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Kanban,
  Activity,
  MessagesSquare,
  LifeBuoy,
  Bot,
  LayoutDashboard,
  ChevronRight,
  BarChart3,
  FileText,
  Layers
} from "lucide-react";

interface VersusPreloaderProps {
  onComplete?: (targetHref?: string) => void;
  durationMs?: number;
  forcePlay?: boolean;
}

const BOOT_STAGES = [
  { percent: 20, label: "Sincronizando workspaces corporativos e credenciais multitenant...", tag: "AUTH · OK", color: "text-blue-400" },
  { percent: 45, label: "Inicializando barramento neural dos Agentes de IA...", tag: "NEURAL · ONLINE", color: "text-cyan-400" },
  { percent: 70, label: "Conectando instâncias do WhatsApp e WebSocket ao vivo...", tag: "SOCKET · CONECTADO", color: "text-emerald-400" },
  { percent: 90, label: "Compilando funil de vendas comercial e telemetria do CRM...", tag: "CRM · SINCRONIZADO", color: "text-blue-400" },
  { percent: 100, label: "Construção do sistema concluída com êxito! Pronto para operação.", tag: "SISTEMA · PRONTO", color: "text-emerald-400" }
];

const PRELOADER_MENU_CATEGORIES = [
  {
    category: "PRINCIPAL",
    items: [
      { name: "Visão Geral (Dashboard)", href: "/dashboard", icon: LayoutDashboard, badge: "Início", highlight: true }
    ]
  },
  {
    category: "OPERAÇÃO & ATENDIMENTO",
    items: [
      { name: "WhatsApp ao Vivo", href: "/inbox", icon: MessageSquare, badge: "Live" },
      { name: "Monitor em Tempo Real", href: "/monitor", icon: Activity, badge: "Filas" },
      { name: "Métricas de Atendimento", href: "/dashboard/atendimento", icon: BarChart3, badge: "KPIs" }
    ]
  },
  {
    category: "FUNIL COMERCIAL (CRM)",
    items: [
      { name: "Oportunidades de Vendas", href: "/crm", icon: Kanban, badge: "Funil" },
      { name: "Métricas de Vendas", href: "/dashboard/crm", icon: BarChart3, badge: "Receita" }
    ]
  },
  {
    category: "CHAT & EQUIPE",
    items: [
      { name: "Chat Interno da Equipe", href: "/chat-interno", icon: MessagesSquare, badge: "Equipe" }
    ]
  },
  {
    category: "EXPANSÃO & SUPORTE",
    items: [
      { name: "Agentes de IA", href: "/agent", icon: Bot, badge: "Neural" },
      { name: "Central de Suporte", href: "/support", icon: LifeBuoy, badge: "Ajuda" },
      { name: "Propostas Comerciais", href: "/proposals", icon: FileText, badge: "Docs" }
    ]
  }
];

export default function VersusPreloader({
  onComplete,
  durationMs = 4500, // Duração cadenciada para permitir leitura completa das mensagens
  forcePlay = false
}: VersusPreloaderProps) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isSystemBuilt, setIsSystemBuilt] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

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

    // Textura suave para partículas
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.3, "rgba(0, 210, 255, 0.85)");
      gradient.addColorStop(0.8, "rgba(37, 99, 235, 0.35)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    // Campo de Partículas Quânticas Esféricas / Vortex
    const particleCount = 1400;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 12 + Math.random() * 26;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
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

    // Anéis Holográficos Orbitais (Giroscópio Cibernético)
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

    // Núcleo Central de Pulso (Icosaedro Wireframe)
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

      particles.rotation.y = elapsedTime * 0.08;
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.12;

      ring1.rotation.x = elapsedTime * 0.45;
      ring1.rotation.y = elapsedTime * 0.3;
      ring2.rotation.y = -elapsedTime * 0.35;
      ring2.rotation.z = elapsedTime * 0.25;
      ring3.rotation.x = -elapsedTime * 0.2;
      ring3.rotation.z = -elapsedTime * 0.4;

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

  // ================= PROGRESSÃO DA TELEMETRIA DE CONSTRUÇÃO =================
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / durationMs) * 100));

      setProgress(rawProgress);

      const stageIdx = BOOT_STAGES.findIndex((s) => rawProgress <= s.percent);
      if (stageIdx !== -1) {
        setCurrentStageIndex(stageIdx);
      } else {
        setCurrentStageIndex(BOOT_STAGES.length - 1);
      }

      // Ao atingir 100%, o sistema foi construído: NÃO fecha sozinho!
      // Libera a barra lateral com os menus e categorias para o usuário escolher.
      if (rawProgress >= 100) {
        clearInterval(interval);
        setIsSystemBuilt(true);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs]);

  // ================= AÇÃO DE ESCOLHA DO USUÁRIO =================
  const handleSelectModule = (targetHref: string) => {
    setSelectedModule(targetHref);
    try {
      sessionStorage.setItem("versus_boot_completed", "true");
    } catch (e) {}

    setIsExiting(true);
    setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete(targetHref);
      if (targetHref) {
        router.push(targetHref);
      }
    }, 600);
  };

  if (isFinished && !forcePlay) return null;

  const currentStage = BOOT_STAGES[currentStageIndex] || BOOT_STAGES[BOOT_STAGES.length - 1];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex bg-[#050814] overflow-hidden transition-all duration-700 ease-out select-none ${
        isExiting ? "opacity-0 scale-105 pointer-events-none blur-md" : "opacity-100 scale-100"
      }`}
    >
      {/* Estilos CSS Inline de Animações Especiais */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 25px rgba(0, 210, 255, 0.45)); opacity: 0.9; }
          50% { filter: drop-shadow(0 0 55px rgba(0, 210, 255, 0.85)); opacity: 1; }
        }
        @keyframes slideInLeftCascade {
          0% { opacity: 0; transform: translateX(-30px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .anim-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .anim-scanline {
          animation: scanline 4s linear infinite;
        }
        .anim-menu-cascade {
          animation: slideInLeftCascade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Canvas 3D Three.js de Fundo */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Iluminação Volumétrica */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Linha de Varredura Scanline */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 z-0">
        <div className="w-full h-24 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent anim-scanline" />
      </div>

      {/* ========================================================== */}
      {/* 1. SIDEBAR / MENU ESQUERDO REVELADO DE FORMA SINCRONIZADA */}
      {/* ========================================================== */}
      <div
        className={`w-80 sm:w-96 h-full bg-[#0B1224]/95 border-r border-slate-800 backdrop-blur-2xl z-20 flex flex-col justify-between p-5 transition-all duration-700 ease-out shrink-0 shadow-2xl relative ${
          isSystemBuilt
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Glow sutil na borda lateral */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-cyan-500/50 via-blue-500/30 to-transparent pointer-events-none" />

        {/* Topo da Sidebar de Inicialização */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white tracking-wider uppercase font-mono">
                  VERSUS CORE
                </h2>
                <p className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Módulos Construídos
                </p>
              </div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 font-mono font-bold">
              v2.4
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Selecione uma categoria ou clique na <strong className="text-cyan-400 font-semibold">Visão Geral</strong> para iniciar a operação:
          </p>

          {/* Listagem de Categorias e Submenus */}
          <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 custom-scrollbar">
            {PRELOADER_MENU_CATEGORIES.map((cat, catIdx) => (
              <div
                key={cat.category}
                className="space-y-1.5 anim-menu-cascade"
                style={{ animationDelay: `${catIdx * 100}ms` }}
              >
                <div className="text-[10px] font-black font-mono tracking-wider text-slate-500 uppercase px-2 pt-1 flex items-center justify-between">
                  <span>{cat.category}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>

                <div className="space-y-1">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isHighlight = 'highlight' in item ? Boolean((item as any).highlight) : false;
                    const isSelected = selectedModule === item.href;

                    return (
                      <button
                        key={item.name}
                        onClick={() => handleSelectModule(item.href)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group relative overflow-hidden ${
                          isHighlight
                            ? "bg-gradient-to-r from-blue-600/30 to-cyan-500/20 border border-cyan-500/40 text-white hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,210,255,0.25)]"
                            : isSelected
                            ? "bg-blue-600/20 border border-blue-500 text-white"
                            : "bg-[#070D1B]/80 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                              isHighlight
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                                : "bg-slate-800/80 text-slate-400 group-hover:text-cyan-400 border border-slate-700/60"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold truncate">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              isHighlight
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                                : "bg-slate-900 text-slate-500 border-slate-800 group-hover:text-slate-300"
                            }`}
                          >
                            {item.badge}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>SESSÃO PROTEGIDA</span>
          <span className="text-emerald-400">STATUS: PRONTO</span>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. ÁREA CENTRAL: COCKPIT DE BOOT & TELEMETRIA              */}
      {/* ========================================================== */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 overflow-y-auto">
        
        {/* Botão Superior Discreto para Pular Direto para Visão Geral */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={() => handleSelectModule("/dashboard")}
            className="px-3.5 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 text-xs font-semibold backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 group"
          >
            <span>Ir para Visão Geral</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-cyan-400" />
          </button>
        </div>

        <div className="w-full max-w-xl flex flex-col items-center text-center">
          
          {/* Badge Corporativo de Inicialização */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B1224]/90 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(0,210,255,0.2)] backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${isSystemBuilt ? "bg-emerald-400" : "bg-cyan-400 animate-ping"}`} />
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
          <div className="w-full bg-[#0B1224]/85 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
            
            {/* Header da Telemetria: Status e Porcentagem */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSystemBuilt ? "bg-emerald-400 animate-none" : "bg-cyan-400 animate-pulse"}`} />
                <span className="font-mono text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  {isSystemBuilt ? "Sistema Construído com Sucesso" : "Construindo Sistema & Módulos"}
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
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
              </div>
            </div>

            {/* Log Dinâmico de Mensagens do Sistema */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  {isSystemBuilt ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Sparkles className="w-3 h-3 animate-spin text-cyan-400" style={{ animationDuration: "4s" }} />
                  )}
                </div>
                <p className="text-xs text-slate-300 font-mono truncate">
                  {currentStage.label}
                </p>
              </div>
              
              <span className={`text-[10px] font-mono font-bold shrink-0 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 ${currentStage.color}`}>
                {currentStage.tag}
              </span>
            </div>

            {/* Chamada para Ação Quando o Sistema Estiver Construído */}
            {isSystemBuilt && (
              <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                <p className="text-xs text-slate-300 text-left">
                  👈 <span className="text-cyan-400 font-bold">Escolha um módulo no menu lateral</span> ou entre diretamente na Visão Geral:
                </p>
                <button
                  onClick={() => handleSelectModule("/dashboard")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-blue-500/25 shrink-0 group"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Acessar Visão Geral</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

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

    </div>
  );
}
