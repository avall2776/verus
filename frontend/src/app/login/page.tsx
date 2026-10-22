"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import * as THREE from "three";
import { AnimatePresence } from "framer-motion";
import VersusPreloader from "@/components/ui/VersusPreloader";

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

  // Fluxo de estados: 'form' -> 'evaporating' (fade-out do card) -> 'booting' (preloader cinematográfico)
  const [cardState, setCardState] = useState<"form" | "evaporating" | "booting">("form");

  // A tela de login é SEMPRE no azul clássico corporativo (dark)
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.add("dark");
      root.classList.remove("light", "theme-whatsapp");
      root.setAttribute("data-theme", "dark");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { default: api } = await import("@/lib/api");
      const { data } = await api.post("/auth/login", { email, password });

      localStorage.setItem("versus_auth_token", data.access_token);
      localStorage.setItem("versus_user", JSON.stringify(data.user));
      if (data.user?.tenantId) {
        localStorage.setItem("tenantId", data.user.tenantId);
      }
      try {
        window.dispatchEvent(new Event("auth_login"));
        window.dispatchEvent(new Event("tenant_switched"));
      } catch (e) {}

      // Extrai o primeiro nome real do usuário autenticado (ex: "Felipe")
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

  // Transição automática para o Dashboard ao concluir o Preloader
  const handleFinishBoot = () => {
    try {
      sessionStorage.setItem("versus_boot_completed", "true");
    } catch (e) {}

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
  };

  return (
    <div
      id="versus-login-screen"
      className="flex min-h-screen items-center justify-center relative overflow-hidden bg-[#0B1224] select-none transition-all duration-700 ease-in-out"
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
              : "opacity-100 scale-100"
          }`}
        >
          {/* Card de Vidro com transparência sutil e efeito fosco/embaçado (Glassmorphism) sobre as bolinhas */}
          <div
            className="bg-[#0B1224]/50 border border-slate-800/80 rounded-[20px] px-8 py-10 sm:px-10 sm:py-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col relative overflow-hidden group"
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

              {/* Logotipo Corporativo */}
              <div className="flex justify-center items-center py-2 mb-2 w-full">
                <img
                  src="/vallor/Logo_valor_01.svg"
                  alt="Vallor"
                  className="w-64 max-w-full h-auto max-h-16 object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.06)]"
                />
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
                  className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-[10px] px-4 py-[0.85rem] text-[0.95rem] outline-none transition-all focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.25)] focus:bg-slate-950/90 login-input-field"
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
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-[10px] pl-4 pr-12 py-[0.85rem] text-[0.95rem] outline-none transition-all focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.25)] focus:bg-slate-950/90 login-input-field"
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
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-[0.95rem] rounded-[10px] mt-4 text-[0.88rem] tracking-wider uppercase transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer login-submit-btn"
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
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

      {/* ISOLAÇÃO ABSOLUTA DA TELA DE LOGIN: IMPEDE QUALQUER COR VERDE DO TEMA WHATSAPP */}
      <style dangerouslySetInnerHTML={{ __html: `
        #versus-login-screen,
        html.theme-whatsapp #versus-login-screen,
        .theme-whatsapp #versus-login-screen {
          background-color: #0B1224 !important;
        }
        #versus-login-screen .login-input-field:focus,
        html.theme-whatsapp #versus-login-screen .login-input-field:focus,
        .theme-whatsapp #versus-login-screen .login-input-field:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.35) !important;
          outline: none !important;
        }
        #versus-login-screen .login-submit-btn,
        html.theme-whatsapp #versus-login-screen .login-submit-btn,
        .theme-whatsapp #versus-login-screen .login-submit-btn {
          background-color: #2563eb !important;
          background-image: none !important;
          color: #ffffff !important;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4) !important;
        }
        #versus-login-screen .login-submit-btn:hover,
        html.theme-whatsapp #versus-login-screen .login-submit-btn:hover,
        .theme-whatsapp #versus-login-screen .login-submit-btn:hover {
          background-color: #1d4ed8 !important;
          background-image: none !important;
          box-shadow: 0 6px 25px rgba(37, 99, 235, 0.55) !important;
        }
      `}} />

      {/* ========================================================== */}
      {/* 2. PRELOADER CINEMATOGRÁFICO DA MARCA VALLOR (TECH ENTERPRISE) */}
      {/* ========================================================== */}
      <AnimatePresence>
        {cardState === "booting" && (
          <VersusPreloader
            durationMs={15000}
            forcePlay={true}
            onComplete={handleFinishBoot}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
