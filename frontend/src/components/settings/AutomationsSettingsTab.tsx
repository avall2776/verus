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
  FileCheck,
  Award,
  DollarSign,
  Kanban,
  MessageSquare,
  Tag,
  RefreshCw,
  Search,
  ChevronRight,
  AlertCircle,
  Loader2
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { AutomationRule, AutomationLog } from "@/types/automation";
import { AutomationModal } from "@/components/automations/AutomationModal";

export default function AutomationsSettingsTab() {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"rules" | "logs">("rules");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [autoRes, logsRes] = await Promise.all([
        api.get("/automations"),
        api.get("/automations/logs"),
      ]);
      setAutomations(Array.isArray(autoRes.data) ? autoRes.data : []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
    } catch (error: any) {
      console.error("[AUTOMATIONS_FETCH_ERROR]", error);
      toast.error(error.response?.data?.message || "Erro ao carregar regras de automação.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await api.patch(`/automations/${id}/toggle`, { isActive: !current });
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !current } : a))
      );
      toast.success(!current ? "Automação ativada com sucesso!" : "Automação pausada.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao alterar status da automação.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a automação "${name}"?`)) return;
    try {
      await api.delete(`/automations/${id}`);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      toast.success("Automação removida com sucesso.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao excluir automação.");
    }
  };

  const handleTestNow = async (id: string, name: string) => {
    setTestingId(id);
    try {
      const res = await api.post(`/automations/${id}/test`);
      toast.success(`Teste executado com sucesso: ${res.data?.message || "Concluído!"}`);
      const logsRes = await api.get("/automations/logs");
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
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
          icon: <FileCheck className="w-3.5 h-3.5" />,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        };
      case "CONTRACT_SIGNED":
        return {
          label: "Contrato Assinado",
          icon: <Award className="w-3.5 h-3.5" />,
          color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        };
      case "DEAL_CREATED":
        return {
          label: "Nova Oportunidade",
          icon: <DollarSign className="w-3.5 h-3.5" />,
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        };
      case "DEAL_STAGE_CHANGED":
      case "STAGE_CHANGED":
        return {
          label: "Etapa de Funil",
          icon: <Kanban className="w-3.5 h-3.5" />,
          color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        };
      case "MESSAGE_RECEIVED":
        return {
          label: "Mensagem Recebida",
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        };
      case "TAG_ADDED":
        return {
          label: "Tag Adicionada",
          icon: <Tag className="w-3.5 h-3.5" />,
          color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
        };
      case "INACTIVITY_TIMEOUT":
      case "INACTIVITY":
        return {
          label: "Inatividade",
          icon: <Clock className="w-3.5 h-3.5" />,
          color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
        };
      default:
        return {
          label: type,
          icon: <Zap className="w-3.5 h-3.5" />,
          color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
        };
    }
  };

  const filteredAutomations = automations.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            Automações e Gatilhos de Atendimento
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure disparos automáticos baseados em eventos no CRM, Inbox, funil e propostas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#070D1B] border border-slate-800 hover:border-slate-700 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Automação
          </button>
        </div>
      </div>

      {/* Sub-Abas: Regras vs Logs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("rules")}
            className={`pb-3 text-xs font-bold transition-colors relative ${
              activeSubTab === "rules"
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Regras Ativas ({automations.length})
          </button>
          <button
            onClick={() => setActiveSubTab("logs")}
            className={`pb-3 text-xs font-bold transition-colors relative ${
              activeSubTab === "logs"
                ? "text-blue-400 border-b-2 border-blue-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Histórico de Execuções ({logs.length})
          </button>
        </div>

        {activeSubTab === "rules" && (
          <div className="relative w-64 mb-2">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar automações..."
              className="w-full bg-[#070D1B] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Conteúdo da Sub-Aba */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-semibold">Carregando automações...</p>
        </div>
      ) : activeSubTab === "rules" ? (
        filteredAutomations.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#070D1B]/40 space-y-3">
            <Zap className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma regra de automação configurada</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Crie fluxos automatizados para disparar mensagens no WhatsApp, mover oportunidades no funil ou notificar a equipe.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Criar primeira regra
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAutomations.map((auto) => {
              const trigger = getTriggerBadge(auto.triggerType);
              return (
                <div
                  key={auto.id}
                  className="p-4 rounded-xl bg-[#070D1B] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white truncate">{auto.name}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${trigger.color}`}
                      >
                        {trigger.icon}
                        {trigger.label}
                      </span>
                      {auto.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-semibold">
                          Pausada
                        </span>
                      )}
                    </div>
                    {auto.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{auto.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleTestNow(auto.id, auto.name)}
                      disabled={testingId === auto.id}
                      title="Disparar teste agora"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-600/20 transition-colors disabled:opacity-50"
                    >
                      {testingId === auto.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>Testar</span>
                    </button>

                    <button
                      onClick={() => handleToggle(auto.id, auto.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        auto.isActive
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30"
                      }`}
                    >
                      {auto.isActive ? "Pausar" : "Ativar"}
                    </button>

                    <button
                      onClick={() => handleDelete(auto.id, auto.name)}
                      title="Excluir regra"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : logs.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#070D1B]/40 space-y-2">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Nenhum registro de execução ainda</p>
          <p className="text-xs text-slate-500">
            Quando as automações forem acionadas ou testadas, os logs aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.slice(0, 20).map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800/80 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                {log.status === "SUCCESS" ? (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <XCircle className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white">
                    {log.automation?.name || "Automação"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {log.errorReason || log.error || (log.status === "SUCCESS" ? "Execução processada com sucesso" : "Falha na execução")}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono">
                  {log.executedAt ? new Date(log.executedAt).toLocaleString("pt-BR") : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação de Automação */}
      {isModalOpen && (
        <AutomationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
