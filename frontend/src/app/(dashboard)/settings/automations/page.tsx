"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Activity,
  CheckCheck,
  FileCheck,
  Award,
  DollarSign,
  Kanban,
  MessageSquare,
  Tag,
  RefreshCw,
  Search,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { AutomationRule, AutomationLog } from "@/types/automation";
import { AutomationModal } from "@/components/automations/AutomationModal";

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "logs">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AutomationLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [autoRes, logsRes] = await Promise.all([
        api.get("/automations"),
        api.get("/automations/logs")
      ]);
      setAutomations(autoRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados de automações:", error);
      toast.error("Erro ao carregar dados das automações.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await api.patch(`/automations/${id}/toggle`, { isActive: !current });
      setAutomations(prev =>
        prev.map(a => (a.id === id ? { ...a, isActive: !current } : a))
      );
      toast.success(!current ? "Automação ativada com sucesso!" : "Automação pausada.");
    } catch (error) {
      toast.error("Erro ao alterar status da automação.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a automação "${name}"?`)) return;
    try {
      await api.delete(`/automations/${id}`);
      setAutomations(prev => prev.filter(a => a.id !== id));
      toast.success("Automação removida com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir automação.");
    }
  };

  const handleTestNow = async (id: string, name: string) => {
    setTestingId(id);
    try {
      const res = await api.post(`/automations/${id}/test`);
      toast.success(`Teste executado: ${res.data?.message || "Sucesso!"}`);
      // Atualizar logs após o teste
      const logsRes = await api.get("/automations/logs");
      setLogs(logsRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Falha ao executar teste de automação.");
    } finally {
      setTestingId(null);
    }
  };

  const getTriggerBadge = (type: string) => {
    switch (type) {
      case "PROPOSAL_ACCEPTED":
        return {
          label: "Proposta Aceita",
          icon: <FileCheck size={14} />,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
        };
      case "CONTRACT_SIGNED":
        return {
          label: "Contrato Assinado",
          icon: <Award size={14} />,
          color: "text-purple-400 bg-purple-500/10 border-purple-500/30"
        };
      case "DEAL_CREATED":
        return {
          label: "Nova Oportunidade",
          icon: <DollarSign size={14} />,
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
        };
      case "DEAL_STAGE_CHANGED":
      case "STAGE_CHANGED":
        return {
          label: "Etapa de Funil Alterada",
          icon: <Kanban size={14} />,
          color: "text-blue-400 bg-blue-500/10 border-blue-500/30"
        };
      case "MESSAGE_RECEIVED":
        return {
          label: "Mensagem Recebida",
          icon: <MessageSquare size={14} />,
          color: "text-amber-400 bg-amber-500/10 border-amber-500/30"
        };
      case "TAG_ADDED":
        return {
          label: "Tag Adicionada",
          icon: <Tag size={14} />,
          color: "text-pink-400 bg-pink-500/10 border-pink-500/30"
        };
      case "INACTIVITY_TIMEOUT":
      case "INACTIVITY":
        return {
          label: "Inatividade sem Resposta",
          icon: <Clock size={14} />,
          color: "text-orange-400 bg-orange-500/10 border-orange-500/30"
        };
      default:
        return {
          label: type,
          icon: <Zap size={14} />,
          color: "text-slate-400 bg-slate-500/10 border-slate-500/30"
        };
    }
  };

  const getActionLabel = (actType?: string, payload?: any, legacyActions?: any[]) => {
    const type = actType || legacyActions?.[0]?.type || "Ação";
    const data = payload || legacyActions?.[0] || {};

    if (type === "SEND_WHATSAPP" || type === "SEND_MESSAGE") {
      const msg = data.message || data.content || "";
      return `WhatsApp: "${msg.length > 40 ? msg.substring(0, 40) + "..." : msg}"`;
    }
    if (type === "UPDATE_DEAL_STAGE" || type === "MOVE_STAGE") {
      return `Mover CRM: etapa "${data.stage || "ganho"}"`;
    }
    if (type === "CREATE_TASK") {
      return `Criar Tarefa: "${data.title || "Acompanhamento"}"`;
    }
    if (type === "ADD_TAG") {
      return `Adicionar Tag: "${data.tag || "fechado"}"`;
    }
    if (type === "NOTIFY_USER") {
      return `Notificar: "${data.alert || "Alerta interno"}"`;
    }
    return type;
  };

  // KPIs
  const activeCount = automations.filter(a => a.isActive).length;
  const totalLogs = logs.length;
  const successCount = logs.filter(l => l.status === "SUCCESS").length;
  const successRate = totalLogs > 0 ? ((successCount / totalLogs) * 100).toFixed(1) : "100";

  // Filtro
  const filteredAutomations = automations.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050A15]">
      {/* TOPBAR / HEADER */}
      <div className="p-6 border-b border-slate-800/80 bg-[#0B1224]/80 backdrop-blur-md shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Zap size={26} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Motor de Automações
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-medium">
                Enterprise Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Workflows inteligentes de Propostas, Contratos, CRM e WhatsApp sem intervenção manual
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÃO ATUALIZAR */}
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors disabled:opacity-50"
            title="Recarregar automações"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>

          {/* ABAS SWITCH */}
          <div className="bg-[#050A15] p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "list"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Minhas Regras ({automations.length})
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "logs"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Histórico (Logs) ({logs.length})
            </button>
          </div>

          {/* BOTÃO NOVA AUTOMAÇÃO */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus size={16} />
            Nova Automação
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS (KPIS) */}
      <div className="px-6 pt-5 pb-3 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0B1224]/90 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Regras Ativas
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {activeCount} <span className="text-xs text-slate-500 font-normal">/ {automations.length}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Zap size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1224]/90 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Disparos
            </div>
            <div className="text-xl font-bold text-white mt-1">{totalLogs}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1224]/90 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Taxa de Sucesso
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{successRate}%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <CheckCheck size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1224]/90 border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Velocidade de Despacho
            </div>
            <div className="text-xl font-bold text-cyan-300 mt-1">&lt; 350ms</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL COM SCROLL */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
        {activeTab === "list" ? (
          <div>
            {/* BARRA DE PESQUISA */}
            {automations.length > 0 && (
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Filtrar automações por nome..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0B1224] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Exibindo {filteredAutomations.length} de {automations.length} regras
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="p-16 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                <RefreshCw size={24} className="animate-spin text-cyan-400" />
                Carregando catálogo de automações...
              </div>
            ) : automations.length === 0 ? (
              /* EMPTY STATE SOFISTICADO */
              <div className="p-12 text-center bg-[#0B1224]/80 rounded-2xl border border-slate-800/80 border-dashed max-w-3xl mx-auto my-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/10">
                  <Zap size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Nenhuma regra de automação configurada
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                    Potencialize suas conversões criando fluxos automatizados para envio de
                    WhatsApp instantâneo no aceite de propostas e avanço de funil.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
                  >
                    <Plus size={16} />
                    Criar Primeira Automação
                  </button>
                </div>

                {/* TEMPLATES RECOMENDADOS */}
                <div className="pt-6 border-t border-slate-800 text-left">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-cyan-400" /> Modelos Mais Populares
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div
                      onClick={() => setIsModalOpen(true)}
                      className="p-3.5 rounded-xl bg-[#050A15] border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                        Boas-vindas ao Aceitar
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Dispara WhatsApp ao cliente assim que a proposta for aprovada.
                      </p>
                    </div>

                    <div
                      onClick={() => setIsModalOpen(true)}
                      className="p-3.5 rounded-xl bg-[#050A15] border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                        Mover para Ganho
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Atualiza o card do CRM para 'Ganho' ao assinar o contrato.
                      </p>
                    </div>

                    <div
                      onClick={() => setIsModalOpen(true)}
                      className="p-3.5 rounded-xl bg-[#050A15] border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                        Reativação por Inatividade
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Envia lembrete amigável se o lead não responder por 2 horas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* GRID DE CARDS */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAutomations.map(auto => {
                  const triggerInfo = getTriggerBadge(auto.triggerType);
                  const isTesting = testingId === auto.id;

                  return (
                    <div
                      key={auto.id}
                      className="bg-[#0B1224]/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700/80 transition-all relative overflow-hidden group shadow-lg"
                    >
                      {/* BARRA LATERAL COLORIDA DE STATUS */}
                      <div
                        className={`absolute left-0 top-0 w-1.5 h-full ${
                          auto.isActive ? "bg-emerald-500" : "bg-slate-700"
                        }`}
                      />

                      <div>
                        {/* HEADER DO CARD: BADGE E TOGGLE SWITCH */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${triggerInfo.color}`}
                          >
                            {triggerInfo.icon}
                            <span>{triggerInfo.label}</span>
                          </div>

                          {/* TOGGLE SWITCH */}
                          <label className="flex items-center cursor-pointer shrink-0">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={auto.isActive}
                                onChange={() => handleToggle(auto.id, auto.isActive)}
                              />
                              <div
                                className={`block w-11 h-6 rounded-full transition-colors ${
                                  auto.isActive
                                    ? "bg-emerald-500"
                                    : "bg-slate-800 border border-slate-700"
                                }`}
                              />
                              <div
                                className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                                  auto.isActive ? "transform translate-x-5" : ""
                                }`}
                              />
                            </div>
                          </label>
                        </div>

                        {/* NOME E DESCRIÇÃO */}
                        <h3 className="text-sm font-bold text-white tracking-tight mb-1 group-hover:text-cyan-300 transition-colors">
                          {auto.name}
                        </h3>
                        {auto.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                            {auto.description}
                          </p>
                        )}

                        {/* CONDICIONAL & AÇÃO EXECUTADA */}
                        <div className="bg-[#050A15]/80 rounded-xl p-3 border border-slate-800/80 space-y-2 mb-4 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                              QUANDO
                            </span>
                            <span className="text-slate-300 font-medium truncate">
                              {triggerInfo.label}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                              ENTÃO
                            </span>
                            <span className="text-slate-300 font-medium truncate">
                              {getActionLabel(auto.actionType, auto.actionPayload, auto.actions)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* FOOTER DO CARD */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Activity size={13} className="text-cyan-400" />
                          <span>{auto._count?.logs ?? 0} execuções</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* BOTÃO TESTAR AGORA */}
                          <button
                            type="button"
                            disabled={isTesting}
                            onClick={() => handleTestNow(auto.id, auto.name)}
                            title="Disparar simulação manual"
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-medium text-[11px] flex items-center gap-1 transition-all disabled:opacity-50"
                          >
                            <Play size={11} fill="currentColor" />
                            <span>{isTesting ? "Testando..." : "Testar"}</span>
                          </button>

                          {/* BOTÃO EXCLUIR */}
                          <button
                            type="button"
                            onClick={() => handleDelete(auto.id, auto.name)}
                            title="Excluir regra"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ABA HISTÓRICO (LOGS) */
          <div className="max-w-6xl mx-auto bg-[#0B1224]/90 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Auditoria de Execuções e Disparos ({logs.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">Últimos 100 eventos</span>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[650px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  Nenhuma execução registrada até o momento.
                </div>
              ) : (
                logs.map(log => {
                  const isSuccess = log.status === "SUCCESS";
                  const executedDate = new Date(log.executedAt);
                  const isTest = log.payloadDetails?.type === "MANUAL_TEST_EXECUTION" || log.payloadDetails?.simulated;

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSuccess
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {log.automation?.name || "Automação"}
                            </span>
                            {isTest && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                Teste Simulado
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                            <span>Contato: {log.contact?.name || log.payloadDetails?.mockContext?.clientName || "Sistema / Geral"}</span>
                            <span>•</span>
                            <span className="text-slate-500">
                              {log.payloadDetails?.resolvedMessage || log.payloadDetails?.actionsExecuted?.[0]?.resolvedMessage || "Ação despachada"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 pl-4">
                        <div className="text-right">
                          <div className="text-[11px] font-mono text-slate-400">
                            {executedDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {executedDate.toLocaleDateString("pt-BR")}
                          </div>
                        </div>

                        {log.errorReason || log.error ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">
                            <ShieldAlert size={12} />
                            <span>Erro</span>
                          </div>
                        ) : null}

                        <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DO LOG */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-cyan-400" />
                Detalhes do Evento de Automação
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500">Regra:</span>{" "}
                <strong className="text-white">{selectedLog.automation?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>{" "}
                <span className={selectedLog.status === "SUCCESS" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {selectedLog.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Data/Hora:</span>{" "}
                <span className="text-slate-300 font-mono">
                  {new Date(selectedLog.executedAt).toLocaleString("pt-BR")}
                </span>
              </div>

              {selectedLog.payloadDetails && (
                <div>
                  <span className="text-slate-500 block mb-1">Payload Detalhado:</span>
                  <pre className="p-3 rounded-xl bg-[#050A15] border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-60">
                    {JSON.stringify(selectedLog.payloadDetails, null, 2)}
                  </pre>
                </div>
              )}

              {(selectedLog.errorReason || selectedLog.error) && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  <strong>Motivo da Falha:</strong> {selectedLog.errorReason || selectedLog.error}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONSTRUTOR DE AUTOMAÇÃO (MODAL) */}
      <AutomationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
