"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Radio,
  Eye,
  Sparkles,
  TrendingUp,
  Users,
  Building2,
  MapPin,
  Clock,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  MessageSquare,
  ArrowUpRight,
  Copy,
  Check,
  Activity,
  Layers,
  X,
  Send,
  Loader2,
  FileText,
  BadgeAlert,
  CheckCircle2,
  ShieldCheck,
  PlayCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useSocket } from "@/components/ui/SocketProvider";

interface StoryViewer {
  id: string;
  contactId: string;
  name: string;
  companyOrFarm: string;
  phone: string;
  city: string;
  state: string;
  crmStatus: "active_client" | "inactive_client" | "open_deal" | "prospect";
  crmStatusLabel: string;
  totalPurchased: number;
  lastPurchaseDate?: string;
  daysInactive: number;
  assignedSeller: string;
  hasRealView: boolean;
  storyMedia: {
    id: string;
    title: string;
    category: string;
    viewedAt: string;
    exactDate: string;
    exactTime: string;
    viewsCountWeek: number;
    interestLevel: "Alta Frequência" | "Frequência Moderada" | "Visualização Recente" | "Aguardando Visualização";
    thumbnailUrl?: string;
  };
}

interface RadarMetrics {
  kpis: {
    totalViewsToday: number;
    totalViewsWeek: number;
    producersTracked: number;
    inactiveReheated: number;
    hotOpportunities: number;
    conversionRatePercent: number;
  };
  chartData: Array<{
    date: string;
    Maquinarios: number;
    Insumos: number;
    Cotacoes: number;
    Pecas: number;
    total: number;
  }>;
  categoryDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

export default function RadarStoriesPage() {
  const { theme } = useTheme();
  const { socket } = useSocket();

  // Estados principais
  const [metrics, setMetrics] = useState<RadarMetrics | null>(null);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [loadingViewers, setLoadingViewers] = useState<boolean>(true);

  // Filtros
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal de Abordagem IA
  const [selectedViewer, setSelectedViewer] = useState<StoryViewer | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [generatedApproach, setGeneratedApproach] = useState<{
    casualMessage: string;
    strategicReasoning: string;
    suggestedTiming: string;
    suggestedProduct: string;
  } | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // Modal de Teste de Reconhecimento Manual
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [testPhone, setTestPhone] = useState<string>("");
  const [testName, setTestName] = useState<string>("");
  const [testPostTitle, setTestPostTitle] = useState<string>("Demonstração Técnica da Semeadeira Verto Max em Operação");
  const [testCategory, setTestCategory] = useState<string>("Maquinários");
  const [isSubmittingTest, setIsSubmittingTest] = useState<boolean>(false);

  // Carregar dados de métricas
  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await api.get("/crm/radar-stories/metrics");
      setMetrics(res.data);
    } catch (err: any) {
      console.error("Erro ao carregar métricas do Radar de Stories:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Carregar lista de visualizadores
  const fetchViewers = async () => {
    try {
      setLoadingViewers(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await api.get(`/crm/radar-stories/viewers?${params.toString()}`);
      setViewers(res.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar visualizadores do Radar de Stories:", err);
    } finally {
      setLoadingViewers(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchViewers();
  }, []);

  useEffect(() => {
    fetchViewers();
  }, [selectedStatus, selectedCategory, searchQuery]);

  // Escuta WebSocket em tempo real para novos stories e visualizações
  useEffect(() => {
    if (!socket) return;

    const handleStoryView = (data: any) => {
      toast.info(
        `Visualização Detectada: ${data.contactName || data.phone} viu "${data.storyTitle}"`,
        { description: `Data & Horário gravados com precisão no sistema.` }
      );
      fetchMetrics();
      fetchViewers();
    };

    const handleStoryPosted = (data: any) => {
      toast.success(`Novo Story postado no WhatsApp: "${data.title}"`, {
        description: `Categoria identificada: ${data.category}. Monitoramento de visualizações ativado.`,
      });
      fetchMetrics();
      fetchViewers();
    };

    socket.on("radar:story-view", handleStoryView);
    socket.on("radar:story-posted", handleStoryPosted);

    return () => {
      socket.off("radar:story-view", handleStoryView);
      socket.off("radar:story-posted", handleStoryPosted);
    };
  }, [socket]);

  // Disparar geração de abordagem pela OpenAI
  const handleOpenAiModal = async (viewer: StoryViewer) => {
    setSelectedViewer(viewer);
    setIsAiModalOpen(true);
    setGeneratedApproach(null);
    setCopiedMessage(false);

    try {
      setIsGeneratingAi(true);
      const res = await api.post("/crm/radar-stories/approach", {
        contactId: viewer.contactId,
        producerName: viewer.name,
        companyOrFarm: viewer.companyOrFarm,
        city: viewer.city,
        state: viewer.state,
        crmStatus: viewer.crmStatusLabel,
        lastPurchaseInfo: viewer.totalPurchased > 0 ? `Comprou R$ ${viewer.totalPurchased.toLocaleString("pt-BR")} (Última compra há ${viewer.daysInactive} dias)` : "Sem compras confirmadas",
        statusTitle: viewer.storyMedia.title,
        statusCategory: viewer.storyMedia.category,
        viewsCountWeek: viewer.storyMedia.viewsCountWeek,
      });

      if (res.data?.success && res.data?.data) {
        setGeneratedApproach(res.data.data);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao conectar com a OpenAI. Verifique sua chave API.";
      toast.error(msg);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyMessage = () => {
    if (!generatedApproach?.casualMessage) return;
    navigator.clipboard.writeText(generatedApproach.casualMessage);
    setCopiedMessage(true);
    toast.success("Mensagem copiada para a área de transferência.");
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    if (!selectedViewer || !generatedApproach?.casualMessage) return;
    const cleanPhone = selectedViewer.phone.replace(/\D/g, "");
    const encoded = encodeURIComponent(generatedApproach.casualMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
  };

  // Registrar teste de reconhecimento
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error("Informe o telefone para o teste.");
      return;
    }

    try {
      setIsSubmittingTest(true);
      await api.post("/crm/radar-stories/record-view", {
        phone: testPhone,
        contactName: testName.trim() || undefined,
        storyTitle: testPostTitle,
        category: testCategory,
        viewedAt: new Date().toISOString(),
      });

      toast.success("Visualização registrada com sucesso!");
      setIsTestModalOpen(false);
      setTestPhone("");
      setTestName("");
      fetchMetrics();
      fetchViewers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao registrar visualização de teste.");
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* ======================================================================= */}
      {/* 1. CABEÇALHO EXECUTIVO                                                  */}
      {/* ======================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                  Radar de Stories & Status
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  WhatsApp Conectado
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rastreamento e inteligência comercial sobre visualizadores silenciosos de WhatsApp para o Agronegócio. Dados 100% auditáveis com rastreio de data, horário e post.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            <PlayCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>Testar Reconhecimento</span>
          </button>

          <button
            onClick={() => {
              fetchMetrics();
              fetchViewers();
              toast.success("Dados do Radar sincronizados com a base em tempo real.");
            }}
            disabled={loadingMetrics || loadingViewers}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics || loadingViewers ? "animate-spin text-blue-500" : ""}`} />
            <span>Sincronizar Visualizações</span>
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. KPIS EXECUTIVOS BASEADOS NO BANCO REAL                              */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Visualizações Hoje */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visualizações Confirmadas (Hoje)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics?.kpis.totalViewsToday || 0}
            </div>
            <div className="text-xs text-blue-500 font-semibold mt-0.5">
              {metrics?.kpis.totalViewsWeek || 0} visualizações nos últimos 7 dias
            </div>
          </div>
        </div>

        {/* Card 2: Contatos Rastreados no Tenant */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Base de Contatos na Linha
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {(metrics?.kpis.producersTracked || 0).toLocaleString("pt-BR")}
            </div>
            <div className="text-xs text-emerald-500 font-semibold mt-0.5">
              Contatos reais com WhatsApp no ecossistema
            </div>
          </div>
        </div>

        {/* Card 3: Inativos Reaquecidos */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interações de Status Recentes
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics?.kpis.inactiveReheated || 0}
            </div>
            <div className="text-xs text-amber-500 font-semibold mt-0.5">
              Clientes que visualizaram status nesta semana
            </div>
          </div>
        </div>

        {/* Card 4: Oportunidades em Aberto no Funil */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Oportunidades no CRM
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics?.kpis.hotOpportunities || 0}
            </div>
            <div className="text-xs text-purple-400 font-semibold mt-0.5">
              Negócios ativos em negociação na carteira
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. GRÁFICO EXECUTIVO DE AUDIÊNCIA DE STORIES POR CATEGORIA              */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Fluxo de Visualizações de Status (Últimos 7 dias)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Segmentação diária baseada em eventos reais do WhatsApp conectado.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Maquinários
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Insumos
              </span>
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Cotações
              </span>
            </div>
          </div>

          <div className="h-[260px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMaq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorIns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "light" ? "#FFFFFF" : "#070D1B",
                    borderColor: theme === "light" ? "#CBD5E1" : "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="Maquinarios" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorMaq)" name="Maquinários" />
                <Area type="monotone" dataKey="Insumos" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIns)" name="Insumos" />
                <Area type="monotone" dataKey="Cotacoes" stroke="#F59E0B" strokeWidth={2} fill="transparent" name="Cotações" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por Categoria */}
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Interesse por Segmento
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribuição percentual de visualizações por categoria técnica.
            </p>

            <div className="space-y-4 mt-6">
              {(metrics?.categoryDistribution || []).map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="text-slate-900 dark:text-white font-bold">{cat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-600" : idx === 2 ? "bg-amber-500" : "bg-purple-500"
                      }`}
                      style={{ width: `${Math.max(cat.percentage, 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 mt-6 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-blue-500 block mb-1">Certeza e Rastreabilidade Total:</span>
            Cada visualizador é associado ao número do WhatsApp, data, hora exata e post no catálogo.
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 4. FEED DE PROSPECTOS E VISUALIZADORES SILENCIOSOS                      */}
      {/* ======================================================================= */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Contatos & Visualizadores Identificados</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Contatos reais com cruzamento de post visualizado, data, horário exato e abordagem comercial com IA.
            </p>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente, telefone, cidade..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 w-56 transition-colors"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">Todos os Status no CRM</option>
              <option value="active_client">Clientes Ativos</option>
              <option value="inactive_client">Oportunidades em Espera</option>
              <option value="open_deal">Cotações / Propostas em Aberto</option>
              <option value="prospect">Novos Contatos / Prospects</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Maquinários">Maquinários</option>
              <option value="Insumos">Insumos</option>
              <option value="Cotações">Cotações</option>
              <option value="Peças & Serviços">Peças & Serviços</option>
              <option value="Geral">Geral</option>
            </select>
          </div>
        </div>

        {/* Tabela Executiva com Rastreabilidade de Data, Horário e Post */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Contato / Carteira</th>
                <th className="py-3 px-3">Post / Story Identificado</th>
                <th className="py-3 px-3">Data da Visualização</th>
                <th className="py-3 px-3">Horário Exato</th>
                <th className="py-3 px-3">Posição no CRM</th>
                <th className="py-3 px-3 text-right">Ação Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loadingViewers ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Carregando contatos reais e visualizações do sistema...</span>
                  </td>
                </tr>
              ) : viewers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum contato encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                viewers.map((viewer) => (
                  <tr key={viewer.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Contato / Carteira */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                        <span>{viewer.name}</span>
                        {viewer.hasRealView && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Visualização confirmada" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{viewer.companyOrFarm}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        +{viewer.phone}
                      </div>
                    </td>

                    {/* Post / Story Identificado */}
                    <td className="py-3 px-3 max-w-[280px]">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {viewer.storyMedia.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {viewer.storyMedia.category}
                        </span>
                        {viewer.hasRealView ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Confirmada
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                            Monitoramento Ativo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Data da Visualização */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-200 font-semibold text-xs">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{viewer.storyMedia.exactDate}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {viewer.storyMedia.viewedAt}
                      </div>
                    </td>

                    {/* Horário Exato */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-200 font-bold text-xs">
                        <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{viewer.storyMedia.exactTime}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Horário de Brasília
                      </div>
                    </td>

                    {/* Posição no CRM */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          viewer.crmStatus === "active_client"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : viewer.crmStatus === "inactive_client"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : viewer.crmStatus === "open_deal"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {viewer.crmStatusLabel}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Resp: {viewer.assignedSeller}
                      </div>
                      {viewer.totalPurchased > 0 && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Faturado: {formatCurrency(viewer.totalPurchased)}
                        </div>
                      )}
                    </td>

                    {/* Ação Comercial */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenAiModal(viewer)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Abordagem IA</span>
                        </button>
                        <button
                          onClick={() => {
                            const cleanPhone = viewer.phone.replace(/\D/g, "");
                            window.open(`https://wa.me/${cleanPhone}`, "_blank");
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Abrir WhatsApp Direto"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 5. MODAL DE ABORDAGEM CASUAL GERADA POR OPENAI REAL                     */}
      {/* ======================================================================= */}
      {isAiModalOpen && selectedViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Abordagem Comercial Casual (OpenAI)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Formulada sob medida para {selectedViewer.name} sem mencionar visualização de status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Modal */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Contexto do Visualizador */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Produtor / Contato:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedViewer.name}</span>
                  <span className="text-[11px] text-slate-400 block font-mono">+{selectedViewer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Post Visualizado:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{selectedViewer.storyMedia.title}</span>
                  <span className="text-[11px] text-blue-500 block">
                    {selectedViewer.storyMedia.exactDate} às {selectedViewer.storyMedia.exactTime}
                  </span>
                </div>
              </div>

              {/* Estado de Carregamento da IA */}
              {isGeneratingAi && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <div className="text-xs font-semibold">
                    Invocando OpenAI com inteligência comercial B2B/Agro...
                  </div>
                  <div className="text-[11px] text-slate-400 max-w-sm text-center">
                    Criando timing de coincidência natural e eliminando clichês de redes sociais.
                  </div>
                </div>
              )}

              {/* Mensagem e Raciocínio Estratégico */}
              {!isGeneratingAi && generatedApproach && (
                <div className="space-y-4">
                  {/* Mensagem Pronta para Envio */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Mensagem Sugerida para WhatsApp:</span>
                      <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tom Consultivo & Sóbrio
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed select-all">
                      {generatedApproach.casualMessage}
                    </div>
                  </div>

                  {/* Raciocínio Estratégico */}
                  <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-blue-500 block">Justificativa Comercial:</span>
                    <p className="text-[11px] leading-relaxed">{generatedApproach.strategicReasoning}</p>
                  </div>

                  {/* Sugestões de Momento e Produto */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Momento Ideal de Envio:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {generatedApproach.suggestedTiming}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Produto em Pauta:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] line-clamp-1">
                        {generatedApproach.suggestedProduct}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/30">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Fechar
              </button>
              {generatedApproach && (
                <>
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMessage ? "Copiado!" : "Copiar Texto"}</span>
                  </button>
                  <button
                    onClick={handleOpenWhatsApp}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar no WhatsApp</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 6. MODAL DE TESTE DE RECONHECIMENTO MANUAL                             */}
      {/* ======================================================================= */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Testar Reconhecimento de Visualização
                </h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTestSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simule a abertura de um status do WhatsApp conectado para auditar o registro exato de data, horário e título do post.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone do Contato (WhatsApp):
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Ex: 5511983354725 ou selecione da base"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Produtor / Cliente (Opcional):
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Ex: Oliver Fontana"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título / Legenda do Post Visualizado:
                </label>
                <input
                  type="text"
                  value={testPostTitle}
                  onChange={(e) => setTestPostTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria Técnica:
                </label>
                <select
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1B] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="Maquinários">Maquinários & Implementos</option>
                  <option value="Insumos">Insumos & Defensivos</option>
                  <option value="Cotações">Cotações de Safra & Grãos</option>
                  <option value="Peças & Serviços">Peças & Serviços</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTest}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                  <span>Registrar Visualização</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
