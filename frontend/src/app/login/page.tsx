"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import * as THREE from "three";

// ================= COMPONENTE OCEANO DE DADOS (BOLINHAS DO FUNDO THREE.JS) =================
const BackgroundParticles = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    // Fundo azul escuro corporativo #0B1224
    scene.fog = new THREE.FogExp2(0x0b1224, 0.022);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b1224, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Textura circular suave para as bolinhas do fundo
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

    // Grid de Partículas (Onda com as bolinhas)
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

    // Cor corporativa sóbria em azul corporativo (sem tons neon berrantes)
    const material = new THREE.PointsMaterial({
      color: 0x3b82f6,
      size: 0.26,
      map: createCircleTexture(),
      alphaTest: 0.4,
      transparent: true,
      opacity: 0.6,
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

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// ================= TELA DE LOGIN & PRELOADER DE 15 SEGUNDOS =================
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Fluxo de estados: 'form' -> 'evaporating' (fade-out do card) -> 'booting' (preloader 15s)
  const [cardState, setCardState] = useState<"form" | "evaporating" | "booting">("form");
  const [authUserName, setAuthUserName] = useState<string>("");
  const [bootProgress, setBootProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // 15 segundos exatos de imersão corporativa
  const BOOT_DURATION_MS = 15000;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { default: api } = await import("@/lib/api");
      const { data } = await api.post("/auth/login", { email, password });

      localStorage.setItem("versus_auth_token", data.access_token);
      localStorage.setItem("versus_user", JSON.stringify(data.user));

      // Extrai o primeiro nome real do usuário autenticado (ex: "Felipe")
      const rawName = data.user?.name || "";
      const firstName = rawName.split(" ")[0] || "Felipe";
      setAuthUserName(firstName);

      try {
        sessionStorage.removeItem("versus_boot_completed");
      } catch (e) {}

      // ETAPA 1: O card desaparece com fade-out suave (700ms)
      setCardState("evaporating");
      setLoading(false);

      // ETAPA 2: Abre espaço imediato para o preloader
      setTimeout(() => {
        setCardState("booting");
      }, 700);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao conectar com o servidor.");
      setLoading(false);
    }
  };

  // Temporizador de 15 segundos exatos com atualização contínua
  useEffect(() => {
    if (cardState !== "booting") return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / BOOT_DURATION_MS) * 100));
      setBootProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        handleFinishBoot();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [cardState]);

  // Transição suave automática para o Dashboard
  const handleFinishBoot = () => {
    if (isExiting) return;
    setIsExiting(true);

    try {
      sessionStorage.setItem("versus_boot_completed", "true");
    } catch (e) {}

    setTimeout(() => {
      try {
        const stored = localStorage.getItem("versus_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.isSuperAdmin || parsed.role === "SUPER_ADMIN") {
            router.push("/super-admin/companies");
            return;
          }
        }
      } catch (e) {}
      router.push("/dashboard");
    }, 1000);
  };

  // Texto dinâmico alternando o carregamento das ferramentas do sistema
  const getToolStatusText = (progress: number) => {
    if (progress < 20) return "Carregando Operação de Atendimento...";
    if (progress < 40) return "Carregando Chat da Equipe...";
    if (progress < 60) return "Carregando Funil Comercial & CRM...";
    if (progress < 80) return "Sincronizando Módulos de Inteligência Artificial...";
    if (progress < 95) return "Carregando Painel Executivo & Métricas...";
    return "Ambiente pronto para operação!";
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center relative overflow-hidden bg-[#0B1224] select-none transition-all duration-1000 ease-in-out ${
        isExiting ? "opacity-0 scale-105 filter blur-xl pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background: Bolinhas do fundo com movimento em Three.js */}
      <BackgroundParticles />

      {/* Brilho volumétrico sutil e corporativo no fundo (sem tons neon berrantes) */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-950/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-900/20 rounded-full blur-[140px] pointer-events-none" />

      {/* ========================================================== */}
      {/* 1. CARD DE LOGIN COM ANIMAÇÃO SUAVE DE SAÍDA (FADE-OUT)    */}
      {/* ========================================================== */}
      {cardState !== "booting" && (
        <div
          className={`w-full max-w-[440px] p-6 relative z-10 transition-all duration-700 ease-out ${
            cardState === "evaporating"
              ? "opacity-0 scale-95 filter blur-md pointer-events-none"
              : "opacity-100 scale-100 animate-[hologramBoot_2s_ease-out_forwards,float_7s_ease-in-out_2s_infinite_alternate]"
          }`}
        >
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

          {/* Card de Vidro com transparência sutil e efeito fosco/embaçado (Glassmorphism) sobre as bolinhas */}
          <div
            className="bg-[#0B1224]/35 border border-slate-800/60 rounded-[20px] px-8 py-10 sm:px-10 sm:py-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col relative overflow-hidden group"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
            }}
          >
            {/* Spotlight suave em azul corporativo discreto (sem tom neon) */}
            <div
              className="pointer-events-none absolute -inset-px rounded-[20px] opacity-0 transition duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(59, 130, 246, 0.1), transparent 40%)`,
              }}
            />

            <div className="mb-8 text-center flex flex-col items-center relative z-10">
              {/* Badge SEJA BEM-VINDO */}
              <div className="bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[0.65rem] uppercase tracking-[0.2em] font-semibold py-1 px-4 rounded-full mb-5">
                SEJA BEM-VINDO
              </div>

              {/* Logotipo VERSUS Sólido e Corporativo */}
              <div className="flex justify-center py-1 mb-2">
                <h1 className="text-4xl md:text-[2.5rem] font-black tracking-[0.2em] text-white">
                  VERSUS
                </h1>
              </div>

              <p className="text-slate-400 text-sm mt-2">
                Inteligência em Vendas & Atendimento Omnichannel
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full flex flex-col gap-5 text-left relative z-10">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[0.75rem] font-semibold text-slate-300 uppercase tracking-wider">
                  E-MAIL CORPORATIVO
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-[10px] px-4 py-[0.85rem] text-[0.95rem] outline-none transition-all focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.25)] focus:bg-slate-950/90 placeholder:text-slate-600"
                  placeholder="admin@verto.com"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[0.75rem] font-semibold text-slate-300 uppercase tracking-wider">
                  CHAVE DE ACESSO / SENHA
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-[10px] pl-4 pr-12 py-[0.85rem] text-[0.95rem] outline-none transition-all focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.25)] focus:bg-slate-950/90 placeholder:text-slate-600"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-[0.95rem] rounded-[10px] mt-4 text-[0.88rem] tracking-wider uppercase transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    ENTRAR NA PLATAFORMA <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="flex justify-between items-center text-xs text-slate-500 mt-8 relative z-10">
              <span>Painel Restrito</span>
              <a href="#" className="hover:text-slate-300 transition-colors">
                Recuperar Chave
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. PRELOADER LIMPO E CENTRALIZADO (SEM LOGO 'V' / BOTÕES)  */}
      {/* ========================================================== */}
      {cardState === "booting" && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center p-8 pointer-events-none animate-[fadeIn_0.8s_ease-out_forwards]">
          <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto px-4">
            
            {/* Texto de Boas-Vindas */}
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-wide flex items-center justify-center gap-3.5 drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_#3b82f6]" />
              <span>Bem-vindo de volta, {authUserName || "Felipe"}</span>
            </h2>

            {/* Barra de Status Centralizada */}
            <div className="w-72 sm:w-96 h-[3px] bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 transition-all duration-150"
                style={{ width: `${bootProgress}%` }}
              />
            </div>

            {/* Texto de Status das Ferramentas (Alternância Dinâmica) */}
            <p className="text-sm sm:text-base font-mono tracking-wider text-slate-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all duration-300">
              {getToolStatusText(bootProgress)}
            </p>

          </div>
        </div>
      )}
    </div>
  );
}
