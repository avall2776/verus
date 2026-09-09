"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import * as THREE from "three";
import Tilt from "react-parallax-tilt";

// Componente Oceano de Dados (Data Wave) Three.js
const BackgroundParticles = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.025);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Helper para criar textura de círculo
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    };

    // Grid de Partículas (Onda)
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
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({ 
      color: 0x00d2ff, // VERSUS Accent Cyan
      size: 0.25,
      map: createCircleTexture(),
      alphaTest: 0.5,
      transparent: true,
      opacity: 0.65
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
      targetX = (e.clientX - windowHalfX) * 0.08;
      targetY = (e.clientY - windowHalfY) * 0.08;
    };
    window.addEventListener('mousemove', onPointerMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let count = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY + 12 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      const positions = particles.geometry.attributes.position.array;
      
      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          positions[i + 1] = 
            (Math.sin((ix + count) * 0.3) * 2) +
            (Math.sin((iy + count) * 0.4) * 2);
          i += 3;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      count += 0.04;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

const NeonWaveLogo = () => {
  const letters = 'LOGOTIPO'.split('');

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Usando fetch direto ou api do axios. Como temos axios configurado em lib/api.ts:
      const { default: api } = await import('@/lib/api');
      const { data } = await api.post('/auth/login', { email, password });
      
      localStorage.setItem("versus_auth_token", data.access_token);
      localStorage.setItem("versus_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao conectar com o servidor.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-background">
      {/* Background Particles na cor VERSUS Accent */}
      <BackgroundParticles />
      
      {/* Glow extra no fundo para reforçar a marca VERSUS */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Voltar ao site */}
      <div className="fixed top-8 left-8 md:left-[5%] z-20">
        <a href="#" className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors text-[0.82rem] font-semibold uppercase tracking-[0.15rem]">
          &larr; IR PARA O SITE
        </a>
      </div>

      {/* Container Principal com Animação de Entrada Holográfica e Float contínuo */}
      <div className="w-full max-w-[440px] p-6 relative z-10 animate-[hologramBoot_2s_ease-out_forwards,float_7s_ease-in-out_2s_infinite_alternate] opacity-0">
        <style dangerouslySetInnerHTML={{__html: `
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
        
        {/* Card de Vidro refinado (Menos transparência para maior definição) e Spotlight Track */}
        <div 
          className="bg-[#0B1224]/30 border border-gray-800/50 rounded-[20px] px-10 py-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col relative overflow-hidden group"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
          }}
        >
          
          {/* O Efeito Spotlight (Lanterna de Mouse estilo Vercel/Linear) */}
          <div className="pointer-events-none absolute -inset-px rounded-[20px] opacity-0 transition duration-500 group-hover:opacity-100"
               style={{
                 background: `radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(0, 210, 255, 0.12), transparent 40%)`
               }}
          />

          <div className="mb-10 text-center flex flex-col items-center relative z-10">
            {/* Badge SEJA BEM-VINDO */}
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
              <label className="text-[0.75rem] font-bold text-accent uppercase tracking-[0.12rem]">E-MAIL CORPORATIVO</label>
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
              <label className="text-[0.75rem] font-bold text-accent uppercase tracking-[0.12rem]">CHAVE DE ACESSO / SENHA</label>
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
              className="w-full bg-primary text-white font-black py-[0.95rem] rounded-[10px] mt-4 text-[0.88rem] tracking-[0.15rem] uppercase transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(0,85,255,0.5)] flex items-center justify-center gap-2 disabled:opacity-70"
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
            <a href="#" className="hover:text-accent transition-colors">Recuperar Chave</a>
          </div>

        </div>
      </div>
    </div>
  );
}
