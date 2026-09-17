"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import * as THREE from "three";

// ================= COMPONENTE OCEANO DE DADOS & MONÓLITO 3D "V" THREE.JS =================
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
    // Fundo e neblina estritamente corporativos em azul escuro #0B1224
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

    // Grid de Partículas (Oceano de Dados em Azul Corporativo Sóbrio)
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

    // Material das partículas: azul corporativo sóbrio (blue-500/600), sem brilho neon
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

    // ================= MONÓLITO 3D DA LETRA "V" =================
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

    // Material corporativo em slate-800 escovado com reflexos e iluminação física
    const vMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.65,
      roughness: 0.25,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      reflectivity: 0.8,
    });

    const vMesh = new THREE.Mesh(vGeometry, vMaterial);

    // Arestas luminescentes em azul corporativo sóbrio
    const edgesGeom = new THREE.EdgesGeometry(vGeometry, 22);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.65,
    });
    const vEdges = new THREE.LineSegments(edgesGeom, edgesMat);
    vMesh.add(vEdges);

    // Inicialmente recolhido e invisível durante a exibição do formulário
    vMesh.position.set(0, 3.4, -30);
    vMesh.scale.set(0.001, 0.001, 0.001);
    vMesh.visible = false;
    scene.add(vMesh);

    // ================= ILUMINAÇÃO EQUILIBRADA =================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xdbeafe, 2.4);
    keyLight.position.set(5, 14, 18);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 1.4);
    fillLight.position.set(-6, -2, 12);
    scene.add(fillLight);

    // Interação do Mouse com Parallax
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

      const isBoot = isBootingRef.current;

      // Câmera interpola suavemente
      const targetCamZ = isBoot ? 25 : 34;
      const targetCamY = isBoot ? 10 : 14;

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY + targetCamY - camera.position.y) * 0.04;
      camera.position.z += (targetCamZ - camera.position.z) * 0.03;
      camera.lookAt(0, 1.5, 0);

      // Animação do Monólito 3D "V" no Preloader
      if (isBoot) {
        vMesh.visible = true;
        // Avanço suave para o primeiro plano (posição Z = 5.5, Y = 3.2 na metade superior)
        vMesh.position.z += (5.5 - vMesh.position.z) * 0.045;
        vMesh.position.y = 3.2 + Math.sin(count * 1.5) * 0.15;

        // Escala cresce suavemente até 0.85
        const currentScale = vMesh.scale.x;
        const nextScale = currentScale + (0.85 - currentScale) * 0.05;
        vMesh.scale.set(nextScale, nextScale, nextScale);

        // Parallax reativo suave ao mouse
        vMesh.rotation.y = mouseX * 0.2;
        vMesh.rotation.x = 0.05 + (-mouseY * 0.12);
      } else {
        vMesh.visible = false;
        vMesh.scale.set(0.001, 0.001, 0.001);
        vMesh.position.set(0, 3.4, -30);
      }

      // Animação da Onda Senoidal do Oceano
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

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// ================= PÁGINA DE LOGIN E PRELOADER CORPORATIVO MONOCROMÁTICO =================
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Transição do Card: 'idle' -> 'evaporating' (desmaterialização suave de 700ms) -> 'booting'
  const [cardState, setCardState] = useState<"idle" | "evaporating" | "booting">("idle");
  const [authUserName, setAuthUserName] = useState<string>("");
  const [bootProgress, setBootProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // 15 segundos calibrados de imersão corporativa
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

      // ETAPA 1: O card de login transiciona suavemente (fade-out + scale-down + slide-up)
      setCardState("evaporating");
      setLoading(false);

      // ETAPA 2: Após a desmaterialização fluida (700ms), ativa a imersão contínua com o preloader
      setTimeout(() => {
        setCardState("booting");
      }, 700);
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

  // Ação de conclusão com fade-out contínuo de 1000ms
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

  // Textos dos estágios de inicialização
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
      className={`flex min-h-screen items-center justify-center relative overflow-hidden bg-[#0B1224] transition-all duration-1000 ease-in-out select-none ${
        isExiting ? "opacity-0 scale-105 filter blur-xl pointer-events-none" : "opacity-100 scale-100"
      } ${cardState === "booting" ? "cursor-pointer" : ""}`}
    >
      {/* Fundo 3D: Oceano de Dados & Monólito 3D da Letra "V" */}
      <BackgroundScene isBooting={cardState === "booting"} />

      {/* ========================================================== */}
      {/* 1. CARD DE LOGIN COM DESMATERIALIZAÇÃO SUAVE (700MS)       */}
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
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider"
            >
              &larr; IR PARA O SITE
            </a>
          </div>

          {/* Card do Formulário: Desmaterialização fluida em fade-out + scale-down + slide-up suave */}
          <div
            className={`w-full max-w-[440px] p-6 relative z-10 transition-all duration-700 ease-out ${
              cardState === "evaporating"
                ? "opacity-0 scale-95 -translate-y-6 filter blur-lg pointer-events-none"
                : "opacity-100 scale-100 translate-y-0"
            }`}
          >
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-8 py-10 sm:px-10 sm:py-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl flex flex-col relative">
              
              {/* Cabeçalho Corporativo Limpo */}
              <div className="mb-8 text-center flex flex-col items-center">
                <div className="bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[0.68rem] uppercase tracking-[0.2em] font-semibold py-1 px-4 rounded-full mb-5">
                  SEJA BEM-VINDO
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-[0.22em] text-white">
                  VERSUS
                </h1>

                <p className="text-slate-400 text-sm mt-2">
                  Inteligência em Vendas & Atendimento Omnichannel
                </p>
              </div>

              {/* Formulário de Autenticação */}
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-5 text-left">
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
                    className="w-full bg-slate-950/70 border border-slate-800 text-white rounded-xl px-4 py-3.5 text-[0.95rem] outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:bg-slate-950 placeholder:text-slate-600"
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
                      className="w-full bg-slate-950/70 border border-slate-800 text-white rounded-xl pl-4 pr-12 py-3.5 text-[0.95rem] outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:bg-slate-950 placeholder:text-slate-600"
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-3.5 rounded-xl mt-4 text-[0.88rem] tracking-wider uppercase transition-all shadow-lg shadow-blue-950/30 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
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

              <div className="flex justify-between items-center text-xs text-slate-500 mt-8">
                <span>Painel Restrito</span>
                <a href="#" className="hover:text-slate-300 transition-colors">
                  Recuperar Chave
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================== */}
      {/* 2. PRELOADER DO GRANDE "V" CORPORATIVO & SAUDAÇÃO LIMPA     */}
      {/* ========================================================== */}
      {cardState === "booting" && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-between p-8 pointer-events-auto animate-[fadeIn_0.8s_ease-out_forwards]">
          
          {/* Topo Sutil */}
          <div className="w-full flex items-center justify-end pt-2 opacity-60 hover:opacity-100 transition-opacity">
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
                <span>Bem-vindo de volta, {authUserName || "Felipe"}</span>
              </h2>

              {/* Status Dinâmico de Inicialização */}
              <p className="text-xs sm:text-sm font-mono tracking-wider text-slate-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {getStageText(bootProgress)}
              </p>
            </div>

            {/* Linha Luminescente Monocromática Minimalista dos 15 Segundos */}
            <div className="w-64 sm:w-80 h-[2.5px] bg-slate-800/90 rounded-full overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 transition-all duration-150"
                style={{ width: `${bootProgress}%` }}
              />
            </div>

            {/* Subtexto Técnico dos Subsistemas */}
            <p className="text-[11px] text-slate-400 font-mono tracking-widest uppercase">
              {getStageSubtext(bootProgress)}
            </p>

            {/* Botão de Acesso Direto */}
            <div className="pointer-events-auto pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFinishBoot();
                }}
                className="group inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium backdrop-blur-xl transition-all shadow-lg cursor-pointer"
              >
                <span>Acessar Painel Principal</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
