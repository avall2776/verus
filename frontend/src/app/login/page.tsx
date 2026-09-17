"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import * as THREE from "three";

// ================= COMPONENTE OCEANO DE DADOS (DATA WAVE) THREE.JS =================
interface BackgroundSceneProps {
  isBooting: boolean;
}

const BackgroundScene = ({ isBooting }: BackgroundSceneProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isBootingRef = useRef(isBooting);

  useEffect(() => {
    isBootingRef.current = isBooting;
  }, [isBooting]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.025);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 15, 36);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Textura circular suave para as partículas
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

    // Grid de Partículas (Oceano de Dados)
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
      color: 0x00d2ff,
      size: 0.28,
      map: createCircleTexture(),
      alphaTest: 0.5,
      transparent: true,
      opacity: 0.65
    });

    const waveParticles = new THREE.Points(waveGeometry, waveMaterial);
    scene.add(waveParticles);

    // Iluminação Ambiente
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Interação do Mouse com Parallax
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

    // Loop de Renderização
    let count = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Durante o Boot, a câmera executa um sobrevoo suave e contínuo para a frente
      const targetCamZ = isBootingRef.current ? 26 : 36;
      const targetCamY = isBootingRef.current ? 12 : 15;

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY + targetCamY - camera.position.y) * 0.04;
      camera.position.z += (targetCamZ - camera.position.z) * 0.03;
      camera.lookAt(0, 1.5, 0);

      // Animação da Onda Senoidal do Oceano
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
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

const NeonWaveLogo = () => {
  const letters = "LOGOTIPO".split("");

  return (
    <div className="flex justify-center cursor-crosshair py-2 mb-2">
      <h1 className="text-4xl md:text-[2.5rem] font-black tracking-[0.15em] text-white flex">
        {letters.map((char, i) => (
          <span
            key={i}
            className="transition-all duration-300 ease-out inline-block hover:scale-125 hover:-translate-y-2 hover:text-accent hover:drop-shadow-[0_0_25px_rgba(0,210,255,1)] cursor-pointer"
          >
            {char}
          </span>
        ))}
      </h1>
    </div>
  );
};

// ================= PÁGINA DE LOGIN E BOOT MINIMALISTA EXECUTIVO (OPÇÃO 3) =================
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Transição do Card: 'idle' -> 'evaporating' (dissolução real) -> 'booting'
  const [cardState, setCardState] = useState<"idle" | "evaporating" | "booting">("idle");
  const [authUserName, setAuthUserName] = useState<string>("");
  const [bootProgress, setBootProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // 15 segundos calibrados de imersão
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

      // ETAPA 1: O card começa a evaporar (sem corte seco, com animação real de fumaça)
      setCardState("evaporating");
      setLoading(false);

      // ETAPA 2: Após a evaporação visual do card (850ms), ativa a fase de booting
      setTimeout(() => {
        setCardState("booting");
      }, 850);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao conectar com o servidor.");
      setLoading(false);
    }
  };

  // Temporizador cadenciado dos 15 segundos
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

  // Ação de conclusão com fade-out contínuo
  const handleFinishBoot = () => {
    if (isExiting) return;
    setIsExiting(true);

    try {
      sessionStorage.setItem("versus_boot_completed", "true");
    } catch (e) {}

    // Transição de saída de 1000ms antes da troca de rota
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

  // Teclas de atalho para avançar (ESC, Enter, Espaço)
  useEffect(() => {
    if (cardState !== "booting") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        handleFinishBoot();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cardState, isExiting]);

  // Textos dos estágios da montagem
  const getStageText = (progress: number) => {
    if (progress < 30) return "Inicializando ecossistema corporativo...";
    if (progress < 65) return "Sincronizando barramento neural e agentes de IA...";
    if (progress < 95) return "Compilando canais de atendimento e telemetria...";
    return "Ambiente pronto para operação!";
  };

  const getStageSubtext = (progress: number) => {
    if (progress < 30) return "AUTENTICAÇÃO & WORKSPACES MULTITENANT";
    if (progress < 65) return "NEURAL BUS & INSTÂNCIAS CONECTADAS";
    if (progress < 95) return "FUNIS COMERCIAIS & REALTIME SOCKETS";
    return "CARREGANDO WORKSPACE VERSUS...";
  };

  return (
    <div
      onClick={() => {
        if (cardState === "booting") handleFinishBoot();
      }}
      className={`flex min-h-screen items-center justify-center relative overflow-hidden bg-[#050814] transition-all duration-1000 ease-in-out select-none ${
        isExiting ? "opacity-0 scale-105 filter blur-2xl pointer-events-none" : "opacity-100 scale-100"
      } ${cardState === "booting" ? "cursor-pointer" : ""}`}
    >
      {/* Estilos CSS Inline de Animação e Evaporação */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0% { transform: translateY(-4px); }
          100% { transform: translateY(6px); }
        }
        @keyframes hologramBoot {
          0% { 
            opacity: 0; 
            filter: blur(20px) brightness(200%); 
            transform: scale(0.9) translateY(40px);
            box-shadow: inset 0 0 100px rgba(0,210,255,0.8);
          }
          60% {
            opacity: 0.8;
            filter: blur(5px) brightness(150%);
            transform: scale(1.02) translateY(-5px);
            box-shadow: inset 0 0 20px rgba(0,210,255,0.4);
          }
          100% { 
            opacity: 1; 
            filter: blur(0px) brightness(100%);
            transform: scale(1) translateY(0);
            box-shadow: none;
          }
        }
      `}} />

      {/* Fundo 3D: Oceano de Dados Infinito */}
      <BackgroundScene isBooting={cardState === "booting"} />

      {/* Glow Orbs idênticos para atmosfera corporativa */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      {/* ========================================================== */}
      {/* 1. CARD DE LOGIN COM EVAPORAÇÃO VISUAL REAL ("FUMAÇA")      */}
      {/* ========================================================== */}
      {cardState !== "booting" && (
        <>
          {/* Voltar ao site */}
          <div
            className={`fixed top-8 left-8 md:left-[5%] z-20 transition-opacity duration-500 ${
              cardState === "evaporating" ? "opacity-0" : "opacity-100"
            }`}
          >
            <a
              href="#"
              className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors text-[0.82rem] font-semibold uppercase tracking-[0.15rem]"
            >
              &larr; IR PARA O SITE
            </a>
          </div>

          {/* Card de Formulário: quando 'evaporating', aplica blur(30px), escala 0.8 e fade suave de 850ms */}
          <div
            className={`w-full max-w-[440px] p-6 relative z-10 transition-all duration-[850ms] ease-out ${
              cardState === "evaporating"
                ? "opacity-0 scale-[0.82] filter blur-[32px] pointer-events-none -translate-y-6"
                : "animate-[hologramBoot_2s_ease-out_forwards,float_7s_ease-in-out_2s_infinite_alternate] opacity-0"
            }`}
          >
            <div
              className="bg-[#0B1224]/35 border border-gray-800/50 rounded-[20px] px-10 py-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col relative overflow-hidden group"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
              }}
            >
              <div
                className="pointer-events-none absolute -inset-px rounded-[20px] opacity-0 transition duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(0, 210, 255, 0.12), transparent 40%)`
                }}
              />

              <div className="mb-10 text-center flex flex-col items-center relative z-10">
                <div className="bg-background/50 border border-accent/40 text-accent text-[0.65rem] uppercase tracking-[0.2em] font-bold py-1 px-4 rounded-full mb-6 shadow-[0_0_15px_rgba(0,210,255,0.15)]">
                  SEJA BEM-VINDO
                </div>

                <NeonWaveLogo />

                <p className="text-text-secondary text-[0.85rem] mt-2">
                  A evolução do atendimento e conversão em tempo real.
                </p>
              </div>

              <form onSubmit={handleLogin} className="w-full flex flex-col gap-5 text-left relative z-10">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[0.75rem] font-bold text-accent uppercase tracking-[0.12rem]">
                    E-MAIL CORPORATIVO
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background/60 border border-gray-800/40 text-text-primary rounded-[10px] px-4 py-[0.85rem] text-[0.95rem] outline-none transition-all focus:border-accent focus:shadow-[0_0_15px_rgba(0,210,255,0.25)] focus:bg-background/90 placeholder:text-gray-600"
                    placeholder="admin@verto.com"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[0.75rem] font-bold text-accent uppercase tracking-[0.12rem]">
                    CHAVE DE ACESSO / SENHA
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background/60 border border-gray-800/40 text-text-primary rounded-[10px] pl-4 pr-12 py-[0.85rem] text-[0.95rem] outline-none transition-all focus:border-accent focus:shadow-[0_0_15px_rgba(0,210,255,0.25)] focus:bg-background/90 placeholder:text-gray-600"
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-black py-[0.95rem] rounded-[10px] mt-4 text-[0.88rem] tracking-[0.15rem] uppercase transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(0,85,255,0.5)] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
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

              <div className="flex justify-between items-center text-[0.75rem] text-text-secondary mt-8 relative z-10">
                <span>Painel Restrito</span>
                <a href="#" className="hover:text-accent transition-colors">
                  Recuperar Chave
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================== */}
      {/* 2. BOOTING EXECUTIVO MINIMALISTA (SEM COLISÃO, 100% LIMPO) */}
      {/* ========================================================== */}
      {cardState === "booting" && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-between p-8 pointer-events-auto animate-[fadeIn_1s_ease-out_forwards]">
          
          {/* Topo Discreto */}
          <div className="w-full flex items-center justify-end pt-2 opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-mono tracking-wider text-slate-400">
              Pressione ESC ou clique para entrar
            </span>
          </div>

          {/* CENTRO EXATO: Saudação Executiva & Barra Luminescente */}
          <div className="w-full my-auto flex flex-col items-center justify-center text-center z-20 pointer-events-none space-y-5 max-w-xl mx-auto px-4">
            
            {/* Saudação com Ponto Luminescente e Nome Real */}
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-wide flex items-center justify-center gap-3.5 drop-shadow-[0_10px_35px_rgba(0,0,0,0.95)]">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_15px_#00d2ff]" />
                <span>Bem-vindo de volta, {authUserName || "Felipe"}</span>
              </h2>

              {/* Status Dinâmico de Inicialização */}
              <p className="text-sm sm:text-base font-mono tracking-wider text-slate-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                {getStageText(bootProgress)}
              </p>
            </div>

            {/* Linha Luminescente Monocromática Minimalista dos 15 Segundos */}
            <div className="w-64 sm:w-96 h-[2.5px] bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner mt-2">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 transition-all duration-150 shadow-[0_0_15px_#00d2ff]"
                style={{ width: `${bootProgress}%` }}
              />
            </div>

            {/* Subtexto Técnico dos Subsistemas */}
            <p className="text-[11px] sm:text-xs text-slate-500 font-mono tracking-widest uppercase">
              {getStageSubtext(bootProgress)}
            </p>

          </div>

          {/* RODAPÉ: Botão de Acesso Direto */}
          <div className="w-full flex flex-col items-center pb-4 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFinishBoot();
              }}
              className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0B1224]/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-xl transition-all shadow-xl hover:shadow-cyan-500/10 cursor-pointer"
            >
              <span>Acessar Painel Principal</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
