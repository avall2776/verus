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
  BadgeAlert
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
  storyMedia: {
    id: string;
    title: string;
    category: "Maquinários" | "Insumos" | "Cotações" | "Peças & Serviços";
    viewedAt: string;
    viewsCountWeek: number;
    interestLevel: "Alta Frequência" | "Frequência Moderada" | "Visualização Recente";
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
  }, []);

  useEffect(() => {
    fetchViewers();
  }, [selectedStatus, selectedCategory, searchQuery]);

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
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                Radar de Stories & Status
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rastreamento e inteligência comercial sobre visualizadores silenciosos de WhatsApp e Instagram para o Agronegócio.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchMetrics();
              fetchViewers();
              toast.success("Dados do Radar atualizados.");
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
      {/* 2. KPIS EXECUTIVOS                                                      */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Visualizações Hoje */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visualizações Silenciosas (Hoje)
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
              {metrics?.kpis.totalViewsWeek || 0} visualizações na semana
            </div>
          </div>
        </div>

        {/* Card 2: Produtores Rastreados */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Produtores Rastreados
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics?.kpis.producersTracked || 0}
            </div>
            <div className="text-xs text-emerald-500 font-semibold mt-0.5">
              Contatos com telefone e praça identificados
            </div>
          </div>
        </div>

        {/* Card 3: Inativos Reaquecidos */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inativos Reaquecidos (+30d)
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
              Antigos compradores de olho no catálogo
            </div>
          </div>
        </div>

        {/* Card 4: Oportunidades Quentes */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Taxa de Conversão por Status
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics?.kpis.conversionRatePercent || 0}%
            </div>
            <div className="text-xs text-purple-400 font-semibold mt-0.5">
              {metrics?.kpis.hotOpportunities || 0} negócios em aquecimento
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
                Segmentação diária por categoria técnica de produto exibido.
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
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
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
              Quais temas retêm maior tempo de tela dos compradores.
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
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 mt-6 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-blue-500 block mb-1">Diretriz da Inteligência Comercial:</span>
            Produtores do Centro-Oeste e Sul apresentam 64% mais interesse em insumos técnicos durante a manhã.
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 4. FEED DE VISUALIZADORES SILENCIOSOS (CRM & PROSPECÇÃO)                */}
      {/* ======================================================================= */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Produtores Rastreados por Visualização de Status</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cruze dados de quem está acompanhando sua marca e acione abordagens casuais geradas por IA.
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
                placeholder="Buscar produtor, fazenda ou cidade..."
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
              <option value="inactive_client">Inativos (+30d)</option>
              <option value="open_deal">Cotações em Aberto</option>
              <option value="prospect">Novos Prospects</option>
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
            </select>
          </div>
        </div>

        {/* Tabela Executiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Produtor / Propriedade</th>
                <th className="py-3 px-3">Praça / Região</th>
                <th className="py-3 px-3">Status Visualizado</th>
                <th className="py-3 px-3">Posição no CRM</th>
                <th className="py-3 px-3">Frequência</th>
                <th className="py-3 px-3 text-right">Ação de Prospecção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loadingViewers ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Carregando visualizadores de status da agenda...</span>
                  </td>
                </tr>
              ) : viewers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum produtor encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                viewers.map((viewer) => (
                  <tr key={viewer.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Produtor / Propriedade */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white leading-tight">
                        {viewer.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{viewer.companyOrFarm}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {viewer.phone}
                      </div>
                    </td>

                    {/* Praça / Região */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium">
                        <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{viewer.city} - {viewer.state}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Resp: {viewer.assignedSeller}
                      </div>
                    </td>

                    {/* Status Visualizado */}
                    <td className="py-3 px-3 max-w-[260px]">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {viewer.storyMedia.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {viewer.storyMedia.category}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {viewer.storyMedia.viewedAt}
                        </span>
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
                      {viewer.totalPurchased > 0 && (
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Histórico: {formatCurrency(viewer.totalPurchased)}
                        </div>
                      )}
                    </td>

                    {/* Frequência */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {viewer.storyMedia.viewsCountWeek}x na semana
                      </div>
                      <div className="text-[10px] font-medium text-blue-500 mt-0.5">
                        {viewer.storyMedia.interestLevel}
                      </div>
                    </td>

                    {/* Ação */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenAiModal(viewer)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Abordagem IA</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 5. MODAL DE ABORDAGEM CASUAL COM IA (OPENAI REAL)                      */}
      {/* ======================================================================= */}
      {isAiModalOpen && selectedViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[90vh] ${
              theme === "light"
                ? "bg-white border-slate-200 text-slate-900"
                : theme === "whatsapp"
                ? "bg-[#111B21] border-[#2A3942] text-[#E9EDEF]"
                : "bg-[#0B1224] border-slate-800 text-white"
            }`}
          >
            {/* Topo do Modal */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-bold">
                    Abordagem Comercial Estratégica via IA
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gerada sob medida pela OpenAI em cima do perfil de {selectedViewer.name} ({selectedViewer.companyOrFarm}).
                </p>
              </div>

              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Contexto do Lead */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Visualizado</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{selectedViewer.storyMedia.title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Praça / Região</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedViewer.city} - {selectedViewer.state}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Posição no CRM</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedViewer.crmStatusLabel}</span>
                </div>
              </div>

              {/* Mensagem da IA */}
              {isGeneratingAi ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                  <div className="text-sm font-semibold text-slate-300">
                    Consultando histórico no CRM e acionando motor OpenAI...
                  </div>
                  <p className="text-xs text-slate-500">
                    Formulando abordagem casual sem soar invasivo e alinhada ao agronegócio.
                  </p>
                </div>
              ) : generatedApproach ? (
                <div className="space-y-4">
                  {/* Bloco de Mensagem para WhatsApp */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>Sugestão de Mensagem (Pronta para Envio)</span>
                      <button
                        onClick={handleCopyMessage}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedMessage ? "Copiada" : "Copiar Texto"}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#070D1B] border border-slate-300 dark:border-slate-800 text-sm leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-sans">
                      {generatedApproach.casualMessage}
                    </div>
                  </div>

                  {/* Justificativa Estratégica da IA */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-2">
                    <div className="font-bold text-blue-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Raciocínio Comercial da IA:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-normal">
                      {generatedApproach.strategicReasoning}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-blue-500/10 text-[11px] text-slate-500 dark:text-slate-400">
                      <span><b>Timing Recomendado:</b> {generatedApproach.suggestedTiming}</span>
                      <span><b>Foco do Produto:</b> {generatedApproach.suggestedProduct}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#070D1B]/50">
              <button
                onClick={() => handleOpenAiModal(selectedViewer)}
                disabled={isGeneratingAi}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
                <span>Regenerar com IA</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Fechar
                </button>

                <button
                  onClick={handleOpenWhatsApp}
                  disabled={!generatedApproach?.casualMessage}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Abrir Conversa no WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
