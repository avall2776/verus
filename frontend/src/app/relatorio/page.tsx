'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  Printer, 
  Share2, 
  RefreshCw, 
  Search, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Cpu, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface PhaseItem {
  text: string;
  checked: boolean;
  subitems: string[];
}

interface Phase {
  id: number;
  title: string;
  rawTitle: string;
  isCompleted: boolean;
  items: PhaseItem[];
}

interface PunchIn {
  timestamp: string;
  date: string;
  time: string;
  type: 'start' | 'pause' | 'resume' | 'end' | 'info';
  icon: string;
  description: string;
}

interface RoadmapItem {
  title: string;
  description: string;
  checked: boolean;
}

interface ChecklistData {
  stats: {
    totalPhases: number;
    completedPhases: number;
    pendingPhases: number;
    totalTasks: number;
    completedTasks: number;
    completionPercent: number;
    currentActivePhaseTitle: string;
    lastPunchIn: PunchIn | null;
    updatedAt: string;
  };
  phases: Phase[];
  punchIns: PunchIn[];
  roadmapItems: RoadmapItem[];
  rawMarkdown: string;
}

export default function RelatorioPage() {
  const [data, setData] = useState<ChecklistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'fases' | 'ponto' | 'roadmap' | 'markdown'>('fases');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPhases, setExpandedPhases] = useState<{ [key: number]: boolean }>({});
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchChecklist = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/checklist?t=' + Date.now());
      if (!res.ok) throw new Error('Falha ao carregar relatório.');
      const json = await res.json();
      setData(json);
      
      // Expande as fases ativas e as últimas 4 fases por padrão
      if (json.phases && json.phases.length > 0) {
        const initialExpanded: { [key: number]: boolean } = {};
        const recentPhases = json.phases.slice(-4);
        recentPhases.forEach((p: Phase) => {
          initialExpanded[p.id] = true;
        });
        json.phases.filter((p: Phase) => !p.isCompleted).forEach((p: Phase) => {
          initialExpanded[p.id] = true;
        });
        setExpandedPhases(initialExpanded);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro de conexão.');
    } finally {
      setIsLoading(false);
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, []);

  const togglePhase = (id: number) => {
    setExpandedPhases(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    if (!data) return;
    const all: { [key: number]: boolean } = {};
    data.phases.forEach(p => { all[p.id] = true; });
    setExpandedPhases(all);
  };

  const collapseAll = () => {
    setExpandedPhases({});
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filtragem das fases
  const filteredPhases = data?.phases.filter(phase => {
    if (statusFilter === 'completed' && !phase.isCompleted) return false;
    if (statusFilter === 'pending' && phase.isCompleted) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = phase.title.toLowerCase().includes(q) || phase.rawTitle.toLowerCase().includes(q);
    const matchesItems = phase.items.some(item => 
      item.text.toLowerCase().includes(q) || 
      item.subitems.some(s => s.toLowerCase().includes(q))
    );
    return matchesTitle || matchesItems;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(0,210,255,0.4)] animate-pulse">
            <Cpu className="text-white w-6 h-6 animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-white tracking-wide">VERSUS Relatório Executivo</h2>
            <p className="text-xs text-slate-400 mt-1">Carregando sincronização em tempo real com o repositório...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="bg-[#0F172A] border border-rose-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Falha ao Carregar Relatório</h3>
          <p className="text-xs text-slate-400 mt-2 mb-6">{error || 'Não foi possível ler o checklist.'}</p>
          <button 
            onClick={() => fetchChecklist(true)}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* 1. TOPO / HEADER EXECUTIVO */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 print:relative print:bg-white print:border-b-2 print:border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0 print:border print:border-black">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white print:text-black">
                  VERSUS <span className="text-cyan-400 font-semibold print:text-black">· Relatório de Gestão</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 print:hidden">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Tempo Real
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 print:text-slate-600">
                <Calendar size={12} className="text-slate-500" />
                <span>Atualizado em: {new Date(stats.updatedAt).toLocaleDateString('pt-BR')} às {new Date(stats.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          </div>

          {/* Botões de Ação do Gestor */}
          <div className="flex items-center gap-2 print:hidden w-full sm:w-auto justify-end">
            <button
              onClick={() => fetchChecklist(true)}
              title="Atualizar dados agora"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin text-cyan-400" : ""} />
            </button>

            <button
              onClick={handleCopyLink}
              title="Copiar link para o gestor salvar"
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} className="text-slate-400" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              title="Salvar ou Imprimir em PDF"
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Baixar em PDF</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* 2.1 CARDS DE MÉTRICAS EXECUTIVAS (KPIS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Progresso Global */}
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800/90 shadow-sm relative overflow-hidden group print:bg-white print:border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-700">Progresso Geral</span>
              <span className="text-xs font-black text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-full print:text-black">
                {stats.completionPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white print:text-black">{stats.completedPhases}</span>
              <span className="text-xs text-slate-400 print:text-slate-600">/ {stats.totalPhases} Fases Concluídas</span>
            </div>
            {/* Barra de Progresso */}
            <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden print:bg-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-1000 print:bg-black"
                style={{ width: `${stats.completionPercent}%` }}
              />
            </div>
          </div>

          {/* Card 2: Fase Ativa no Momento */}
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800/90 shadow-sm relative overflow-hidden print:bg-white print:border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-700">Fase em Andamento</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full print:text-black">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Ativa
              </span>
            </div>
            <p className="text-xs font-bold text-white line-clamp-2 leading-relaxed print:text-black" title={stats.currentActivePhaseTitle}>
              {stats.currentActivePhaseTitle}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 print:text-slate-600">
              <Clock size={12} className="text-amber-400 shrink-0" />
              <span>Em execução pela equipe técnica</span>
            </div>
          </div>

          {/* Card 3: Último Ponto Batido */}
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800/90 shadow-sm relative overflow-hidden print:bg-white print:border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-700">Registro de Ponto</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full print:text-black">
                {stats.lastPunchIn ? `${stats.lastPunchIn.date}` : 'Registrado'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-emerald-400 print:text-black">
                {stats.lastPunchIn ? stats.lastPunchIn.time : '--:--'}
              </span>
              <span className="text-xs text-slate-300 font-semibold print:text-slate-700 truncate">
                {stats.lastPunchIn?.type === 'start' ? 'Início do Turno' : stats.lastPunchIn?.type === 'end' ? 'Encerramento' : 'Atualização'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 truncate print:text-slate-600" title={stats.lastPunchIn?.description}>
              {stats.lastPunchIn ? stats.lastPunchIn.description : 'Jornada em andamento'}
            </p>
          </div>

          {/* Card 4: Infraestrutura & Produção */}
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800/90 shadow-sm relative overflow-hidden print:bg-white print:border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-700">Deploy & Produção</span>
              <ShieldCheck size={16} className="text-emerald-400 print:text-black" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 print:text-slate-600">Frontend Vercel:</span>
                <span className="font-bold text-emerald-400 print:text-black">Online (29 Rotas)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 print:text-slate-600">Backend VPS:</span>
                <span className="font-bold text-emerald-400 print:text-black">PM2 Online (:3001)</span>
              </div>
            </div>
          </div>

        </div>

        {/* 2.2 NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center justify-between border-b border-slate-800 print:hidden pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('fases')}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'fases'
                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Layers size={14} />
              <span>Fases do Projeto ({data.phases.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ponto')}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ponto'
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Clock size={14} />
              <span>Registro de Ponto ({data.punchIns.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roadmap'
                  ? 'bg-purple-500/15 border border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <TrendingUp size={14} />
              <span>Roadmap Futuro ({data.roadmapItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('markdown')}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'markdown'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <FileText size={14} />
              <span>Texto Completo</span>
            </button>
          </div>

          {activeTab === 'fases' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={expandAll}
                className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Expandir Todas
              </button>
              <span className="text-slate-700">·</span>
              <button 
                onClick={collapseAll}
                className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Recolher
              </button>
            </div>
          )}
        </div>

        {/* 2.3 CONTEÚDO DA ABA SELECIONADA */}

        {/* --- ABA 1: FASES DO PROJETO --- */}
        {activeTab === 'fases' && (
          <div className="space-y-4">
            
            {/* Barra de Filtros e Busca */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F172A] p-3 rounded-2xl border border-slate-800/80 print:hidden">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Buscar fase, tecnologia ou tarefa..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#162038] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all' 
                      ? 'bg-slate-800 text-white border border-slate-600' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todas ({data.phases.length})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'completed' 
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/50' 
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  Concluídas ({stats.completedPhases})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'pending' 
                      ? 'bg-amber-950/60 text-amber-400 border border-amber-600/50' 
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  Em Andamento ({stats.pendingPhases})
                </button>
              </div>
            </div>

            {/* Lista das Fases */}
            <div className="space-y-3 print:space-y-4">
              {filteredPhases.length === 0 ? (
                <div className="p-12 text-center bg-[#0F172A] rounded-2xl border border-slate-800">
                  <p className="text-sm text-slate-400">Nenhuma fase encontrada para os filtros selecionados.</p>
                </div>
              ) : (
                filteredPhases.map((phase) => {
                  const isExpanded = !!expandedPhases[phase.id];
                  
                  return (
                    <div 
                      key={phase.id}
                      className={`rounded-2xl border transition-all overflow-hidden print:bg-white print:border-slate-300 print:break-inside-avoid ${
                        phase.isCompleted 
                          ? 'bg-[#0F172A] border-slate-800 hover:border-slate-700' 
                          : 'bg-[#162038]/60 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                      }`}
                    >
                      {/* Header da Fase */}
                      <div 
                        onClick={() => togglePhase(phase.id)}
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            phase.isCompleted 
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                              : 'bg-amber-500/15 border border-amber-500/40 text-amber-400 animate-pulse'
                          }`}>
                            {phase.id}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-white print:text-black truncate">
                              Fase {phase.id}: {phase.title}
                            </h3>
                            <p className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                              {phase.items.length} {phase.items.length === 1 ? 'item verificado' : 'itens verificados'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {phase.isCompleted ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 print:text-black">
                              <CheckCircle2 size={12} className="text-emerald-400" />
                              <span>100% Entregue</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/40 text-amber-400 print:text-black">
                              <Clock size={12} className="text-amber-400" />
                              <span>Em Execução</span>
                            </span>
                          )}

                          <button className="text-slate-400 hover:text-white print:hidden">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Corpo com Itens da Fase */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-slate-800/80 mt-1 space-y-2.5 print:block">
                          {phase.items.map((item, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex items-start gap-2.5 text-xs">
                                <span className="mt-0.5 shrink-0">
                                  {item.checked ? (
                                    <CheckCircle2 size={15} className="text-emerald-400" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded border border-amber-400/80 bg-amber-950/40" />
                                  )}
                                </span>
                                <span className={`font-semibold leading-relaxed ${item.checked ? 'text-slate-200 print:text-black' : 'text-amber-300 font-bold'}`}>
                                  {item.text}
                                </span>
                              </div>

                              {item.subitems.length > 0 && (
                                <ul className="pl-6 space-y-1 text-[11px] text-slate-400 print:text-slate-700">
                                  {item.subitems.map((sub, sIdx) => (
                                    <li key={sIdx} className="flex items-start gap-1.5 leading-normal">
                                      <span className="text-slate-600 select-none">•</span>
                                      <span>{sub}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* --- ABA 2: REGISTRO DE PONTO (TIMESHEET) --- */}
        {activeTab === 'ponto' && (
          <div className="space-y-4">
            <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Histórico Cronológico do Ponto</h3>
                <p className="text-xs text-slate-400">Acompanhamento transparente das jornadas e entregas diárias.</p>
              </div>
              <span className="text-xs text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded-full">
                {data.punchIns.length} Registros
              </span>
            </div>

            <div className="space-y-3">
              {data.punchIns.map((punch, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-xl bg-[#0F172A] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all print:bg-white print:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      {punch.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white print:text-black">{punch.date}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-bold text-cyan-400 print:text-black">{punch.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 print:text-slate-700 mt-0.5 leading-relaxed">
                        {punch.description}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 self-start sm:self-center uppercase tracking-wider ${
                    punch.type === 'start' 
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400' 
                      : punch.type === 'end' 
                        ? 'bg-slate-800 border border-slate-700 text-slate-300'
                        : punch.type === 'pause'
                          ? 'bg-amber-950/60 border border-amber-800 text-amber-400'
                          : 'bg-cyan-950/60 border border-cyan-800 text-cyan-400'
                  }`}>
                    {punch.type === 'start' ? 'Início de Turno' : punch.type === 'end' ? 'Fechamento' : punch.type === 'pause' ? 'Intervalo' : 'Evolução'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ABA 3: ROADMAP FUTURO (ICEBOX) --- */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white">Roadmap Futuro (Banco de Ideias)</h3>
              <p className="text-xs text-slate-400">Funcionalidades de expansão planejadas para os próximos ciclos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.roadmapItems.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800/90 flex flex-col justify-between gap-3 hover:border-purple-500/40 transition-all print:bg-white print:border-slate-300"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <h4 className="text-xs font-bold text-white print:text-black">{item.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 print:text-slate-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-purple-400 font-bold bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-full w-fit">
                    Planejado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ABA 4: MARKDOWN COMPLETO --- */}
        {activeTab === 'markdown' && (
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto print:bg-white print:text-black">
            {data.rawMarkdown}
          </div>
        )}

      </main>

      {/* 3. RODAPÉ EXECUTIVO */}
      <footer className="border-t border-slate-800/80 mt-12 py-6 bg-[#0B1224] text-center text-xs text-slate-500 print:hidden">
        <p className="font-semibold text-slate-400">VERSUS · Sistema Omnichannel com IA e CRM Integrado</p>
        <p className="mt-1 text-[11px]">Relatório gerado automaticamente a partir do repositório oficial.</p>
      </footer>

    </div>
  );
}
