"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Compass,
  MessageSquare,
  Users,
  Target,
  Kanban,
  FileText,
  ScrollText,
  Activity,
  Smartphone,
  Monitor,
  Wand2,
  RefreshCw,
  Search,
  Bot,
  MousePointer,
  Film,
  Zap,
  DollarSign,
  Mic,
  Music,
  Radio,
  Layers3,
  Sparkle,
  X,
  ShieldCheck,
  Eye,
  Heart,
  Share2,
  Bookmark,
  CheckCircle2,
  Flame,
  ArrowUpRight
} from "lucide-react";

// =========================================================================
// 1. CATÁLOGO OFICIAL VALLOR: NOMENCLATURA E CATEGORIAS REAIS DO SIDEBAR
// =========================================================================

export type SystemCategory =
  | "OPERAÇÃO / ATENDIMENTO"
  | "MARKETING & AGÊNCIA"
  | "CHAT DA EQUIPE"
  | "FUNIL COMERCIAL (CRM)";

export interface MotionScene {
  id: number;
  actTitle: string;
  actBadge: string;
  startTime: number;
  endTime: number;
  // Tipografia Cinética de Alto Impacto (Estilo SysJuros / Gustaf Design)
  kineticPrefix: string;
  kineticHighlight: string;
  kineticSuffix: string;
  kineticSubline: string;
  // Narração Oficial em Português
  voiceNarration: string;
  // Métricas e Elementos Visuais em Movimento
  floatingChip: { label: string; value: string; color: string };
  ctaButtonText?: string;
  cameraPreset: {
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    translateZ: number;
    scale: number;
  };
}

export interface VallorSystemFunction {
  id: string;
  name: string;
  category: SystemCategory;
  route: string;
  badge: string;
  accentColor: string;
  secondaryColor: string;
  whatItDoes: string;
  commercialPitch: string;
  defaultDuration: number;
  scenes: MotionScene[];
}

export const VALLOR_SYSTEM_CATALOG: VallorSystemFunction[] = [
  // -----------------------------------------------------------------------
  // 1. MAPA TÁTICO OPERACIONAL (OPERAÇÃO / ATENDIMENTO)
  // -----------------------------------------------------------------------
  {
    id: "mapa_tatico_operacional",
    name: "Mapa Tático Operacional",
    category: "OPERAÇÃO / ATENDIMENTO",
    route: "/dashboard/mapa",
    badge: "Geo-Inteligência",
    accentColor: "#00D2FF",
    secondaryColor: "#0055FF",
    whatItDoes: "Cruza a carteira de clientes e negócios com a malha territorial e densidade de faturamento por estado e cidade.",
    commercialPitch: "Mapeie a densidade da sua carteira por município e trace rotas comerciais de alto retorno com precisão cirúrgica.",
    defaultDuration: 28,
    scenes: [
      {
        id: 1,
        actTitle: "Onde Estão Seus Clientes?",
        actBadge: "Ato 1: Território",
        startTime: 0,
        endTime: 7,
        kineticPrefix: "ONDE ESTÃO OS SEUS",
        kineticHighlight: "CLIENTES MAIS LUCRATIVOS",
        kineticSuffix: "AGORA?",
        kineticSubline: "Visualização geográfica integrada diretamente à carteira ativa do CRM.",
        voiceNarration: "Onde estão os clientes mais lucrativos da sua empresa agora? Conheça o Mapa Tático Operacional da VALLOR.",
        floatingChip: { label: "Cidades Cobertas", value: "318 Municípios", color: "#00D2FF" },
        ctaButtonText: "Explorar Mapa",
        cameraPreset: { rotateX: 18, rotateY: -14, rotateZ: 1, translateZ: 0, scale: 0.98 }
      },
      {
        id: 2,
        actTitle: "Heatmap Municipal & Densidade Real",
        actBadge: "Ato 2: Heatmap",
        startTime: 7,
        endTime: 14,
        kineticPrefix: "HEATMAP ATIVO COM",
        kineticHighlight: "R$ 14.8 MILHÕES",
        kineticSuffix: "MAPEADOS",
        kineticSubline: "Filtros por microrregião, ticket médio e penetração comercial por estado.",
        voiceNarration: "Na tela real do Mapa Tático, cada município destaca o faturamento acumulado e a densidade de clientes com potencial imediato.",
        floatingChip: { label: "Volume Mapeado", value: "R$ 14.850.000", color: "#10B981" },
        ctaButtonText: "Filtrar por Região",
        cameraPreset: { rotateX: 10, rotateY: -6, rotateZ: 0, translateZ: 30, scale: 1.05 }
      },
      {
        id: 3,
        actTitle: "Rotas Comerciais Inteligentes",
        actBadge: "Ato 3: Otimização",
        startTime: 14,
        endTime: 21,
        kineticPrefix: "ROTAS DE CAMPO",
        kineticHighlight: "+38% DE VISITAS",
        kineticSuffix: "POR SEMANA",
        kineticSubline: "Agrupe reuniões por proximidade e reduza custos de deslocamento.",
        voiceNarration: "Sua equipe externa economiza tempo e combustível ao gerar rotas de visitação agrupadas por densidade geográfica.",
        floatingChip: { label: "Economia de Rota", value: "+38% Visitas", color: "#F59E0B" },
        ctaButtonText: "Traçar Rota Otimizada",
        cameraPreset: { rotateX: 6, rotateY: 8, rotateZ: -1, translateZ: 45, scale: 1.08 }
      },
      {
        id: 4,
        actTitle: "Domínio Territorial Absoluto",
        actBadge: "Ato 4: Escala",
        startTime: 21,
        endTime: 28,
        kineticPrefix: "DOMINE O SEU TERRITÓRIO COM",
        kineticHighlight: "VALLOR OPERACIONAL",
        kineticSuffix: "HOJE",
        kineticSubline: "A inteligência geográfica conectada diretamente ao funil de vendas.",
        voiceNarration: "VALLOR Mapa Tático Operacional: o padrão ouro em geo-inteligência para empresas de alta performance.",
        floatingChip: { label: "Market Share", value: "Líder Regional", color: "#00D2FF" },
        ctaButtonText: "Agendar Demonstração",
        cameraPreset: { rotateX: 14, rotateY: -8, rotateZ: 0, translateZ: 10, scale: 1.0 }
      }
    ]
  },

  // -----------------------------------------------------------------------
  // 2. RADAR DE STORIES (FUNIL COMERCIAL CRM)
  // -----------------------------------------------------------------------
  {
    id: "radar_de_stories",
    name: "Radar de Stories",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/crm/radar-stories",
    badge: "Exclusivo VALLOR",
    accentColor: "#A855F7",
    secondaryColor: "#EC4899",
    whatItDoes: "Monitora automaticamente quem assiste aos Stories de WhatsApp da empresa, calculando score preditivo de compra e acionamento IA.",
    commercialPitch: "Transforme visualizações silenciosas de Stories em vendas imediatas com abordagem consultiva de 1 clique.",
    defaultDuration: 28,
    scenes: [
      {
        id: 1,
        actTitle: "Visualizações Silenciosas de Stories",
        actBadge: "Ato 1: Oportunidade",
        startTime: 0,
        endTime: 7,
        kineticPrefix: "QUEM ASSISTE SEUS STORIES",
        kineticHighlight: "ESTÁ PRONTO PRA COMPRAR",
        kineticSuffix: "E VOCÊ NÃO SABIA",
        kineticSubline: "O VALLOR Radar identifica exatamente quem está pronto para fechar negócio.",
        voiceNarration: "Você sabia que os seus maiores clientes assistem aos seus Stories de WhatsApp todos os dias, mas você não sabe quem deles quer comprar agora?",
        floatingChip: { label: "Audiência Oculta", value: "340 Contatos", color: "#A855F7" },
        ctaButtonText: "Descobrir Leads",
        cameraPreset: { rotateX: 20, rotateY: -16, rotateZ: 2, translateZ: 0, scale: 0.98 }
      },
      {
        id: 2,
        actTitle: "Score Preditivo de Compra ao Vivo",
        actBadge: "Ato 2: Telemetria",
        startTime: 7,
        endTime: 14,
        kineticPrefix: "SCORE PREDITIVO DE",
        kineticHighlight: "98 / 100 DE PROPENSÃO",
        kineticSuffix: "EM TEMPO REAL",
        kineticSubline: "Mapeamento ativo por frequência de visualização e perfil financeiro.",
        voiceNarration: "Esta é a tela real do Radar de Stories da VALLOR. Ele calcula o score preditivo de propensão de compra em tempo real.",
        floatingChip: { label: "Score Preditivo", value: "98 / 100", color: "#10B981" },
        ctaButtonText: "Ver Telemetria",
        cameraPreset: { rotateX: 12, rotateY: -6, rotateZ: 0, translateZ: 35, scale: 1.05 }
      },
      {
        id: 3,
        actTitle: "Abordagem com Copiloto IA de 1 Clique",
        actBadge: "Ato 3: Abordagem",
        startTime: 14,
        endTime: 21,
        kineticPrefix: "ABORDAGEM CONSULTIVA",
        kineticHighlight: "GERADA EM 3 SEGUNDOS",
        kineticSuffix: "NO WHATSAPP",
        kineticSubline: "A inteligência redige o gancho ideal baseado no produto visto no Story.",
        voiceNarration: "Com apenas um clique, o Copiloto de Inteligência Artificial redige uma abordagem contextualizada e envia direto no WhatsApp do cliente.",
        floatingChip: { label: "Envio IA", value: "1 Clique", color: "#00D2FF" },
        ctaButtonText: "Disparar Abordagem IA",
        cameraPreset: { rotateX: 8, rotateY: 10, rotateZ: -1, translateZ: 50, scale: 1.08 }
      },
      {
        id: 4,
        actTitle: "Vendas Fechadas Imediatas",
        actBadge: "Ato 4: Fechamento",
        startTime: 21,
        endTime: 28,
        kineticPrefix: "TRANSFORME STORIES EM",
        kineticHighlight: "VENDAS FECHADAS",
        kineticSuffix: "COM A VALLOR",
        kineticSubline: "Pare de deixar dinheiro na mesa. Ative o Radar de Stories.",
        voiceNarration: "Pare de deixar dinheiro na mesa. Transforme visualizações silenciosas em contratos assinados com o ecossistema VALLOR.",
        floatingChip: { label: "Conversão", value: "+42% Vendas", color: "#A855F7" },
        ctaButtonText: "Ativar Radar de Stories",
        cameraPreset: { rotateX: 14, rotateY: -10, rotateZ: 0, translateZ: 10, scale: 1.0 }
      }
    ]
  },

  // -----------------------------------------------------------------------
  // 3. WHATSAPP (OPERAÇÃO / ATENDIMENTO)
  // -----------------------------------------------------------------------
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "OPERAÇÃO / ATENDIMENTO",
    route: "/inbox",
    badge: "Omnichannel Oficial",
    accentColor: "#22C55E",
    secondaryColor: "#10B981",
    whatItDoes: "Inbox profissional centralizando múltiplos números de WhatsApp, transcrição de áudio via IA, notas amarelas internas e transbordo seguro.",
    commercialPitch: "Atenda centenas de conversas simultâneas sem fila de espera com transcrição de voz instantânea e controle total.",
    defaultDuration: 28,
    scenes: [
      {
        id: 1,
        actTitle: "O Fim do Caos no WhatsApp",
        actBadge: "Ato 1: Centralização",
        startTime: 0,
        endTime: 7,
        kineticPrefix: "SEU WHATSAPP É UM",
        kineticHighlight: "CAOS DE MENSAGENS",
        kineticSuffix: "SEM CONTROLE?",
        kineticSubline: "Unifique todos os números e atendentes em uma única central auditada.",
        voiceNarration: "Quantas vendas a sua empresa perde por demorar para responder clientes no WhatsApp? O Inbox Oficial da VALLOR resolve esse gargalo.",
        floatingChip: { label: "Conversas Hoje", value: "1.840 Chats", color: "#22C55E" },
        ctaButtonText: "Ver Central Unificada",
        cameraPreset: { rotateX: 18, rotateY: -14, rotateZ: 1, translateZ: 0, scale: 0.98 }
      },
      {
        id: 2,
        actTitle: "Transcrição Instantânea de Áudio via IA",
        actBadge: "Ato 2: IA no Áudio",
        startTime: 7,
        endTime: 14,
        kineticPrefix: "ÁUDIOS DE CLIENTES",
        kineticHighlight: "TRANSCRITOS EM TEXTO",
        kineticSuffix: "INSTANTANEAMENTE",
        kineticSubline: "Ouvir em 2x ou ler em texto claro sem perder nenhum detalhe da conversa.",
        voiceNarration: "Veja a tela real do Inbox. O atendente ouve mensagens com ondas aceleradas ou lê o áudio transcrito na hora pela inteligência artificial.",
        floatingChip: { label: "Transcrição IA", value: "Instantânea", color: "#00D2FF" },
        ctaButtonText: "Testar Transcrição",
        cameraPreset: { rotateX: 10, rotateY: -6, rotateZ: 0, translateZ: 35, scale: 1.05 }
      },
      {
        id: 3,
        actTitle: "Notas Internas & Transbordo Seguro",
        actBadge: "Ato 3: Colaboração",
        startTime: 14,
        endTime: 21,
        kineticPrefix: "NOTAS AMARELAS INTERNAS",
        kineticHighlight: "100% INVISÍVEIS",
        kineticSuffix: "AO CLIENTE",
        kineticSubline: "Alinhamento de bastidores entre consultores, supervisores e diretoria.",
        voiceNarration: "A equipe se comunica através de notas internas que o cliente nunca vê, facilitando passagens de bastão e fechamentos rápidos.",
        floatingChip: { label: "Privacidade", value: "100% Blindado", color: "#F59E0B" },
        ctaButtonText: "Ver Notas Internas",
        cameraPreset: { rotateX: 8, rotateY: 10, rotateZ: -1, translateZ: 50, scale: 1.08 }
      },
      {
        id: 4,
        actTitle: "Atendimento de Alta Conversão",
        actBadge: "Ato 4: Conversão",
        startTime: 21,
        endTime: 28,
        kineticPrefix: "MAIS VELOCIDADE, MAIS",
        kineticHighlight: "CONFIANÇA E VENDAS",
        kineticSuffix: "COM A VALLOR",
        kineticSubline: "Eleve o padrão de atendimento e feche contratos em tempo recorde.",
        voiceNarration: "VALLOR WhatsApp: transforme o canal de comunicação mais importante da sua empresa em uma máquina de fechar contratos.",
        floatingChip: { label: "Conversão", value: "+32% Fechamento", color: "#22C55E" },
        ctaButtonText: "Conhecer o WhatsApp",
        cameraPreset: { rotateX: 14, rotateY: -8, rotateZ: 0, translateZ: 10, scale: 1.0 }
      }
    ]
  },

  // -----------------------------------------------------------------------
  // 4. OPORTUNIDADES (FUNIL COMERCIAL CRM)
  // -----------------------------------------------------------------------
  {
    id: "oportunidades",
    name: "Oportunidades",
    category: "FUNIL COMERCIAL (CRM)",
    route: "/crm",
    badge: "Core de Vendas",
    accentColor: "#0055FF",
    secondaryColor: "#00D2FF",
    whatItDoes: "Funil Kanban de vendas com somatória financeira em tempo real, alertas de inatividade e movimentação fluida de propostas.",
    commercialPitch: "Visualize cada milhão em negociação no seu funil comercial com somatória em tempo real e controle total da esteira.",
    defaultDuration: 28,
    scenes: [
      {
        id: 1,
        actTitle: "Quanto Dinheiro Está Parado no Pipeline?",
        actBadge: "Ato 1: Pipeline",
        startTime: 0,
        endTime: 7,
        kineticPrefix: "QUANTO DINHEIRO ESTÁ",
        kineticHighlight: "PARADO NO SEU FUNIL",
        kineticSuffix: "COMERCIAL HOJE?",
        kineticSubline: "Controle visual de cada etapa de negociação do primeiro contato ao fechamento.",
        voiceNarration: "Você tem clareza exata de quantas propostas estão na mesa e qual é o valor total do seu pipeline hoje? Com a tela de Oportunidades da VALLOR, nada fica perdido.",
        floatingChip: { label: "Pipeline Ativo", value: "R$ 6.420.000", color: "#0055FF" },
        ctaButtonText: "Ver Pipeline",
        cameraPreset: { rotateX: 18, rotateY: -14, rotateZ: 1, translateZ: 0, scale: 0.98 }
      },
      {
        id: 2,
        actTitle: "Kanban Oficial com Valores em Tempo Real",
        actBadge: "Ato 2: Somatória",
        startTime: 7,
        endTime: 14,
        kineticPrefix: "COLUNAS COM VALORES",
        kineticHighlight: "CONSOLIDADOS AO VIVO",
        kineticSuffix: "SEM RETRABALHO",
        kineticSubline: "Arraste de cards fluido com recálculo instantâneo do valor da coluna.",
        voiceNarration: "Veja o Kanban de Oportunidades em ação: cada coluna soma o valor total dos contratos e permite arrastar negócios com velocidade extrema.",
        floatingChip: { label: "Propostas Ativas", value: "38 Oportunidades", color: "#10B981" },
        ctaButtonText: "Arrastar Oportunidade",
        cameraPreset: { rotateX: 10, rotateY: -6, rotateZ: 0, translateZ: 35, scale: 1.05 }
      },
      {
        id: 3,
        actTitle: "Alertas de Inatividade de Alto Tíquete",
        actBadge: "Ato 3: Controle",
        startTime: 14,
        endTime: 21,
        kineticPrefix: "NENHUM NEGÓCIO ESFRIA",
        kineticHighlight: "ALERTAS DE INATIVIDADE",
        kineticSuffix: "EM TEMPO REAL",
        kineticSubline: "Identifique na hora negócios parados há mais de 48h e tome a iniciativa.",
        voiceNarration: "Alertas visuais sinalizam quando uma oportunidade precisa de atenção imediata, garantindo que nenhum negócio de alto valor escape.",
        floatingChip: { label: "Alerta de SLA", value: "Prioridade Alta", color: "#EF4444" },
        ctaButtonText: "Acionar Lead",
        cameraPreset: { rotateX: 8, rotateY: 10, rotateZ: -1, translateZ: 50, scale: 1.08 }
      },
      {
        id: 4,
        actTitle: "Metas Batidas com Previsibilidade",
        actBadge: "Ato 4: Fechamento",
        startTime: 21,
        endTime: 28,
        kineticPrefix: "A ESTEIRA DEFINITIVA PARA",
        kineticHighlight: "BATER METAS DE MILHÕES",
        kineticSuffix: "TODOS OS MESES",
        kineticSubline: "VALLOR Oportunidades: o motor comercial das maiores empresas.",
        voiceNarration: "VALLOR Oportunidades: a esteira definitiva para sua equipe comercial bater metas de milhões todos os meses.",
        floatingChip: { label: "Taxa de Fechamento", value: "31.4%", color: "#00D2FF" },
        ctaButtonText: "Acelerar Vendas",
        cameraPreset: { rotateX: 14, rotateY: -8, rotateZ: 0, translateZ: 10, scale: 1.0 }
      }
    ]
  }
];

export const OPENAI_TTS_VOICES = [
  { id: "onyx", name: "Onyx • Masculina Profunda (B2B Executiva)", desc: "Grave e autoritária, ideal para vendas consultivas" },
  { id: "nova", name: "Nova • Feminina Enérgica (Reels & Tech)", desc: "Moderna, veloz e de alto impacto para Reels" },
  { id: "alloy", name: "Alloy • Neutra Corporativa (Equilibrada)", desc: "Padrão claro e corporativo para vídeos institucionais" },
  { id: "echo", name: "Echo • Masculina Calorosa (Consultiva)", desc: "Tom empático e humanizado de consultor comercial" },
  { id: "shimmer", name: "Shimmer • Feminina Clara (Sofisticada)", desc: "Dicção sofisticada e executiva de luxo" },
  { id: "fable", name: "Fable • Expressiva (Storytelling)", desc: "Cadência narrativa com ênfase comercial" }
];

export default function MotionStudioView() {
  const [mounted, setMounted] = useState(false);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("mapa_tatico_operacional");

  // FORMATO DO VÍDEO MOTION:
  // "reels" (Vertical 9:16 para Reels, Stories, TikTok) vs "widescreen" (Horizontal 16:9 para Web, YouTube, Pitch)
  const [videoFormat, setVideoFormat] = useState<"reels" | "widescreen">("reels");
  const [showReelsGuides, setShowReelsGuides] = useState<boolean>(false);

  // Estilo de Câmera 3D
  const [motionStyle, setMotionStyle] = useState<"sysjuros_3d" | "motionloved_studio" | "flat_clean">("sysjuros_3d");

  // Reprodução da Timeline
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false);

  // Narração por Voz Real da OpenAI (Chave OpenAI Oficial)
  const [isVoiceNarrationEnabled, setIsVoiceNarrationEnabled] = useState<boolean>(true);
  const [selectedOpenAiVoice, setSelectedOpenAiVoice] = useState<string>("onyx");
  const [isLoadingOpenAiAudio, setIsLoadingOpenAiAudio] = useState<boolean>(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState<boolean>(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);

  // Painel de IA Diretora de Arte
  const [isAiDirectorOpen, setIsAiDirectorOpen] = useState<boolean>(false);
  const [aiTargetAudience, setAiTargetAudience] = useState<string>("b2b_diretoria");
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>("");
  const [isRegeneratingScript, setIsRegeneratingScript] = useState<boolean>(false);

  // Áudio Sintetizado Web Audio API & Player OpenAI
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthOscillatorRef = useRef<OscillatorNode | null>(null);
  const lastSpokenSceneIdRef = useRef<number | null>(null);
  const openAiAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const openAiAudioCacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);

    return () => {
      if (openAiAudioPlayerRef.current) {
        openAiAudioPlayerRef.current.pause();
      }
      stopAmbientMusic();
    };
  }, []);

  const activeFunction: VallorSystemFunction = useMemo(() => {
    return (
      VALLOR_SYSTEM_CATALOG.find((f) => f.id === selectedFunctionId) ||
      VALLOR_SYSTEM_CATALOG[0]
    );
  }, [selectedFunctionId]);

  const currentScene: MotionScene = useMemo(() => {
    return (
      activeFunction.scenes.find(
        (s) => currentTime >= s.startTime && currentTime < s.endTime
      ) || activeFunction.scenes[activeFunction.scenes.length - 1]
    );
  }, [activeFunction, currentTime]);

  const startAmbientMusic = () => {
    try {
      if (!isMusicEnabled) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(65.41, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      synthOscillatorRef.current = osc;
    } catch (e) {}
  };

  const stopAmbientMusic = () => {
    try {
      if (synthOscillatorRef.current) {
        synthOscillatorRef.current.stop();
        synthOscillatorRef.current.disconnect();
        synthOscillatorRef.current = null;
      }
    } catch (e) {}
  };

  // Executa narração realista via OpenAI TTS usando a chave oficial do sistema
  const speakSceneWithOpenAi = async (text: string) => {
    if (!isVoiceNarrationEnabled) return;

    const cacheKey = `${selectedOpenAiVoice}_${text}_${playbackSpeed}`;

    // Se já estiver em cache, toca imediatamente
    if (openAiAudioCacheRef.current[cacheKey]) {
      const audioUrl = openAiAudioCacheRef.current[cacheKey];
      if (openAiAudioPlayerRef.current) {
        openAiAudioPlayerRef.current.src = audioUrl;
        openAiAudioPlayerRef.current.playbackRate = playbackSpeed;
        openAiAudioPlayerRef.current.play().catch(() => {});
      }
      return;
    }

    try {
      setIsLoadingOpenAiAudio(true);
      const res = await fetch("/vallor/api/motion-studio/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: selectedOpenAiVoice,
          speed: playbackSpeed
        })
      });

      if (!res.ok) {
        throw new Error("Erro na geração de voz OpenAI.");
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      openAiAudioCacheRef.current[cacheKey] = audioUrl;

      if (openAiAudioPlayerRef.current) {
        openAiAudioPlayerRef.current.src = audioUrl;
        openAiAudioPlayerRef.current.playbackRate = playbackSpeed;
        openAiAudioPlayerRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("[OpenAI TTS Error]:", err);
    } finally {
      setIsLoadingOpenAiAudio(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      startAmbientMusic();

      if (lastSpokenSceneIdRef.current !== currentScene.id) {
        lastSpokenSceneIdRef.current = currentScene.id;
        speakSceneWithOpenAi(currentScene.voiceNarration);
      }

      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * playbackSpeed;
          if (next >= activeFunction.defaultDuration) {
            setIsPlaying(false);
            stopAmbientMusic();
            if (openAiAudioPlayerRef.current) {
              openAiAudioPlayerRef.current.pause();
            }
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      stopAmbientMusic();
      if (openAiAudioPlayerRef.current) {
        openAiAudioPlayerRef.current.pause();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, activeFunction.defaultDuration, currentScene.id, selectedOpenAiVoice]);

  useEffect(() => {
    if (isPlaying && lastSpokenSceneIdRef.current !== currentScene.id) {
      lastSpokenSceneIdRef.current = currentScene.id;
      speakSceneWithOpenAi(currentScene.voiceNarration);
    }
  }, [currentScene.id, isPlaying, selectedOpenAiVoice]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleRestart = () => {
    setCurrentTime(0);
    lastSpokenSceneIdRef.current = null;
    if (openAiAudioPlayerRef.current) {
      openAiAudioPlayerRef.current.pause();
      openAiAudioPlayerRef.current.currentTime = 0;
    }
    if (isPlaying) {
      speakSceneWithOpenAi(activeFunction.scenes[0].voiceNarration);
    }
  };

  const seekTo = (time: number) => {
    setCurrentTime(time);
    lastSpokenSceneIdRef.current = null;
    if (openAiAudioPlayerRef.current) {
      openAiAudioPlayerRef.current.pause();
    }
    if (isPlaying) {
      const targetScene = activeFunction.scenes.find(
        (s) => time >= s.startTime && time < s.endTime
      ) || activeFunction.scenes[0];
      speakSceneWithOpenAi(targetScene.voiceNarration);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#02050E] text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Iniciando VALLOR Motion Cinema Studio...</span>
        </div>
      </div>
    );
  }

  // Câmera 3D aplicada ao card central de produto
  const getProductCardTransform = () => {
    const p = currentScene.cameraPreset;
    if (motionStyle === "sysjuros_3d") {
      return `perspective(1200px) rotateX(${p.rotateX}deg) rotateY(${p.rotateY}deg) rotateZ(${p.rotateZ}deg) translateZ(${p.translateZ}px) scale(${p.scale})`;
    } else if (motionStyle === "motionloved_studio") {
      return `perspective(1400px) rotateX(${p.rotateX * 0.7}deg) rotateY(${p.rotateY * 1.3}deg) translateZ(${p.translateZ * 0.5}px) scale(${p.scale * 0.96})`;
    } else {
      return `scale(${p.scale * 0.95})`;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#02050E] text-slate-100 select-none overflow-hidden relative font-sans">
      {/* ============================================================== */}
      {/* 1. BARRA SUPERIOR: SELEÇÃO DA FUNÇÃO & FORMATO DE VÍDEO        */}
      {/* ============================================================== */}
      {!isRecordingMode && (
        <header className="w-full border-b border-[#1E293B] bg-[#0B1224]/95 backdrop-blur px-4 py-2 z-30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#0055FF]/20 border border-[#0055FF]/40 shadow-sm">
              <Film className="w-4 h-4 text-[#00D2FF]" />
              <span className="text-xs font-black tracking-wider text-[#00D2FF] uppercase">
                VALLOR Motion Studio • Gerador de Vídeos
              </span>
            </div>
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SISTEMA REAL CONECTADO</span>
            </div>
          </div>

          {/* SELETOR OFICIAL DE FUNÇÃO DO SISTEMA */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-[#050814] border border-[#1E293B] rounded-lg px-3 py-1.5 shadow-inner">
              <Compass className="w-4 h-4 text-[#00D2FF] shrink-0" />
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">Módulo Real:</span>
              <select
                value={selectedFunctionId}
                onChange={(e) => {
                  setSelectedFunctionId(e.target.value);
                  seekTo(0);
                  setIsPlaying(false);
                }}
                className="bg-transparent text-xs font-bold text-slate-100 outline-none cursor-pointer max-w-[220px] sm:max-w-xs truncate"
              >
                {VALLOR_SYSTEM_CATALOG.map((fn) => (
                  <option key={fn.id} value={fn.id} className="bg-[#050814] text-white py-1">
                    {fn.name} • ({fn.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* SELETOR DO FORMATO DO VÍDEO (REELS 9:16 vs WIDESCREEN WEB 16:9) */}
            <div className="flex items-center bg-[#050814] p-0.5 rounded-lg border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setVideoFormat("reels")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  videoFormat === "reels"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-950/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Formato Reels / Stories / TikTok / Shorts (9:16 Vertical)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Reels 9:16</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoFormat("widescreen")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  videoFormat === "widescreen"
                    ? "bg-[#0055FF] text-white shadow-md shadow-blue-950/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Formato Widescreen Web / YouTube / Landing Page (16:9 Horizontal)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Web 16:9</span>
              </button>
            </div>

            {/* Alternador de Câmera 3D */}
            <div className="flex items-center bg-[#050814] p-0.5 rounded-lg border border-[#1E293B]">
              <button
                type="button"
                onClick={() => setMotionStyle("sysjuros_3d")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  motionStyle === "sysjuros_3d" ? "bg-slate-700 text-white font-bold" : "text-slate-400"
                }`}
                title="3D SysJuros: Perspectiva Flutuante com Ganchos Cinéticos"
              >
                <Layers3 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">SysJuros</span>
              </button>
              <button
                type="button"
                onClick={() => setMotionStyle("motionloved_studio")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  motionStyle === "motionloved_studio" ? "bg-slate-700 text-white font-bold" : "text-slate-400"
                }`}
                title="3D Estúdio: Iluminação Volumétrica e Chão Reflexivo"
              >
                <Sparkle className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline">Estúdio</span>
              </button>
            </div>
          </div>

          {/* Botões de Áudio, Guia de Reels e IA */}
          <div className="flex items-center gap-2">
            {videoFormat === "reels" && (
              <button
                type="button"
                onClick={() => setShowReelsGuides(!showReelsGuides)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showReelsGuides
                    ? "bg-pink-600/20 border-pink-500/50 text-pink-300"
                    : "bg-[#050814] border-slate-800 text-slate-500"
                }`}
                title="Mostrar Área Segura de UI do Instagram/TikTok"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guia Reels</span>
              </button>
            )}

            {/* Seletor de Voz Real OpenAI (Chave Oficial) */}
            <div className="flex items-center gap-1.5 bg-[#050814] border border-emerald-500/30 rounded-lg px-2 py-1">
              <Mic className={`w-3.5 h-3.5 ${isSpeakingNow ? "text-emerald-400 animate-pulse" : "text-emerald-500"}`} />
              <select
                value={selectedOpenAiVoice}
                onChange={(e) => {
                  setSelectedOpenAiVoice(e.target.value);
                  if (isPlaying) {
                    seekTo(currentTime);
                  }
                }}
                className="bg-transparent text-xs font-bold text-emerald-400 outline-none cursor-pointer"
                title="Voz Realista da OpenAI (Chave Oficial do Sistema)"
              >
                {OPENAI_TTS_VOICES.map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#0B1224] text-white">
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !isVoiceNarrationEnabled;
                setIsVoiceNarrationEnabled(next);
                if (!next && openAiAudioPlayerRef.current) {
                  openAiAudioPlayerRef.current.pause();
                } else if (next && isPlaying) {
                  speakSceneWithOpenAi(currentScene.voiceNarration);
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isVoiceNarrationEnabled
                  ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                  : "bg-[#050814] border-slate-800 text-slate-500"
              }`}
              title="Ligar/Desligar Narração de Voz OpenAI"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voz Ativa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !isMusicEnabled;
                setIsMusicEnabled(next);
                if (!next) stopAmbientMusic();
                else if (isPlaying) startAmbientMusic();
              }}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isMusicEnabled ? "bg-blue-600/20 border-blue-500/50 text-blue-300" : "bg-[#050814] border-slate-800 text-slate-500"
              }`}
              title="Trilha Sonora Ambiente Tech"
            >
              <Music className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsAiDirectorOpen(!isAiDirectorOpen)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAiDirectorOpen ? "bg-purple-600 text-white border-purple-500 shadow-md" : "bg-[#050814] border-[#1E293B] text-purple-300"
              }`}
              title="Copiloto de IA Roteirista & Diretora de Arte"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Diretora IA</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRecordingMode(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tela Limpa para Gravação com OBS / Captura de Vídeo"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gravar</span>
            </button>
          </div>
        </header>
      )}

      {/* Player de Áudio Oficial OpenAI TTS */}
      <audio
        ref={openAiAudioPlayerRef}
        onPlay={() => setIsSpeakingNow(true)}
        onEnded={() => setIsSpeakingNow(false)}
        onPause={() => setIsSpeakingNow(false)}
        className="hidden"
      />

      {/* Botão de Escape no Modo Gravação */}
      {isRecordingMode && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRecordingMode(false)}
            className="px-3 py-1.5 rounded-md bg-[#0B1224]/90 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 backdrop-blur shadow-lg hover:text-white cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Sair do Modo Gravação (ESC)</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ÁREA CENTRAL: O VÍDEO MOTION DESIGN (CANVAS REAL DE VÍDEO)  */}
      {/* ============================================================== */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-[#01040A]">
        {/* Glow e Iluminação de Fundo de Estúdio */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-[200px] pointer-events-none transition-colors duration-1000 opacity-25"
          style={{ backgroundColor: activeFunction.accentColor }}
        />

        {/* ============================================================ */}
        {/* O CANVAS DO VÍDEO: 100% LIMPO, SEM MOLDURAS FALSAS DE CELULAR */}
        {/* ============================================================ */}
        <div
          className={`relative transition-all duration-700 flex flex-col justify-between overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.99),0_0_90px_rgba(0,85,255,0.3)] border border-slate-800/80 bg-gradient-to-b from-[#080E1E] via-[#050914] to-[#02050E] ${
            videoFormat === "reels"
              ? "aspect-[9/16] h-[calc(100vh-160px)] max-h-[720px] rounded-3xl"
              : "aspect-video w-full max-w-[940px] max-h-[500px] rounded-2xl"
          }`}
        >
          {/* Malha de Fundo do Vídeo & Partículas Sutis */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

          {/* Chão Reflexivo de Estúdio (Estilo MotionLoved) */}
          {motionStyle === "motionloved_studio" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none opacity-40"
              style={{
                background: `radial-gradient(ellipse at bottom, ${activeFunction.accentColor}60 0%, transparent 70%)`
              }}
            />
          )}

          {/* ========================================================== */}
          {/* A. TOPO DO VÍDEO: TIPOGRAFIA CINÉTICA E GANCHO DE IMPACTO  */}
          {/* ========================================================== */}
          <div className="relative z-30 w-full p-4 sm:p-6 flex flex-col items-center text-center">
            {/* Header da Marca & Indicador de Cena */}
            <div className="flex items-center justify-between w-full mb-2">
              <div className="flex items-center gap-1.5">
                <img src="/vallor/Logo_valor_02.svg" alt="VALLOR" className="h-4.5 w-auto" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  • {activeFunction.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isSpeakingNow && (
                  <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40 font-mono shadow-sm">
                    <Mic className="w-2.5 h-2.5 animate-pulse" />
                    <span>OPENAI {selectedOpenAiVoice.toUpperCase()}</span>
                  </span>
                )}
                <div
                  className="px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: `${activeFunction.accentColor}20`,
                    borderColor: `${activeFunction.accentColor}50`,
                    color: activeFunction.accentColor
                  }}
                >
                  {currentScene.actBadge}
                </div>
              </div>
            </div>

            {/* TIPOGRAFIA CINÉTICA DE ALTO IMPACTO (ESTILO SYSJUROS) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`kinetic-text-${currentScene.id}`}
                initial={{ opacity: 0, y: -15, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center max-w-lg mt-1"
              >
                <h2 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                  <span>{currentScene.kineticPrefix} </span>
                  <span
                    className="px-2 py-0.5 rounded text-black font-black inline-block shadow-lg mx-1"
                    style={{ backgroundColor: activeFunction.accentColor }}
                  >
                    {currentScene.kineticHighlight}
                  </span>
                  <span> {currentScene.kineticSuffix}</span>
                </h2>

                <p className="text-[11px] sm:text-xs text-slate-300 mt-1.5 leading-snug font-medium drop-shadow max-w-sm sm:max-w-md">
                  {currentScene.kineticSubline}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ========================================================== */}
          {/* B. CENTRO DO VÍDEO: O CARD 3D FLUTUANTE DO PRODUTO        */}
          {/* ========================================================== */}
          <div className="relative flex-1 flex items-center justify-center p-4 z-20 overflow-hidden">
            <div
              className="relative w-full max-w-md transition-all duration-700 ease-out"
              style={{
                transform: getProductCardTransform(),
                transformStyle: "preserve-3d"
              }}
            >
              {/* 1. MOTION SCENE: MAPA TÁTICO OPERACIONAL */}
              {activeFunction.id === "mapa_tatico_operacional" && (
                <div className="relative rounded-2xl bg-black/85 border border-cyan-500/40 p-4 shadow-2xl backdrop-blur-md overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Mapa Tático • Densidade Comercial</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      AO VIVO
                    </span>
                  </div>

                  {/* Malha Territorial com Radar */}
                  <div className="h-44 w-full rounded-xl bg-cyan-950/20 border border-cyan-500/30 relative overflow-hidden flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent origin-center"
                    />

                    {/* Pins de Cidades */}
                    {[
                      { top: "35%", left: "45%", city: "São Paulo", val: "R$ 6.2M" },
                      { top: "25%", left: "62%", city: "Belo Horizonte", val: "R$ 3.8M" },
                      { top: "50%", left: "30%", city: "Mato Grosso", val: "R$ 2.9M" }
                    ].map((pin, i) => (
                      <motion.div
                        key={pin.city}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.25, duration: 0.4 }}
                        className="absolute flex items-center gap-1.5"
                        style={{ top: pin.top, left: pin.left }}
                      >
                        <div className="w-3 h-3 rounded-full bg-cyan-400 border-2 border-white shadow-lg animate-bounce" />
                        <div className="bg-black/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white border border-cyan-500/40">
                          {pin.city} • <span className="text-emerald-400">{pin.val}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer do Card com Métricas */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold">Cidades Cobertas</span>
                      <span className="text-xs font-black text-white">318 Municípios</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold">Faturamento Total</span>
                      <span className="text-xs font-black text-emerald-400">R$ 14.850.000</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. MOTION SCENE: RADAR DE STORIES */}
              {activeFunction.id === "radar_de_stories" && (
                <div className="relative rounded-2xl bg-black/85 border border-purple-500/40 p-4 shadow-2xl backdrop-blur-md overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Radar de Stories • Status WhatsApp</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                      SCORE PREDITIVO
                    </span>
                  </div>

                  {/* Círculo de Story & Feed de Visualizadores */}
                  <div className="flex flex-col gap-2.5">
                    {[
                      { name: "Carlos Eduardo Mendes", score: 98, role: "Diretor Comercial • Fazenda Ouro", val: "R$ 480k" },
                      { name: "Mariana Silva Costa", score: 94, role: "CEO • Grupo Agropecuário", val: "R$ 320k" }
                    ].map((lead, i) => (
                      <motion.div
                        key={lead.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.2 }}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30 flex items-center justify-between shadow"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs text-white">
                              {lead.name.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{lead.name}</span>
                            <span className="text-[9px] text-slate-400">{lead.role}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] block">
                            {lead.score}% Score
                          </span>
                          <span className="text-[9px] text-slate-400">{lead.val}</span>
                        </div>
                      </motion.div>
                    ))}

                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/40 text-[10px] text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Copiloto IA: Abordagem consultiva pronta para disparo no WhatsApp</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MOTION SCENE: WHATSAPP */}
              {activeFunction.id === "whatsapp" && (
                <div className="relative rounded-2xl bg-black/85 border border-emerald-500/40 p-4 shadow-2xl backdrop-blur-md overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">WhatsApp Inbox • Multiatendimento</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      TRANSCRIÇÃO IA
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {/* Player de Áudio com Ondas Sonoras */}
                    <div className="p-3 rounded-xl bg-[#0B141A] border border-[#202C33] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow">
                        <Play className="w-4 h-4 fill-white" />
                      </div>
                      <div className="flex-1 flex items-center gap-1 h-5">
                        {[12, 22, 16, 28, 24, 10, 26, 30, 18, 14, 26, 20, 12, 28, 18].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: isSpeakingNow ? [h * 0.4, h, h * 0.5] : h * 0.5 }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                            className="w-1 rounded-full bg-emerald-400"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">1:42</span>
                    </div>

                    {/* Texto Transcrito */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30 text-[11px] text-slate-200 italic leading-relaxed">
                      &ldquo;Olá, nós analisamos a proposta e gostaríamos de fechar o contrato ainda hoje com a sua diretoria...&rdquo;
                    </div>

                    {/* Nota Interna Amarela */}
                    <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[10px] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Nota Interna: Cliente VIP com crédito aprovado para fechamento imediato.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MOTION SCENE: OPORTUNIDADES KANBAN */}
              {activeFunction.id === "oportunidades" && (
                <div className="relative rounded-2xl bg-black/85 border border-blue-500/40 p-4 shadow-2xl backdrop-blur-md overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Kanban className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">Funil Comercial • Oportunidades</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      R$ 6.42M
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { col: "Novos Leads", val: "R$ 1.8M", count: 12 },
                      { col: "Propostas", val: "R$ 3.2M", count: 8 },
                      { col: "Fechamento", val: "R$ 1.4M", count: 4 }
                    ].map((col, i) => (
                      <div key={col.col} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between h-28">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block">{col.col}</span>
                          <span className="text-xs font-black text-emerald-400">{col.val}</span>
                        </div>
                        {i === 1 && (
                          <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                            className="p-1.5 rounded bg-blue-950/60 border border-blue-500/50 text-[9px] text-white font-bold"
                          >
                            Contrato R$ 480k
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CHIP FLUTUANTE DE KPI EM 3D */}
            <AnimatePresence>
              {currentScene.floatingChip && (
                <motion.div
                  key={`chip-${currentScene.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="absolute bottom-4 right-4 z-30 px-3 py-1.5 rounded-xl bg-black/95 border border-slate-700 shadow-2xl flex items-center gap-2"
                >
                  <span className="text-[9px] uppercase font-bold text-slate-400">
                    {currentScene.floatingChip.label}:
                  </span>
                  <span
                    className="text-xs font-black font-mono"
                    style={{ color: currentScene.floatingChip.color }}
                  >
                    {currentScene.floatingChip.value}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================== */}
          {/* C. BASE DO VÍDEO: BOTÃO CTA BRILHANTE & FECHAMENTO COMERCIAL */}
          {/* ========================================================== */}
          <div className="relative z-30 w-full p-4 sm:p-6 flex flex-col items-center justify-center text-center">
            {currentScene.ctaButtonText && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="px-6 py-2.5 rounded-xl text-black font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: activeFunction.accentColor,
                    boxShadow: `0 0 25px ${activeFunction.accentColor}60`
                  }}
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>{currentScene.ctaButtonText}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                  VALLOR.COM.BR • SOFTWARE ENTERPRISE
                </span>
              </motion.div>
            )}
          </div>

          {/* ========================================================== */}
          {/* OVERLAY DE GUIA DO REELS (ÁREA SEGURA DO INSTAGRAM/TIKTOK) */}
          {/* ========================================================== */}
          {videoFormat === "reels" && showReelsGuides && (
            <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-4">
              {/* Topo do Reels */}
              <div className="flex items-center justify-between text-[10px] text-white/50 border-b border-white/20 pb-1">
                <span>Área Segura do Topo (Reels)</span>
                <span>Áudio Original</span>
              </div>

              {/* Botões Laterais do Instagram (Curtir, Comentar, Compartilhar) */}
              <div className="self-end flex flex-col items-center gap-3 mr-1 text-white/60">
                <div className="flex flex-col items-center gap-0.5">
                  <Heart className="w-5 h-5" />
                  <span className="text-[8px]">14.2k</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-[8px]">842</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <Share2 className="w-5 h-5" />
                  <span className="text-[8px]">Compartilhar</span>
                </div>
                <Bookmark className="w-5 h-5" />
              </div>

              {/* Base do Reels (Legenda) */}
              <div className="w-full text-[9px] text-white/50 border-t border-white/20 pt-1">
                <span>Área Segura da Legenda e Nome do Perfil (@vallor)</span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* PAINEL LATERAL: IA DIRETORA DE ARTE & ROTEIRISTA DO VALLOR     */}
        {/* ============================================================== */}
        {isAiDirectorOpen && !isRecordingMode && (
          <aside className="absolute right-4 top-4 bottom-4 w-80 sm:w-88 bg-[#0B1224]/95 border border-[#1E293B] rounded-2xl shadow-2xl p-4 backdrop-blur-md z-40 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      IA Diretora de Arte VALLOR
                    </h3>
                    <p className="text-[10px] text-slate-400">Roteiro, Narração e Câmera</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiDirectorOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Voz Realista OpenAI (Chave Oficial) */}
              <div className="p-2.5 rounded-xl bg-[#050814] border border-emerald-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <Mic className="w-3 h-3" />
                    Voz Real OpenAI TTS:
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300">
                    {isLoadingOpenAiAudio ? "Gerando Áudio..." : isSpeakingNow ? "Falando Agora" : "Pronta"}
                  </span>
                </div>
                <select
                  value={selectedOpenAiVoice}
                  onChange={(e) => {
                    setSelectedOpenAiVoice(e.target.value);
                    if (isPlaying) {
                      seekTo(currentTime);
                    }
                  }}
                  className="w-full bg-[#0B1224] border border-slate-700 rounded-lg p-2 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {OPENAI_TTS_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 italic">
                  {OPENAI_TTS_VOICES.find((v) => v.id === selectedOpenAiVoice)?.desc}
                </span>
              </div>

              {/* Roteiro Falado da Cena Ativa */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Roteiro Falado • Ato {currentScene.id} / 4:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {currentScene.startTime}s - {currentScene.endTime}s
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-100 font-medium leading-relaxed italic shadow-inner">
                  &ldquo;{currentScene.voiceNarration}&rdquo;
                </div>
              </div>

              {/* Customização de Público Alvo */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Público Alvo do Vídeo:
                </label>
                <select
                  value={aiTargetAudience}
                  onChange={(e) => setAiTargetAudience(e.target.value)}
                  className="w-full bg-[#050814] border border-slate-800 rounded-lg p-2 text-xs font-medium text-slate-200 outline-none cursor-pointer"
                >
                  <option value="b2b_diretoria">Diretores Comerciais & CEOs B2B</option>
                  <option value="agro_fazendas">Produtores & Corretores do Agro</option>
                  <option value="agencias_marketing">Donos de Agências de Marketing</option>
                  <option value="vendedores_campo">Equipes & Vendedores de Campo</option>
                </select>
              </div>

              {/* Prompt de Refinamento */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Ajustar Gancho com IA:
                </label>
                <textarea
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="Ex: Focar na agilidade do WhatsApp para equipes grandes..."
                  rows={2}
                  className="w-full bg-[#050814] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-600 outline-none resize-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsRegeneratingScript(true);
                    setTimeout(() => setIsRegeneratingScript(false), 800);
                  }}
                  disabled={isRegeneratingScript}
                  className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isRegeneratingScript ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>Regerar Roteiro com a IA</span>
                </button>
              </div>
            </div>

            {/* Rodapé do Painel */}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Pitch Central do Produto:
              </span>
              <p className="text-[11px] text-slate-300 leading-snug">
                {activeFunction.commercialPitch}
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. BARRA INFERIOR DE CONTROLE DE VÍDEO (SEMPRE ANCORADA)       */}
      {/* ============================================================== */}
      {!isRecordingMode && (
        <footer className="w-full border-t border-[#1E293B] bg-[#0B1224] px-4 py-2.5 z-40 flex flex-col gap-2 shrink-0">
          {/* Scrubber da Linha do Tempo */}
          <div className="relative w-full flex items-center group">
            <div
              className="relative w-full h-2.5 bg-slate-900 rounded-full cursor-pointer overflow-hidden border border-slate-800"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                seekTo(ratio * activeFunction.defaultDuration);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-[#0055FF] via-[#00D2FF] to-emerald-400 transition-all duration-75"
                style={{
                  width: `${(currentTime / activeFunction.defaultDuration) * 100}%`
                }}
              />
              {activeFunction.scenes.map((sc) => (
                <div
                  key={sc.id}
                  className="absolute top-0 bottom-0 w-[1px] bg-slate-700 pointer-events-none"
                  style={{
                    left: `${(sc.startTime / activeFunction.defaultDuration) * 100}%`
                  }}
                  title={sc.actTitle}
                />
              ))}
            </div>

            <div
              className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-[#0055FF] pointer-events-none -ml-1.5"
              style={{
                left: `${(currentTime / activeFunction.defaultDuration) * 100}%`
              }}
            />
          </div>

          {/* Controles de Play, Scrubber, Pular Cena, Velocidade */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Voltar ao Início"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="px-4 py-1.5 rounded-lg bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/40 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Reproduzir Vídeo</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = [...activeFunction.scenes]
                      .reverse()
                      .find((s) => s.startTime < currentTime - 0.5);
                    seekTo(prev ? prev.startTime : 0);
                  }}
                  className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Ato Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = activeFunction.scenes.find(
                      (s) => s.startTime > currentTime + 0.1
                    );
                    if (next) seekTo(next.startTime);
                  }}
                  className="p-1.5 rounded-lg bg-[#050814] border border-[#1E293B] text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Próximo Ato"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="px-2.5 py-1 rounded-md bg-[#050814] border border-[#1E293B] text-xs font-mono">
                <span className="text-[#00D2FF] font-bold">{formatTime(currentTime)}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-slate-400">{formatTime(activeFunction.defaultDuration)}</span>
              </div>
            </div>

            {/* Centro: Nome do Ato Ativo */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <span className="text-slate-500">Cena Ativa:</span>
              <span className="font-bold text-slate-100">{currentScene.actTitle}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded border font-mono font-bold"
                style={{
                  backgroundColor: `${activeFunction.accentColor}20`,
                  borderColor: `${activeFunction.accentColor}40`,
                  color: activeFunction.accentColor
                }}
              >
                {currentScene.actBadge}
              </span>
            </div>

            {/* Direita: Velocidade de Reprodução */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#050814] rounded-lg border border-[#1E293B] p-0.5 text-xs font-mono">
                {[1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      playbackSpeed === spd
                        ? "bg-[#0055FF] text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
