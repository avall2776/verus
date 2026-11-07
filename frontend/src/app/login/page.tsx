"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, KeyRound, Laptop, Check, RefreshCw } from "lucide-react";
import * as THREE from "three";
import { AnimatePresence } from "framer-motion";
import VersusPreloader from "@/components/ui/VersusPreloader";
import { setAuthCookie } from "@/lib/authCookies";

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
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [isSelectingTenant, setIsSelectingTenant] = useState(false);

  // Estados de Segurança Bancária 2FA (WhatsApp Master)
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [twoFactorTempToken, setTwoFactorTempToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorUser, setTwoFactorUser] = useState<any>(null);
  const [maskedPhone, setMaskedPhone] = useState("(54) 9****-9159");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [selectedTenantIdState, setSelectedTenantIdState] = useState<string | undefined>(undefined);

  // A tela de login é SEMPRE no azul clássico corporativo (dark)
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.add("dark");
      root.classList.remove("light", "theme-whatsapp");
      root.setAttribute("data-theme", "dark");
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent, selectedTenantId?: string) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { default: api } = await import("@/lib/api");
      const trustedDeviceToken = typeof window !== "undefined" ? localStorage.getItem("versus_trusted_device") || undefined : undefined;

      const { data } = await api.post("/auth/login", { 
        email, 
        password,
        tenantId: selectedTenantId,
        trustedDeviceToken,
      });

      // Se o usuário possui contas em múltiplas empresas e precisa escolher uma
      if (data.requiresTenantSelection) {
        setAvailableTenants(data.tenants || []);
        setIsSelectingTenant(true);
        setLoading(false);
        return;
      }

      // Se a conta exige validação em duas etapas (2FA)
      if (data.requires2FA) {
        setTwoFactorTempToken(data.tempToken);
        setTwoFactorUser(data.user);
        if (data.maskedPhone) setMaskedPhone(data.maskedPhone);
        setSelectedTenantIdState(selectedTenantId);
        setIsVerifying2FA(true);
        setLoading(false);
        return;
      }

      completeLogin(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao conectar com o servidor.");
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.trim().length < 6) {
      setError("Digite o código de autorização de 6 dígitos.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { default: api } = await import("@/lib/api");
      const { data } = await api.post("/auth/verify-2fa", {
        tempToken: twoFactorTempToken,
        code: twoFactorCode.trim(),
        rememberDevice,
      });

      if (data.trustedDeviceToken) {
        try {
          localStorage.setItem("versus_trusted_device", data.trustedDeviceToken);
        } catch (e) {}
      }

      completeLogin(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Código incorreto ou expirado. Tente novamente.");
      setLoading(false);
    }
  };

  const completeLogin = (data: any) => {
    localStorage.setItem("versus_auth_token", data.access_token);
    localStorage.setItem("versus_user", JSON.stringify(data.user));
    setAuthCookie(data.access_token, data.user?.role);
    if (data.user?.tenantId) {
      localStorage.setItem("tenantId", data.user.tenantId);
    }
    try {
      window.dispatchEvent(new Event("auth_login"));
      window.dispatchEvent(new Event("tenant_switched"));
    } catch (e) {}

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
  };

  // Transição automática para o Dashboard ao concluir o Preloader
  const handleFinishBoot = () => {
    try {
      sessionStorage.setItem("versus_boot_completed", "true");
    } catch (e) {}

    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const callbackUrl = params?.get("callbackUrl");

      const stored = localStorage.getItem("versus_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.isSuperAdmin || parsed.role === "SUPER_ADMIN") {
          if (callbackUrl && callbackUrl.startsWith("/super-admin")) {
            router.push(callbackUrl);
            return;
          }
          router.push("/super-admin/companies");
          return;
        }
      }

      if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
        router.push(callbackUrl);
        return;
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

            {isVerifying2FA ? (
              <form onSubmit={handleVerify2FA} className="w-full flex flex-col gap-4 text-left relative z-10 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center gap-1 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-1 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    <ShieldCheck size={26} strokeWidth={2} />
                  </div>
                  <h4 className="text-white font-bold text-base tracking-wide">
                    Autorização de Acesso
                  </h4>
                  <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                    Código de 6 dígitos enviado ao WhatsApp de Segurança Master:
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-700/80 rounded-full text-[11px] font-mono text-blue-400 font-semibold mt-1">
                    <KeyRound size={12} />
                    <span>{maskedPhone}</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
                    {error}
                  </div>
                )}

                {/* Campo do Código OTP de 6 dígitos */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.7rem] font-semibold text-slate-300 uppercase tracking-widest text-center">
                    DIGITE O CÓDIGO DE 6 DÍGITOS
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    autoFocus
                    className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-4 py-3 text-2xl font-mono tracking-[0.5em] text-center outline-none transition-all focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] login-input-field"
                    required
                  />
                </div>

                {/* Checkbox: Lembrar deste computador por 30 dias */}
                <label
                  onClick={() => setRememberDevice(!rememberDevice)}
                  className="flex items-center gap-3 p-3 bg-slate-950/50 hover:bg-slate-900/60 border border-slate-800/80 rounded-xl cursor-pointer transition-all select-none group"
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      rememberDevice
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-900 border-slate-700 text-transparent group-hover:border-slate-500"
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-slate-200 font-medium group-hover:text-white transition-colors">
                      Lembrar deste computador por 30 dias
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Dispositivo confiável (dispensa código nesta máquina)
                    </span>
                  </div>
                </label>

                {/* Botão de Envio */}
                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length < 6}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-[0.95rem] rounded-[10px] mt-1 text-[0.88rem] tracking-wider uppercase transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer login-submit-btn"
                  style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Validando Código...
                    </>
                  ) : (
                    <>
                      AUTORIZAR E ENTRAR <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifying2FA(false);
                      setTwoFactorCode("");
                      setError("");
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleLogin(undefined, selectedTenantIdState)}
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    Reenviar código
                  </button>
                </div>
              </form>
            ) : isSelectingTenant ? (
              <div className="w-full flex flex-col gap-4 text-left relative z-10">
                <div className="text-center mb-1">
                  <h4 className="text-white font-bold text-base">Selecione a Empresa</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Este e-mail está habilitado em múltiplas empresas. Escolha qual deseja acessar agora:
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {availableTenants.map((t: any) => (
                    <button
                      key={t.tenantId}
                      type="button"
                      onClick={() => handleLogin(undefined, t.tenantId)}
                      disabled={loading}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-800/95 border border-slate-700/70 hover:border-blue-500/80 rounded-xl transition-all cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                          {t.tenantLogo ? (
                            <img src={t.tenantLogo} alt={t.tenantName} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            t.tenantName ? t.tenantName.charAt(0).toUpperCase() : "E"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">
                            {t.tenantName}
                          </p>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {t.role === "ADMIN" ? "Administrador" : "Operador"}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSelectingTenant(false);
                    setError("");
                  }}
                  className="text-center text-xs text-slate-400 hover:text-white transition-colors mt-2 cursor-pointer"
                >
                  ← Voltar para digitar credenciais
                </button>
              </div>
            ) : (
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
            )}

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
