"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  Square,
  Upload,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  Eye,
  Radio,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Send,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Settings2,
  Film,
  Layers,
  Activity,
  Sliders,
  Download,
  Trash2,
  FileAudio,
  Kanban,
  Map,
  Target,
  FileText,
  PhoneCall,
  Zap,
  Bot,
  UserCheck,
  Headphones,
  Check,
  MousePointer,
  ArrowRight
} from "lucide-react";

// Definição dos Módulos do Motion Studio
interface MotionScene {
  id: number;
  name: string;
  badge: string;
  startTime: number; // segundos
  endTime: number;   // segundos
  teleprompter: string;
}

interface MotionModule {
  id: string;
  title: string;
  category: string;
  duration: number; // segundos
  routeRef: string;
  description: string;
  scenes: MotionScene[];
}

const MOTION_MODULES: MotionModule[] = [
  {
    id: "radar_stories",
    title: "Radar de Stories do WhatsApp",
    category: "CRM & Engajamento",
    duration: 35,
    routeRef: "/crm/radar-stories",
    description: "Detecção em tempo real de visualizações de Stories com cálculo preditivo de intenção de compra.",
    scenes: [
      {
        id: 1,
        name: "Abertura Cinética & Logo",
        badge: "Ato 1: Oportunidade Oculta",
        startTime: 0,
        endTime: 5,
        teleprompter: "Você sabia que seus maiores clientes assistem seus Stories do WhatsApp todos os dias, mas você não sabe quem deles está pronto para fechar negócio agora?"
      },
      {
        id: 2,
        name: "Painel Radar de Stories 3D",
        badge: "Ato 2: Telemetria Ativa",
        startTime: 5,
        endTime: 12,
        teleprompter: "O VALLOR Radar monitora cada visualização dos seus Status e identifica automaticamente clientes com comportamento de compra ativa."
      },
      {
        id: 3,
        name: "Close-up 3D Score 95%",
        badge: "Ato 3: Intenção Alta",
        startTime: 12,
        endTime: 20,
        teleprompter: "Veja este exemplo: o Carlos acabou de visualizar seu status e o algoritmo calculou 95% de score de intenção baseado no histórico dele."
      },
      {
        id: 4,
        name: "Abordagem com 1 Clique & Match Cut",
        badge: "Ato 4: Conversão no WhatsApp",
        startTime: 20,
        endTime: 28,
        teleprompter: "Com apenas um clique, o corretor já inicia uma abordagem consultiva e contextualizada direto no WhatsApp, sem perder o timing da venda."
      },
      {
        id: 5,
        name: "Fechamento & Chamada para Ação",
        badge: "Ato 5: Fechamento",
        startTime: 28,
        endTime: 35,
        teleprompter: "Pare de deixar dinheiro na mesa. Transforme visualizações silenciosas em vendas fechadas com a VALLOR."
      }
    ]
  },
  {
    id: "full_tour",
    title: "Tour Completo VALLOR (Visão Geral)",
    category: "Ecossistema Completo",
    duration: 60,
    routeRef: "/dashboard",
    description: "Visão panorâmica em 3D dos principais pilares do ecossistema: Inbox IA, CRM Kanban, Radar, Mapa Tático e Metas.",
    scenes: [
      {
        id: 1,
        name: "Abertura Institucional VALLOR",
        badge: "Ato 1: Apresentação",
        startTime: 0,
        endTime: 8,
        teleprompter: "Bem-vindo ao VALLOR: o ecossistema definitivo que une CRM, Inteligência Artificial e Atendimento WhatsApp em uma única plataforma corporativa."
      },
      {
        id: 2,
        name: "Central de Atendimento & Copiloto IA",
        badge: "Ato 2: Atendimento Omnichannel",
        startTime: 8,
        endTime: 18,
        teleprompter: "Na Central de Atendimento, sua equipe gerencia centenas de conversas com copiloto de IA, player de áudio integrado com transcrição e notas internas em tempo real."
      },
      {
        id: 3,
        name: "CRM Kanban com Pipeline Financeiro",
        badge: "Ato 3: Gestão de Oportunidades",
        startTime: 18,
        endTime: 28,
        teleprompter: "No CRM Kanban, visualize cada oportunidade do seu funil comercial com valores consolidados por coluna e movimentação ágil e fluida."
      },
      {
        id: 4,
        name: "Radar de Stories do WhatsApp",
        badge: "Ato 4: Prospecção Ativa",
        startTime: 28,
        endTime: 38,
        teleprompter: "O exclusivo Radar de Stories identifica quem está engajando com seus status e sinaliza leads quentes antes dos concorrentes."
      },
      {
        id: 5,
        name: "Mapa Tático Geográfico IBGE",
        badge: "Ato 5: Inteligência Territorial",
        startTime: 38,
        endTime: 48,
        teleprompter: "Com o Mapa Tático Geográfico integrado ao IBGE, localize a densidade da sua carteira e planeje rotas comerciais com precisão cirúrgica."
      },
      {
        id: 6,
        name: "Metas & Run Rate em Tempo Real",
        badge: "Ato 6: Previsibilidade de Receita",
        startTime: 48,
        endTime: 55,
        teleprompter: "Acompanhe o Run Rate e as metas da equipe com previsibilidade matemática e gamificação corporativa para bater recordes todo mês."
      },
      {
        id: 7,
        name: "Encerramento & Demonstração",
        badge: "Ato 7: Conexão VALLOR",
        startTime: 55,
        endTime: 60,
        teleprompter: "VALLOR. Potencialize suas vendas consultivas com inteligência e escala. Agende agora uma demonstração exclusiva com nossos especialistas."
      }
    ]
  },
  {
    id: "inbox_ai",
    title: "Inbox WhatsApp & Agente IA",
    category: "Comunicação",
    duration: 30,
    routeRef: "/inbox",
    description: "Multiatendimento, transcrição de voz, copiloto autônomo e notas internas amarelas.",
    scenes: [
      {
        id: 1,
        name: "Módulo em Preparação",
        badge: "Roteiro Configurado",
        startTime: 0,
        endTime: 30,
        teleprompter: "O VALLOR Inbox centraliza o WhatsApp da sua operação com transbordo inteligente para corretores humanos."
      }
    ]
  },
  {
    id: "crm_kanban",
    title: "CRM Kanban & Funil de Vendas",
    category: "Vendas",
    duration: 30,
    routeRef: "/crm",
    description: "Gestão visual de negociações de alto tíquete com somatória em tempo real.",
    scenes: [
      {
        id: 1,
        name: "Módulo em Preparação",
        badge: "Roteiro Configurado",
        startTime: 0,
        endTime: 30,
        teleprompter: "Mova oportunidades de milhões com um simples clique e acompanhe o fluxo de caixa projetado."
      }
    ]
  },
  {
    id: "mapa_ibge",
    title: "Mapa Tático & Geo-Inteligência",
    category: "Inteligência",
    duration: 30,
    routeRef: "/dashboard/mapa",
    description: "Segmentação por municípios brasileiros, microrregiões e potencial agrário.",
    scenes: [
      {
        id: 1,
        name: "Módulo em Preparação",
        badge: "Roteiro Configurado",
        startTime: 0,
        endTime: 30,
        teleprompter: "Explore clientes e oportunidades cruzadas com a malha territorial e índices econômicos do IBGE."
      }
    ]
  },
  {
    id: "goals_runrate",
    title: "Metas, Leaderboard & Run Rate",
    category: "Performance",
    duration: 30,
    routeRef: "/dashboard/goals",
    description: "Termômetro de metas da empresa e ranking gamificado sem poluição visual.",
    scenes: [
      {
        id: 1,
        name: "Módulo em Preparação",
        badge: "Roteiro Configurado",
        startTime: 0,
        endTime: 30,
        teleprompter: "Mantenha seu time comercial focado no objetivo com métricas transparentes e acompanhamento em tempo real."
      }
    ]
  }
];

export default function MotionStudioPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("radar_stories");
  const [aspectRatio, setAspectRatio] = useState<"vertical" | "horizontal">("vertical"); // 9:16 vs 16:9
  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false); // Tela cheia limpa para gravação
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Narração Humana & Áudio
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [showTeleprompter, setShowTeleprompter] = useState<boolean>(true);

  // Refs de controle de mídia e animação
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);

  const activeModule = useMemo(() => {
    return MOTION_MODULES.find((m) => m.id === selectedModuleId) || MOTION_MODULES[0];
  }, [selectedModuleId]);

  // Cena ativa calculada a partir do currentTime
  const currentScene = useMemo(() => {
    const sc = activeModule.scenes.find(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    );
    return sc || activeModule.scenes[activeModule.scenes.length - 1];
  }, [activeModule, currentTime]);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Atalhos de Teclado (Barra de espaço para Play/Pause, ESC para sair do modo gravação limpa)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "Escape") {
        if (isRecordingMode) {
          setIsRecordingMode(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isRecordingMode]);

  // Engine de Sincronia da Timeline (60 FPS com requestAnimationFrame e sincronia de Áudio)
  useEffect(() => {
    if (!isPlaying) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      lastTickTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    if (audioRef.current && audioUrl) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch(() => {});
    }

    const tick = (now: number) => {
      if (lastTickTimeRef.current === null) {
        lastTickTimeRef.current = now;
      }
      const delta = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      setCurrentTime((prev) => {
        // Se houver áudio nativo tocando, prioriza a sincronia exata do áudio
        if (audioRef.current && audioUrl && !audioRef.current.paused) {
          const syncTime = audioRef.current.currentTime;
          if (syncTime >= activeModule.duration) {
            setIsPlaying(false);
            return activeModule.duration;
          }
          return syncTime;
        }

        const next = prev + delta * playbackSpeed;
        if (next >= activeModule.duration) {
          setIsPlaying(false);
          return activeModule.duration;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, activeModule.duration, audioUrl]);

  const togglePlay = () => {
    if (currentTime >= activeModule.duration) {
      seekTo(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const seekTo = (time: number) => {
    const clamped = Math.max(0, Math.min(time, activeModule.duration));
    setCurrentTime(clamped);
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  const handleRestart = () => {
    seekTo(0);
    setIsPlaying(true);
  };

  // Upload de arquivo de voz humana (.mp3, .wav, etc.)
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFileName(file.name);
      seekTo(0);
    }
  };

  // Gravador de Voz Humana Nativo (MediaRecorder)
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlobUrl(url);
        setAudioUrl(url);
        setAudioFileName(`locucao_humana_${activeModule.id}.webm`);
        seekTo(0);
      };

      mediaRecorder.start(100);
      setIsRecordingVoice(true);
      setRecordingDuration(0);

      // Inicia playback sincronizado para apoiar o locutor na leitura
      seekTo(0);
      setIsPlaying(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar seu microfone. Verifique as permissões do navegador.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      setIsPlaying(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const clearAudioTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioUrl(null);
    setAudioFileName(null);
    setRecordedBlobUrl(null);
  };

  if (!mounted) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-[#050814] text-slate-100 font-sans flex flex-col select-none overflow-hidden">
      {/* Elemento de áudio invisível para sincronia de narração humana */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          muted={isMuted}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* ============================================================== */}
      {/* 1. BARRA DE DIREÇÃO SUPERIOR (Ocultável no Modo Gravação) */}
      {/* ============================================================== */}
      {!isRecordingMode && (
        <header className="w-full border-b border-[#1E293B] bg-[#0B1224]/90 backdrop-blur px-5 py-3 z-30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0055FF]/10 border border-[#0055FF]/30">
              <Film className="w-4 h-4 text-[#00D2FF]" />
              <span className="text-xs font-semibold tracking-wider text-[#00D2FF] uppercase">
                VALLOR Motion Studio
              </span>
            </div>
            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
            <span className="text-xs font-mono text-slate-400 hidden sm:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              60 FPS RENDER ENGINE
            </span>
          </div>

          {/* Seletores Centrais: Módulo e Aspect Ratio */}
          <div className="flex items-center gap-2">
            {/* Seletor de Módulo */}
            <div className="relative flex items-center">
              <select
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  seekTo(0);
                  setIsPlaying(false);
                }}
                className="bg-[#050814] text-xs font-medium text-slate-200 border border-[#1E293B] rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-[#0055FF] transition-all cursor-pointer"
              >
                {MOTION_MODULES.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.title} ({mod.duration}s)
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Formato: Vertical 9:16 vs Horizontal 16:9 */}
            <div className="flex items-center bg-[#050814] p-1 rounded-lg border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setAspectRatio("vertical")}
                title="Formato Vertical 9:16 (Reels, TikTok, Shorts)"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  aspectRatio === "vertical"
                    ? "bg-[#0055FF] text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("horizontal")}
                title="Formato Horizontal 16:9 (Widescreen, YouTube, Pitch)"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  aspectRatio === "horizontal"
                    ? "bg-[#0055FF] text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>16:9</span>
              </button>
            </div>
          </div>

          {/* Ações da Direita: Modo Gravação e Teleprompter */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTeleprompter(!showTeleprompter)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                showTeleprompter
                  ? "bg-[#0055FF]/10 border-[#0055FF]/40 text-[#00D2FF]"
                  : "bg-[#050814] border-[#1E293B] text-slate-400 hover:text-slate-200"
              }`}
              title="Alternar Teleprompter"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Teleprompter</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRecordingMode(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Oculta todos os menus e controles para gravação limpa no OBS Studio"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Modo Gravação Limpa</span>
            </button>
          </div>
        </header>
      )}

      {/* Botão Flutuante para Sair do Modo Gravação Limpa (se ativado) */}
      {isRecordingMode && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 group">
          <button
            type="button"
            onClick={() => setIsRecordingMode(false)}
            className="opacity-20 hover:opacity-100 transition-opacity px-3 py-1.5 rounded-md bg-[#0B1224]/90 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 backdrop-blur shadow-lg"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Sair do Modo Gravação (ESC)</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ÁREA PRINCIPAL: PALCO 3D CENTRAL & PAINEL DE LOCUÇÃO */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-3 sm:p-6 gap-6 relative">
        {/* PALCO CINEMÁTICO 3D */}
        <div className="relative flex items-center justify-center flex-1 w-full h-full">
          {/* Moldura de Proporção (9:16 ou 16:9) */}
          <div
            className={`relative overflow-hidden rounded-2xl border-2 border-[#1E293B] bg-[#050814] shadow-2xl transition-all duration-500 flex flex-col justify-between ${
              aspectRatio === "vertical"
                ? "w-[360px] sm:w-[390px] h-[640px] sm:h-[690px] max-h-[82vh]"
                : "w-full max-w-[960px] aspect-video max-h-[75vh]"
            }`}
            style={{
              boxShadow: "0 25px 60px -15px rgba(0, 85, 255, 0.15), 0 0 30px rgba(0,0,0,0.8)",
              perspective: "1200px"
            }}
          >
            {/* Overlay sutil de Grid Tático e Iluminação de Borda */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 20%, rgba(0, 85, 255, 0.25), transparent 70%)"
              }}
            />

            {/* ÁREA DE RENDERIZAÇÃO DA CENA ATIVA */}
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedModuleId === "radar_stories" ? (
                  <RadarStoriesSceneDirector
                    key={`radar-scene-${currentScene.id}`}
                    scene={currentScene}
                    currentTime={currentTime}
                    aspectRatio={aspectRatio}
                  />
                ) : selectedModuleId === "full_tour" ? (
                  <FullTourSceneDirector
                    key={`tour-scene-${currentScene.id}`}
                    scene={currentScene}
                    currentTime={currentTime}
                    aspectRatio={aspectRatio}
                  />
                ) : (
                  <UpcomingModuleSceneDirector
                    key={`module-scene-${activeModule.id}`}
                    module={activeModule}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Badge de Resolução & Status no Canto do Palco */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                {aspectRatio === "vertical" ? "1080 x 1920 (9:16)" : "1920 x 1080 (16:9)"}
              </span>
            </div>

            {/* Badge da Cena no Canto Superior Direito */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-[#00D2FF] backdrop-blur">
              <span>{currentScene.badge}</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PAINEL LATERAL: TELEPROMPTER & GRAVADOR DE VOZ HUMANA */}
        {/* ============================================================== */}
        {!isRecordingMode && showTeleprompter && (
          <aside className="w-full lg:w-80 xl:w-96 flex flex-col gap-4 z-20">
            {/* Card de Locução Humana & Gravação */}
            <div className="bg-[#0B1224] border border-[#1E293B] rounded-xl p-4 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#0055FF]" />
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Locução Humana Real
                  </h3>
                </div>
                {audioUrl && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Sincronizado
                  </span>
                )}
              </div>

              {/* Botões: Gravar Minha Voz Agora vs Upload */}
              <div className="flex flex-col gap-2">
                {!isRecordingVoice ? (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="w-full py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Mic className="w-4 h-4 text-red-400" />
                    <span>Gravar Minha Voz Agora</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="w-full py-2 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-2 animate-pulse transition-all shadow-md shadow-red-900/40"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Concluir Gravação ({formatTime(recordingDuration)})</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex-1 py-1.5 px-3 rounded-lg bg-[#050814] hover:bg-slate-800/60 border border-[#1E293B] text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Subir Áudio (.mp3, .wav)</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                  </label>

                  {audioUrl && (
                    <button
                      type="button"
                      onClick={clearAudioTrack}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remover áudio carregado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {audioFileName && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono truncate">
                    <FileAudio className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                    <span className="truncate">{audioFileName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Teleprompter HUD: Roteiro Sincronizado por Cena */}
            <div className="bg-[#0B1224] border border-[#1E293B] rounded-xl p-4 shadow-lg flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#00D2FF]" />
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Teleprompter Oficial
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Cena {currentScene.id} / {activeModule.scenes.length}
                  </span>
                </div>

                {/* Texto Ativo em Destaque com Tipografia Limpa */}
                <div className="p-3.5 rounded-lg bg-[#050814] border border-[#1E293B]/80 text-sm leading-relaxed text-slate-100 font-medium tracking-normal shadow-inner">
                  &ldquo;{currentScene.teleprompter}&rdquo;
                </div>
              </div>

              {/* Barra de Progresso da Cena Atual */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{currentScene.name}</span>
                  <span>
                    {formatTime(currentTime)} / {formatTime(currentScene.endTime)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0055FF] to-[#00D2FF] transition-all duration-200"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          ((currentTime - currentScene.startTime) /
                            (currentScene.endTime - currentScene.startTime)) *
                            100
                        )
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. TIMELINE & CONTROLES DE REPRODUÇÃO INFERIOR */}
      {/* ============================================================== */}
      {!isRecordingMode && (
        <footer className="w-full border-t border-[#1E293B] bg-[#0B1224] px-4 py-3 z-30 flex flex-col gap-2">
          {/* Scrubber Interativo com Marcadores de Cena */}
          <div className="relative w-full flex items-center group">
            {/* Trilho da Timeline */}
            <div
              className="relative w-full h-3 bg-slate-900 rounded-full cursor-pointer overflow-hidden border border-slate-800"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = clickX / rect.width;
                seekTo(ratio * activeModule.duration);
              }}
            >
              {/* Barra de Progresso Preenchida */}
              <div
                className="h-full bg-gradient-to-r from-[#0055FF] via-[#00D2FF] to-cyan-300 transition-all duration-75"
                style={{
                  width: `${(currentTime / activeModule.duration) * 100}%`
                }}
              />

              {/* Divisórias Visuais de Cena */}
              {activeModule.scenes.map((sc, idx) => (
                <div
                  key={sc.id}
                  className="absolute top-0 bottom-0 w-[1px] bg-slate-700/80 pointer-events-none"
                  style={{
                    left: `${(sc.startTime / activeModule.duration) * 100}%`
                  }}
                  title={sc.name}
                />
              ))}
            </div>

            {/* Cabeça de Reprodução (Playhead) */}
            <div
              className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-[#0055FF] pointer-events-none -ml-1.5 transition-transform"
              style={{
                left: `${(currentTime / activeModule.duration) * 100}%`
              }}
            />
          </div>

          {/* Linha de Controles Inferiores: Play, Rewind, Speed, Timecode */}
          <div className="flex items-center justify-between gap-4 pt-1">
            {/* Esquerda: Botões de Navegação */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-300 hover:text-white transition-colors"
                title="Voltar ao início (00:00)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="px-4 py-1.5 rounded-lg bg-[#0055FF] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Reproduzir Motion</span>
                  </>
                )}
              </button>

              {/* Pular para Próxima/Anterior Cena */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const prevScene = [...activeModule.scenes]
                      .reverse()
                      .find((s) => s.startTime < currentTime - 0.5);
                    if (prevScene) seekTo(prevScene.startTime);
                    else seekTo(0);
                  }}
                  className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-400 hover:text-slate-200 transition-colors"
                  title="Cena Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextScene = activeModule.scenes.find(
                      (s) => s.startTime > currentTime + 0.1
                    );
                    if (nextScene) seekTo(nextScene.startTime);
                  }}
                  className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-400 hover:text-slate-200 transition-colors"
                  title="Próxima Cena"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Timecode Digital */}
              <div className="px-2.5 py-1 rounded-md bg-[#050814] border border-[#1E293B] text-xs font-mono text-slate-300">
                <span className="text-[#00D2FF] font-semibold">{formatTime(currentTime)}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span>{formatTime(activeModule.duration)}</span>
              </div>
            </div>

            {/* Centro: Nome da Cena Ativa */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-slate-500">Cena Ativa:</span>
              <span className="font-semibold text-slate-200">{currentScene.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                {currentScene.badge}
              </span>
            </div>

            {/* Direita: Velocidade de Reprodução & Mute */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#050814] rounded-lg border border-[#1E293B] p-0.5 text-xs font-mono">
                {[1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded transition-all ${
                      playbackSpeed === spd
                        ? "bg-[#0055FF] text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {audioUrl && (
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-400 hover:text-slate-200 transition-colors"
                  title={isMuted ? "Desmutar Locução" : "Mutar Locução"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE DIRETOR DO MÓDULO 1: RADAR DE STORIES DO WHATSAPP (35s)
// ============================================================================
function RadarStoriesSceneDirector({
  scene,
  currentTime,
  aspectRatio
}: {
  scene: MotionScene;
  currentTime: number;
  aspectRatio: "vertical" | "horizontal";
}) {
  const isVertical = aspectRatio === "vertical";

  // CENA 1: Abertura Cinética & Revelação do Logo (0s - 5s)
  if (scene.id === 1) {
    return (
      <motion.div
        key="radar-scene-1"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full flex flex-col items-center justify-center text-center px-4 relative"
      >
        {/* Glow de fundo */}
        <div className="absolute w-48 h-48 bg-[#0055FF]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo Oficial VALLOR Animado */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-8 flex items-center justify-center"
        >
          <img
            src="/vallor/Logo_valor_02.svg"
            alt="VALLOR"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,85,255,0.4)]"
          />
        </motion.div>

        {/* Tipografia Cinética em 2 Fases */}
        <div className="flex flex-col gap-3 max-w-sm sm:max-w-md">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-base sm:text-lg font-light text-slate-300"
          >
            Seus clientes assistem seus <span className="font-semibold text-white">Stories</span> todos os dias...
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[#00D2FF] to-white leading-tight"
          >
            ...mas você sabe quem está pronto para comprar?
          </motion.h2>
        </div>

        {/* Tag de Tecnologia Subjacente */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.8 }}
          className="mt-8 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400"
        >
          <Radio className="w-3.5 h-3.5 text-[#00D2FF] animate-pulse" />
          <span>VALLOR RADAR • INTELIGÊNCIA PREDITIVA</span>
        </motion.div>
      </motion.div>
    );
  }

  // CENA 2: Painel Radar de Stories em Perspectiva 3D com Contadores (5s - 12s)
  if (scene.id === 2) {
    // Progresso local da cena (0 a 1) para subir contadores
    const sceneProgress = Math.min(1, Math.max(0, (currentTime - 5) / 5));
    const viewsCount = Math.floor(sceneProgress * 1428);
    const hotLeadsCount = Math.floor(sceneProgress * 342);
    const chatsCount = Math.floor(sceneProgress * 89);

    return (
      <motion.div
        key="radar-scene-2"
        initial={{ opacity: 0, rotateX: 16, y: 30 }}
        animate={{ opacity: 1, rotateX: 6, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full flex flex-col justify-center gap-3 sm:gap-4 px-2"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Cabeçalho Real do Painel */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#0055FF]/10 text-[#00D2FF]">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Radar de Stories</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  AO VIVO
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">WhatsApp Status Telemetry</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Hoje, 10:45</span>
        </div>

        {/* Grid de KPIs Reais com Contadores Animados */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col gap-1">
            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <Eye className="w-3 h-3 text-blue-400" />
              Views
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-100">
              {viewsCount.toLocaleString("pt-BR")}
            </span>
            <span className="text-[9px] text-emerald-400">+38% vs ontem</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col gap-1 ring-1 ring-[#0055FF]/40">
            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Leads Quentes
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-[#00D2FF]">
              {hotLeadsCount}
            </span>
            <span className="text-[9px] text-emerald-400">Score &gt; 80%</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col gap-1">
            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-emerald-400" />
              Iniciadas
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-100">
              {chatsCount}
            </span>
            <span className="text-[9px] text-slate-400">78% taxa resp.</span>
          </div>
        </div>

        {/* Prévia da Lista de Visualizadores */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Visualizações Recentes de Status</span>
            <span className="text-[10px] text-[#00D2FF] font-mono">3 novos agora</span>
          </div>

          <div className="space-y-1.5">
            <div className="p-2 rounded-lg bg-[#0B1224] border border-[#1E293B] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600/20 text-[#00D2FF] flex items-center justify-center font-bold text-xs">
                  CE
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Carlos Eduardo Silveira</p>
                  <p className="text-[10px] text-slate-400">Agropecuária Santa Maria</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Score 95%
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#0B1224]/60 border border-[#1E293B] flex items-center justify-between text-xs opacity-60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                  MA
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Marcos Aurélio</p>
                  <p className="text-[10px] text-slate-400">Grupo Terra Forte</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Score 72%</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // CENA 3: Close-up 3D no Card do Lead Quente + Barra de Intenção subindo a 95% (12s - 20s)
  if (scene.id === 3) {
    const scoreProgress = Math.min(1, Math.max(0, (currentTime - 12) / 4));
    const scoreVal = Math.floor(scoreProgress * 95);

    return (
      <motion.div
        key="radar-scene-3"
        initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full flex flex-col justify-center items-center px-3 relative"
      >
        {/* Elementos de Fundo com Blur (Profundidade de Campo) */}
        <div className="absolute inset-0 flex flex-col justify-around opacity-25 filter blur-sm pointer-events-none p-4">
          <div className="h-10 bg-slate-800 rounded-lg w-full" />
          <div className="h-10 bg-slate-800 rounded-lg w-full" />
          <div className="h-10 bg-slate-800 rounded-lg w-full" />
        </div>

        {/* Card Principal em Zoom Frontal 3D */}
        <div
          className="relative w-full max-w-sm rounded-2xl bg-[#0B1224] border-2 border-[#0055FF]/60 p-4 shadow-2xl z-10 flex flex-col gap-3"
          style={{
            boxShadow: "0 20px 40px -10px rgba(0, 85, 255, 0.3)"
          }}
        >
          {/* Header do Card */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0055FF] to-[#00D2FF] text-white font-bold flex items-center justify-center text-sm shadow-md">
                CE
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Carlos Eduardo Silveira</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  Agropecuária Fazenda Santa Maria
                </p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  Ribeirão Preto • SP
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Alta Intenção
            </span>
          </div>

          {/* Dados da Visualização */}
          <div className="p-2.5 rounded-lg bg-[#050814] border border-[#1E293B] flex items-center justify-between text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#00D2FF]" />
              <span>Visualizou há 4 minutos</span>
            </div>
            <span className="text-[10px] text-slate-400">Story: Colheitadeira X9</span>
          </div>

          {/* Termômetro de Score de Intenção */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Score de Propensão de Compra</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {scoreVal}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-[#00D2FF] to-emerald-400 rounded-full"
                style={{ width: `${scoreVal}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Baseado em: 3 views nos últimos 7 dias + busca no catálogo + limite de crédito pré-aprovado.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // CENA 4: Cursor Clica no Botão "Iniciar Conversa" & Match Cut para o Inbox (20s - 28s)
  if (scene.id === 4) {
    // Transição de clique aos 23 segundos (3s após o início da cena 4)
    const isClicked = currentTime >= 22.5;

    return (
      <motion.div
        key="radar-scene-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full flex flex-col justify-center items-center px-2 relative overflow-hidden"
      >
        {!isClicked ? (
          // Vista do Botão com Cursor Animado
          <div className="w-full max-w-sm rounded-xl bg-[#0B1224] border border-[#1E293B] p-4 flex flex-col gap-4 relative">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Ação Comercial Imediata</span>
              <span className="text-[10px] text-emerald-400 font-mono">Timing Ideal: Agora</span>
            </div>

            <div className="p-3 rounded-lg bg-[#050814] border border-[#1E293B] text-xs text-slate-300">
              <p className="font-semibold text-slate-100 mb-1">Lead: Carlos Eduardo</p>
              <p className="text-[11px] text-slate-400">
                A IA da VALLOR já redigiu um gancho consultivo baseado no story visualizado.
              </p>
            </div>

            {/* Botão Oficial "Iniciar Conversa" */}
            <div className="relative">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0055FF] to-[#00D2FF] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 relative overflow-hidden"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Iniciar Conversa no WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Cursor Vetorial Voando até o Botão e Clicando */}
              <motion.div
                initial={{ x: 80, y: 80, opacity: 0 }}
                animate={{ x: 20, y: -5, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-12 top-2 pointer-events-none z-30"
              >
                <MousePointer className="w-6 h-6 text-white fill-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
              </motion.div>
            </div>
          </div>
        ) : (
          // Match Cut Contínuo: layout real do Inbox WhatsApp da VALLOR
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full max-h-[560px] rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col justify-between overflow-hidden shadow-2xl"
          >
            {/* Header do Chat Real */}
            <div className="p-3 bg-[#050814] border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  CE
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Carlos Eduardo Silveira</h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Online via WhatsApp
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/20 text-[#00D2FF] border border-blue-500/30">
                Origem: Radar de Stories
              </span>
            </div>

            {/* Balões de Mensagem */}
            <div className="p-3 flex-1 flex flex-col justify-end gap-2.5 text-xs">
              {/* Mensagem enviada pelo consultor com sugestão contextual da IA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="self-end max-w-[85%] rounded-2xl rounded-tr-none bg-[#0055FF] text-white p-3 shadow-md"
              >
                <p className="leading-relaxed">
                  Olá Carlos, tudo bem? Vi que você conferiu o nosso story da Colheitadeira X9. Temos uma condição de taxa subsidiada exclusiva para a sua região até amanhã!
                </p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-blue-200">
                  <span>10:46</span>
                  <Check className="w-3 h-3 text-cyan-300" />
                </div>
              </motion.div>

              {/* Resposta imediata do cliente */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="self-start max-w-[85%] rounded-2xl rounded-tl-none bg-[#1E293B] text-slate-100 p-3 shadow-md border border-slate-700"
              >
                <p className="leading-relaxed">
                  Bom dia! Estava de olho nela mesmo. Consegue me mandar a simulação das parcelas semestrais?
                </p>
                <span className="text-[9px] text-slate-400 block text-right mt-1">10:47</span>
              </motion.div>
            </div>

            {/* Input Composer */}
            <div className="p-2.5 bg-[#050814] border-t border-[#1E293B] flex items-center gap-2">
              <div className="flex-1 px-3 py-1.5 rounded-lg bg-[#0B1224] border border-[#1E293B] text-xs text-slate-400">
                Digite uma mensagem...
              </div>
              <button
                type="button"
                className="p-2 rounded-lg bg-[#0055FF] text-white"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // CENA 5: Fechamento Cinético & CTA (28s - 35s)
  if (scene.id === 5) {
    return (
      <motion.div
        key="radar-scene-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full flex flex-col items-center justify-center text-center px-4 relative"
      >
        <div className="absolute w-56 h-56 bg-[#0055FF]/20 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-2 max-w-sm"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#00D2FF]">
            Resultados Comprovados
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight">
            Transforme visualizações silenciosas{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00D2FF]">
              em vendas fechadas.
            </span>
          </h2>
        </motion.div>

        {/* Botão de Ação CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mt-6"
        >
          <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0055FF] to-[#00D2FF] text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-900/50 flex items-center gap-2">
            <span>Conheça o VALLOR Radar</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>

        {/* Assinatura Oficial VALLOR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-8 flex flex-col items-center gap-1"
        >
          <img
            src="/vallor/Logo_valor_02.svg"
            alt="VALLOR"
            className="h-8 w-auto object-contain opacity-90"
          />
          <span className="text-[10px] text-slate-500 font-mono tracking-wider">
            O CRM INTELIGENTE PARA VENDAS CONSULTIVAS
          </span>
        </motion.div>
      </motion.div>
    );
  }

  return null;
}

// ============================================================================
// COMPONENTE DIRETOR DO MÓDULO 2: TOUR COMPLETO VALLOR (60s)
// ============================================================================
function FullTourSceneDirector({
  scene,
  currentTime,
  aspectRatio
}: {
  scene: MotionScene;
  currentTime: number;
  aspectRatio: "vertical" | "horizontal";
}) {
  // CENA 1: Abertura Institucional VALLOR (0s - 8s)
  if (scene.id === 1) {
    return (
      <motion.div
        key="tour-scene-1"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.7 }}
        className="w-full h-full flex flex-col items-center justify-center text-center px-4 relative"
      >
        <div className="absolute w-64 h-64 bg-[#0055FF]/15 rounded-full blur-3xl pointer-events-none" />

        <img
          src="/vallor/Logo_valor_02.svg"
          alt="VALLOR"
          className="h-12 sm:h-14 w-auto object-contain mb-6 drop-shadow-[0_4px_25px_rgba(0,85,255,0.4)]"
        />

        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white max-w-md leading-tight">
          A Plataforma Definitiva de{" "}
          <span className="text-[#00D2FF]">Vendas & Atendimento</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-sm">
          CRM Kanban • WhatsApp Omnichannel • IA Preditiva • Mapa Tático
        </p>

        <div className="mt-6 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>TOUR DO SISTEMA • 2026</span>
        </div>
      </motion.div>
    );
  }

  // CENA 2: Central de Atendimento, Transbordo IA & VersusAudioPlayer (8s - 18s)
  if (scene.id === 2) {
    return (
      <motion.div
        key="tour-scene-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
        className="w-full h-full flex flex-col justify-center gap-3 px-2"
      >
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#00D2FF]" />
            <h3 className="text-sm font-bold text-slate-100">Central de Atendimento</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600/20 text-[#00D2FF] border border-blue-500/30">
            Copiloto IA Ativo
          </span>
        </div>

        {/* Simulação do Player de Áudio com Transcrição */}
        <div className="p-3 rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Áudio do Cliente (WhatsApp)</span>
            <span className="font-mono text-slate-500 text-[10px]">00:32</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#050814] border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#0055FF] text-white">
              <Play className="w-3 h-3 fill-white" />
            </div>
            {/* Ondas sonoras animadas */}
            <div className="flex-1 flex items-center gap-1 h-5">
              {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 30, 75, 40, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#00D2FF] rounded-full"
                  style={{ height: `${h}%`, opacity: (i % 2 === 0 ? 0.9 : 0.6) }}
                />
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-300 italic border-l-2 border-[#0055FF] pl-2 mt-1">
            &ldquo;Transcrição IA: Gostaria de fechar o contrato com vocês para entrega em dezembro.&rdquo;
          </p>
        </div>

        {/* Nota Interna Amarela Colaborativa */}
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-amber-300 text-[11px]">Nota Interna da Equipe:</span>
            <span>Cliente prioritário. Diretor comercial já aprovou desconto de 4%.</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // CENA 3: CRM Kanban com Pipeline e Arraste de Oportunidade (18s - 28s)
  if (scene.id === 3) {
    return (
      <motion.div
        key="tour-scene-3"
        initial={{ opacity: 0, rotateX: 12 }}
        animate={{ opacity: 1, rotateX: 4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full h-full flex flex-col justify-center gap-3 px-2"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
          <div className="flex items-center gap-2">
            <Kanban className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">CRM Kanban • Pipeline Ativo</h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400">
            R$ 4.820.000,00
          </span>
        </div>

        {/* 3 Colunas Reduzidas para Visualização Elegante */}
        <div className="grid grid-cols-3 gap-2">
          {/* Coluna 1: Qualificação */}
          <div className="p-2 rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span>Qualificação</span>
              <span className="font-mono text-slate-500">2</span>
            </div>
            <div className="p-2 rounded-lg bg-[#050814] border border-slate-800 text-[10px] flex flex-col gap-1">
              <span className="font-bold text-slate-200">Fazenda Primavera</span>
              <span className="font-mono text-emerald-400">R$ 350.000</span>
            </div>
          </div>

          {/* Coluna 2: Proposta */}
          <div className="p-2 rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col gap-2 ring-1 ring-blue-500/40">
            <div className="flex items-center justify-between text-[10px] font-semibold text-[#00D2FF]">
              <span>Proposta</span>
              <span className="font-mono">1</span>
            </div>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/40 text-[10px] flex flex-col gap-1 shadow-md"
            >
              <span className="font-bold text-slate-100">Grupo AgroVale</span>
              <span className="font-mono text-emerald-400 font-bold">R$ 1.200.000</span>
            </motion.div>
          </div>

          {/* Coluna 3: Fechado Ganho */}
          <div className="p-2 rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-400">
              <span>Fechado Ganho</span>
              <span className="font-mono text-emerald-400">8</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[10px] flex flex-col gap-1">
              <span className="font-bold text-slate-200">Usina Boa Vista</span>
              <span className="font-mono text-emerald-400 font-bold">R$ 850.000</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // CENA 4: Radar de Stories (28s - 38s)
  if (scene.id === 4) {
    return (
      <motion.div
        key="tour-scene-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full h-full flex flex-col justify-center items-center px-3"
      >
        <div className="w-full max-w-sm p-4 rounded-2xl bg-[#0B1224] border border-[#0055FF]/40 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#00D2FF] animate-pulse" />
              <h4 className="text-xs font-bold text-slate-100">Radar de Stories</h4>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Status Detectado</span>
          </div>

          <div className="p-3 rounded-lg bg-[#050814] border border-[#1E293B] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">Carlos Eduardo</p>
              <p className="text-[10px] text-slate-400">Score de Intenção: 95%</p>
            </div>
            <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
              QUENTE
            </span>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Abordagem em menos de 5 minutos aumenta as chances de conversão em 8x.
          </p>
        </div>
      </motion.div>
    );
  }

  // CENA 5: Mapa Tático IBGE (38s - 48s)
  if (scene.id === 5) {
    return (
      <motion.div
        key="tour-scene-5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full h-full flex flex-col justify-center gap-3 px-2"
      >
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-[#00D2FF]" />
            <h3 className="text-sm font-bold text-slate-100">Mapa Tático & Geo-Inteligência</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Malha IBGE Integrada</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">Ribeirão Preto & Região</span>
            <span className="text-[11px] font-mono text-emerald-400">142 Clientes Ativos</span>
          </div>

          {/* Barra de Densidade Territorial */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Penetração de Mercado</span>
              <span>68% de Market Share</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="w-[68%] h-full bg-[#0055FF] rounded-full" />
            </div>
          </div>

          <div className="p-2 rounded-lg bg-[#050814] border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Potencial da Microrregião:</span>
            <span className="font-mono font-bold text-[#00D2FF]">R$ 18.500.000</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // CENA 6: Metas & Run Rate em Tempo Real (48s - 55s)
  if (scene.id === 6) {
    return (
      <motion.div
        key="tour-scene-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full h-full flex flex-col justify-center gap-3 px-2"
      >
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Termômetro de Run Rate</h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400">104% Projetado</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1224] border border-[#1E293B] flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-white">R$ 5.210.000</span>
            <span className="text-xs text-slate-400">Meta: R$ 5.000.000</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-[#0055FF] to-emerald-400 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-center">
            <div className="p-2 rounded bg-[#050814] border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block">Top Closer</span>
              <span className="text-xs font-bold text-slate-200">Felipe Costa</span>
            </div>
            <div className="p-2 rounded bg-[#050814] border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block">Dias Restantes</span>
              <span className="text-xs font-mono font-bold text-[#00D2FF]">4 dias úteis</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // CENA 7: Fechamento Institucional VALLOR (55s - 60s)
  if (scene.id === 7) {
    return (
      <motion.div
        key="tour-scene-7"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full h-full flex flex-col items-center justify-center text-center px-4 relative"
      >
        <div className="absolute w-56 h-56 bg-[#0055FF]/20 rounded-full blur-3xl pointer-events-none" />

        <img
          src="/vallor/Logo_valor_02.svg"
          alt="VALLOR"
          className="h-10 sm:h-12 w-auto object-contain mb-6 drop-shadow-[0_4px_20px_rgba(0,85,255,0.4)]"
        />

        <h2 className="text-lg sm:text-2xl font-bold text-slate-100 max-w-sm leading-tight">
          Pronto para escalar as vendas da sua operação?
        </h2>

        <div className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0055FF] to-[#00D2FF] text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-900/40">
          Agende sua Demonstração Exclusiva
        </div>

        <p className="text-[10px] font-mono text-slate-500 mt-6 tracking-widest uppercase">
          VALLOR • O CRM INTELIGENTE
        </p>
      </motion.div>
    );
  }

  return null;
}

// ============================================================================
// COMPONENTE PREVIEW DOS DEMAIS MÓDULOS EM PREPARAÇÃO
// ============================================================================
function UpcomingModuleSceneDirector({ module }: { module: MotionModule }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full flex flex-col items-center justify-center text-center p-6"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#0055FF]/10 border border-[#0055FF]/30 flex items-center justify-center text-[#00D2FF] mb-4">
        <Film className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-bold text-slate-100">{module.title}</h3>
      <p className="text-xs text-slate-400 max-w-xs mt-2">{module.description}</p>

      <div className="mt-6 p-3 rounded-xl bg-[#0B1224] border border-[#1E293B] text-xs font-mono text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        <span>Roteiro Oficial Vinculado à rota {module.routeRef}</span>
      </div>
    </motion.div>
  );
}

