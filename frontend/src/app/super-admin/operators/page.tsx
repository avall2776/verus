"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, 
  UserPlus, 
  Eye, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Lock, 
  Edit2, 
  X, 
  AlertTriangle, 
  ArrowUpRight, 
  Mail, 
  Building2, 
  Activity, 
  Zap, 
  Copy, 
  Check, 
  PhoneCall,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

interface Operator {
  id: string;
  name: string;
  email: string;
  role: string;
  roleTitle?: string;
  isActive: boolean;
  isOnline: boolean;
  avatarUrl?: string;
  permissions?: Record<string, any>;
  createdAt: string;
  metrics: {
    todayAttendances: number;
    todayResolved: number;
    activeTicketsCount: number;
    avgResponseMinutes: number;
    resolutionRate: number;
  };
  activeTickets: any[];
}

interface OverviewMetrics {
  totalOperators: number;
  onlineOperators: number;
  totalAttendancesToday: number;
  totalResolvedToday: number;
  globalAvgResponseTime: number;
  globalResolutionRate: number;
}

export default function SuperAdminOperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [overview, setOverview] = useState<OverviewMetrics>({
    totalOperators: 0,
    onlineOperators: 0,
    totalAttendancesToday: 0,
    totalResolvedToday: 0,
    globalAvgResponseTime: 0,
    globalResolutionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  // Modal Espiar Conversa
  const [isSpyModalOpen, setIsSpyModalOpen] = useState(false);
  const [spyLoading, setSpyLoading] = useState(false);
  const [spyData, setSpyData] = useState<{ operator: any; activeTickets: any[] } | null>(null);
  const [selectedSpyTicketIndex, setSelectedSpyTicketIndex] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roleTitle: "Atendente de Suporte",
    password: "",
    sendEmail: true,
    permissions: {
      support: true,
      liveChat: true,
      chatInterno: true,
      audit: false,
      metrics: true,
      plans: false, // Bloqueado por isolamento de privilégios
      tenants: false, // Bloqueado por isolamento de privilégios
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Carregar dados
  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/operators");
      setOperators(res.data.operators || []);
      if (res.data.overview) {
        setOverview(res.data.overview);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao carregar operadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  // Abertura do Modal de Criação
  const handleOpenCreateModal = () => {
    setFormData({
      name: "",
      email: "",
      roleTitle: "Atendente de Suporte",
      password: "",
      sendEmail: true,
      permissions: {
        support: true,
        liveChat: true,
        chatInterno: true,
        audit: false,
        metrics: true,
        plans: false,
        tenants: false,
      },
    });
    setCreatedCredentials(null);
    setCopiedPass(false);
    setIsNewModalOpen(true);
  };

  // Submissão do Cadastro
  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Preencha nome e e-mail do operador.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/operators", formData);
      toast.success(res.data.message || "Operador cadastrado com sucesso!");
      
      if (res.data.tempPassword) {
        setCreatedCredentials({
          email: formData.email,
          pass: res.data.tempPassword,
        });
      } else {
        setIsNewModalOpen(false);
      }
      fetchOperators();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao cadastrar operador.");
    } finally {
      setSubmitting(false);
    }
  };

  // Abertura do Modal de Edição
  const handleOpenEditModal = (op: Operator) => {
    setSelectedOperator(op);
    const perm = op.permissions || {};
    setFormData({
      name: op.name,
      email: op.email,
      roleTitle: op.roleTitle || "Atendente de Suporte",
      password: "",
      sendEmail: false,
      permissions: {
        support: perm.support ?? true,
        liveChat: perm.liveChat ?? true,
        chatInterno: perm.chatInterno ?? true,
        audit: perm.audit ?? false,
        metrics: perm.metrics ?? true,
        plans: false,
        tenants: false,
      },
    });
    setIsEditModalOpen(true);
  };

  // Salvar Edição
  const handleUpdateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;

    setSubmitting(true);
    try {
      await api.patch(`/operators/${selectedOperator.id}`, {
        name: formData.name,
        email: formData.email,
        roleTitle: formData.roleTitle,
        permissions: formData.permissions,
        password: formData.password ? formData.password : undefined,
      });
      toast.success("Operador atualizado com sucesso!");
      setIsEditModalOpen(false);
      fetchOperators();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao atualizar operador.");
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar Status Ativo / Inativo
  const handleToggleStatus = async (op: Operator) => {
    try {
      await api.patch(`/operators/${op.id}`, {
        isActive: !op.isActive,
      });
      toast.success(op.isActive ? "Operador pausado." : "Operador reativado!");
      fetchOperators();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao alterar status do operador.");
    }
  };

  // Recurso de Auditoria: Espiar Conversa
  const handleSpyConversation = async (op: Operator) => {
    setSelectedOperator(op);
    setSpyLoading(true);
    setIsSpyModalOpen(true);
    setSelectedSpyTicketIndex(0);

    try {
      const res = await api.get(`/operators/${op.id}/live-chats`);
      setSpyData(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar dados de auditoria em tempo real.");
    } finally {
      setSpyLoading(false);
    }
  };

  // Copiar Senha Gerada
  const handleCopyPassword = () => {
    if (!createdCredentials?.pass) return;
    navigator.clipboard.writeText(createdCredentials.pass);
    setCopiedPass(true);
    toast.success("Senha provisória copiada!");
    setTimeout(() => setCopiedPass(false), 2500);
  };

  // Filtro Dinâmico
  const filteredOperators = useMemo(() => {
    return operators.filter((op) => {
      const matchesSearch = 
        op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = 
        roleFilter === "ALL" || 
        (op.roleTitle && op.roleTitle.toLowerCase().includes(roleFilter.toLowerCase()));

      const matchesStatus = 
        statusFilter === "ALL" ||
        (statusFilter === "ONLINE" && op.isOnline) ||
        (statusFilter === "ACTIVE" && op.isActive) ||
        (statusFilter === "PAUSED" && !op.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [operators, searchTerm, roleFilter, statusFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 font-sans">
      
      {/* Topo / Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20">
              Módulo Administrativo
            </span>
            <span className="text-xs font-mono text-slate-500">Super Admin Master</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Users className="text-blue-500" size={22} />
            Gestão de Equipe & Operadores de Suporte
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle de colaboradores, produtividade diária, segurança de acesso e auditoria em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOperators}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-800 bg-[#0B1224] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            title="Atualizar Dados"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-400" : ""} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>+ Novo Operador</span>
          </button>
        </div>
      </div>

      {/* Painel Analítico de Produtividade Diária (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Operadores */}
        <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Operadores</span>
            <Users size={16} className="text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{overview.totalOperators}</span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {overview.onlineOperators} Online
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">Equipe do Suporte Master</span>
        </div>

        {/* Card 2: Atendimentos Hoje */}
        <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Atendimentos Hoje</span>
            <Activity size={16} className="text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{overview.totalAttendancesToday}</span>
            <span className="text-[11px] font-bold text-cyan-300">Volume Total</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Tratados desde 00:00h</span>
        </div>

        {/* Card 3: Chamados Resolvidos */}
        <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Chamados Fechados</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{overview.totalResolvedToday}</span>
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
              {overview.globalResolutionRate}% Taxa
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">Finalizados com sucesso</span>
        </div>

        {/* Card 4: TMR Médio Global */}
        <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Tempo Médio Resposta</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300">{overview.globalAvgResponseTime}m</span>
            <span className="text-[11px] font-bold text-slate-400">TMR Geral</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Tempo até primeira resposta</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos os Cargos</option>
            <option value="Atendente">Atendente de Suporte</option>
            <option value="Analista">Analista de Suporte</option>
            <option value="Gerente">Gerente de Atendimento</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ONLINE">Apenas Online</option>
            <option value="ACTIVE">Apenas Ativos</option>
            <option value="PAUSED">Pausados</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono self-start md:self-auto">
          Exibindo <strong>{filteredOperators.length}</strong> de {operators.length} colaboradores
        </span>
      </div>

      {/* Tabela de Operadores & Auditoria */}
      <div className="rounded-2xl bg-[#0B1224] border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070D1B] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-bold">Colaborador / Operador</th>
                <th className="px-4 py-3 font-bold">Função / Cargo</th>
                <th className="px-4 py-3 font-bold text-center">Atendimentos Hoje</th>
                <th className="px-4 py-3 font-bold text-center">Resolvidos</th>
                <th className="px-4 py-3 font-bold text-center">TMR Individual</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 font-bold text-right">Ações de Governança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
                    Carregando equipe e métricas em tempo real...
                  </td>
                </tr>
              ) : filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    Nenhum operador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => {
                  return (
                    <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Coluna 1: Colaborador */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-sm">
                              {op.name.charAt(0).toUpperCase()}
                            </div>
                            <span 
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B1224] ${
                                op.isOnline ? "bg-emerald-500" : "bg-slate-500"
                              }`}
                              title={op.isOnline ? "Conectado agora" : "Offline"}
                            />
                          </div>

                          <div>
                            <span className="font-bold text-white text-xs block truncate">{op.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono block truncate">{op.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Coluna 2: Cargo */}
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700 inline-flex items-center gap-1.5">
                          <ShieldCheck size={12} className="text-blue-400" />
                          <span>{op.roleTitle || "Atendente de Suporte"}</span>
                        </span>
                      </td>

                      {/* Coluna 3: Atendimentos Hoje */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-bold text-white font-mono">{op.metrics.todayAttendances}</span>
                        {op.metrics.activeTicketsCount > 0 && (
                          <span className="text-[10px] text-blue-400 block font-semibold">
                            ({op.metrics.activeTicketsCount} em aberto)
                          </span>
                        )}
                      </td>

                      {/* Coluna 4: Resolvidos Hoje */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-bold text-emerald-400 font-mono">{op.metrics.todayResolved}</span>
                        <span className="text-[10px] text-slate-500 block">
                          {op.metrics.resolutionRate}% taxa
                        </span>
                      </td>

                      {/* Coluna 5: TMR */}
                      <td className="px-4 py-3.5 text-center font-mono">
                        <span className="text-xs font-bold text-amber-300">{op.metrics.avgResponseMinutes}m</span>
                      </td>

                      {/* Coluna 6: Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          op.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          {op.isActive ? "Ativo" : "Pausado"}
                        </span>
                      </td>

                      {/* Coluna 7: Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Botão Espiar Conversa */}
                          <button
                            type="button"
                            onClick={() => handleSpyConversation(op)}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Auditar atendimentos e espiar conversas em tempo real"
                          >
                            <Eye size={13} className="text-purple-400" />
                            <span>Espiar Conversa</span>
                          </button>

                          {/* Botão Editar Permissões */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(op)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                            title="Editar Dados e Permissões"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Botão Pausar/Reativar */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(op)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              op.isActive
                                ? "bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border-slate-700 hover:border-rose-500/30"
                                : "bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-700/50"
                            }`}
                            title={op.isActive ? "Pausar Acesso do Operador" : "Reativar Acesso do Operador"}
                          >
                            <Lock size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CADASTRO DE NOVO OPERADOR */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0B1224] border border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cadastrar Novo Operador de Suporte</h3>
                  <span className="text-[11px] text-slate-400">Atribuição de credenciais e permissões restritas</span>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Caso já tenha sido gerada a credencial */}
            {createdCredentials ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 size={16} />
                    <span>Operador Cadastrado com Sucesso!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    As credenciais foram registradas no sistema. Se o SMTP estiver configurado, o e-mail de boas-vindas foi disparado. Você também pode copiar a senha abaixo:
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">E-mail:</span>
                    <span className="font-mono text-white font-semibold">{createdCredentials.email}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Senha Provisória:</span>
                      <span className="font-mono text-amber-300 font-bold text-sm tracking-wider">{createdCredentials.pass}</span>
                    </div>

                    <button
                      onClick={handleCopyPassword}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedPass ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedPass ? "Copiado!" : "Copiar Senha"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              /* Formulário de Cadastro */
              <form onSubmit={handleCreateOperator} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      Nome Completo do Colaborador *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Lucas Gabriel"
                      className="w-full p-2.5 rounded-xl text-xs bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      E-mail Corporativo *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="lucas@versus.com"
                      className="w-full p-2.5 rounded-xl text-xs bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      Cargo / Função de Atendimento
                    </label>
                    <select
                      value={formData.roleTitle}
                      onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                      className="w-full p-2.5 rounded-xl text-xs bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Atendente de Suporte">Atendente de Suporte (Nível 1)</option>
                      <option value="Analista Pleno de Atendimento">Analista Pleno de Atendimento (Nível 2)</option>
                      <option value="Gerente de Atendimento">Gerente de Atendimento (Supervisão)</option>
                    </select>
                  </div>

                  {/* Matriz de Permissões com Isolamento de Privilégios */}
                  <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2.5">
                    <span className="text-[11px] font-bold text-white flex items-center justify-between">
                      <span>Permissões de Acesso do Operador</span>
                      <span className="text-[10px] text-blue-400 font-normal">Security Boundary Ativo</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.support}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, support: e.target.checked }
                          })}
                          className="accent-blue-600 rounded"
                        />
                        <span>Central Omnichannel</span>
                      </label>

                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.chatInterno}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, chatInterno: e.target.checked }
                          })}
                          className="accent-blue-600 rounded"
                        />
                        <span>Chat Interno da Equipe</span>
                      </label>

                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.metrics}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, metrics: e.target.checked }
                          })}
                          className="accent-blue-600 rounded"
                        />
                        <span>Métricas de Produtividade</span>
                      </label>

                      {/* Itens Bloqueados (Isolamento) */}
                      <label className="flex items-center gap-2 text-slate-500 cursor-not-allowed opacity-60" title="Acesso restrito exclusivamente ao Super Admin Master">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled
                          className="accent-slate-600 rounded cursor-not-allowed"
                        />
                        <span className="flex items-center gap-1">
                          <Lock size={10} />
                          Planos e Faturamento
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Disparo de e-mail */}
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formData.sendEmail}
                      onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                      className="accent-blue-600 rounded"
                    />
                    <span>Disparar e-mail de ativação com credenciais via SMTP real</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    <span>Cadastrar e Ativar</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: EDIÇÃO DE OPERADOR */}
      {isEditModalOpen && selectedOperator && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0B1224] border border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Editar Operador</h3>
                  <span className="text-[11px] text-slate-400">{selectedOperator.name} • {selectedOperator.email}</span>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateOperator} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl text-xs bg-[#070D1B] border border-slate-700 text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl text-xs bg-[#070D1B] border border-slate-700 text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Cargo / Função
                  </label>
                  <select
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl text-xs bg-[#070D1B] border border-slate-700 text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Atendente de Suporte">Atendente de Suporte</option>
                    <option value="Analista Pleno de Atendimento">Analista Pleno de Atendimento</option>
                    <option value="Gerente de Atendimento">Gerente de Atendimento</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Redefinir Senha (opcional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Deixe em branco para manter a senha atual"
                    className="w-full p-2.5 rounded-xl text-xs bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDITORIA ESPIAR CONVERSA EM TEMPO REAL */}
      {isSpyModalOpen && selectedOperator && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[85vh] rounded-2xl bg-[#0B1224] border border-purple-500/40 p-6 shadow-2xl flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header com Banner de Auditoria Invisível */}
            <div className="border-b border-slate-800 pb-3 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 flex items-center justify-center">
                    <Eye size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Auditoria Operacional: Espiar Conversa em Tempo Real</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 uppercase font-mono font-bold">
                        Inspetor Super Admin
                      </span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      Operador monitorado: <strong className="text-purple-300">{selectedOperator.name}</strong> ({selectedOperator.email})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsSpyModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Banner de discrição */}
              <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-purple-400 shrink-0" />
                  <span>
                    <strong>INSPEÇÃO DISCRETA DE GOVERNANÇA:</strong> Nem o operador nem o cliente final são notificados desta visualização.
                  </span>
                </div>
                <span className="text-[10px] text-purple-300/80 font-mono hidden sm:inline">Modo Espião Ativo</span>
              </div>
            </div>

            {/* Conteúdo Principal do Spy Modal (Split View) */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-4 py-3">
              
              {/* Coluna 1: Lista de Chamados deste Operador (col-span-4) */}
              <div className="md:col-span-4 bg-[#070D1B] border border-slate-800 rounded-xl p-3 overflow-y-auto space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block px-1 mb-2">
                  Chamados Ativos do Atendente ({spyData?.activeTickets.length || 0})
                </span>

                {spyLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                    Carregando atendimentos do operador...
                  </div>
                ) : !spyData || spyData.activeTickets.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 px-4">
                    Este operador não possui chamados ativos no momento.
                  </div>
                ) : (
                  spyData.activeTickets.map((t: any, idx: number) => {
                    const isSelected = selectedSpyTicketIndex === idx;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedSpyTicketIndex(idx)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#17253D] border-purple-500/60 shadow-md ring-1 ring-purple-500/30"
                            : "bg-[#0B1224] border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>#{t.ticketNumber}</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                            t.status === "OPEN" ? "text-blue-400 bg-blue-500/10" : "text-amber-400 bg-amber-500/10"
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{t.subject}</h4>
                        <span className="text-[10px] text-slate-400 truncate block">
                          Cliente: {t.tenant?.name || t.user?.name || "Empresa"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Coluna 2: Chat em Tempo Real Auditado (col-span-8) */}
              <div className="md:col-span-8 bg-[#070D1B] border border-slate-800 rounded-xl p-4 flex flex-col justify-between overflow-hidden">
                {spyData?.activeTickets && spyData.activeTickets[selectedSpyTicketIndex] ? (
                  (() => {
                    const ticket = spyData.activeTickets[selectedSpyTicketIndex];
                    return (
                      <>
                        {/* Header do Chamado Inspecionado */}
                        <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-3 shrink-0">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-mono font-bold text-purple-400">#{ticket.ticketNumber}</span>
                              <span className="text-xs font-bold text-white truncate max-w-sm">{ticket.subject}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Empresa: <strong className="text-slate-200">{ticket.tenant?.name || "Cliente"}</strong> • CNPJ: {ticket.tenant?.cnpj || "—"}
                            </span>
                          </div>

                          <Link
                            href={`/super-admin/support?ticketId=${ticket.id}`}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                            title="Abrir diretamente na Central Omnichannel para assumir"
                          >
                            <span>Intervir / Assumir</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        </div>

                        {/* Timeline de Mensagens em Tempo Real */}
                        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar pr-1">
                          {/* Solicitação Original do Cliente */}
                          {ticket.description && (
                            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs space-y-1 mb-2">
                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                                Dúvida Original Registrada pelo Cliente:
                              </span>
                              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {ticket.description}
                              </p>
                            </div>
                          )}

                          {/* Mensagens trocadas */}
                          {ticket.messages && ticket.messages.length > 0 ? (
                            ticket.messages.map((m: any) => {
                              const isInternal = m.isInternal;
                              const isOperator = m.senderRole === "AGENT" || m.senderRole === "SUPER_ADMIN" || m.senderRole === "ADMIN";

                              return (
                                <div
                                  key={m.id}
                                  className={`flex flex-col max-w-[85%] ${
                                    isInternal
                                      ? "mx-auto w-full max-w-lg"
                                      : isOperator
                                      ? "ml-auto items-end"
                                      : "mr-auto items-start"
                                  }`}
                                >
                                  {isInternal ? (
                                    <div className="w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-400">
                                        <span>🔒 NOTA TÉCNICA / CHAT EQUIPE</span>
                                        <span>{new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                                      </div>
                                      <p className="whitespace-pre-wrap">{m.content}</p>
                                    </div>
                                  ) : (
                                    <div
                                      className={`p-3 rounded-2xl text-xs space-y-1 ${
                                        isOperator
                                          ? "bg-blue-600 text-white rounded-br-none"
                                          : "bg-[#0B1224] border border-slate-800 text-slate-100 rounded-bl-none"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                                        <span className="font-bold">{m.sender?.name || (isOperator ? "Atendente" : "Cliente")}</span>
                                        <span>{new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                                      </div>
                                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-12 text-xs text-slate-500">
                              Nenhuma resposta registrada neste chamado ainda.
                            </div>
                          )}
                        </div>

                        {/* Rodapé de Governança */}
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
                          <span>
                            Total de interações: <strong className="text-white">{ticket.messages?.length || 0} mensagens</strong>
                          </span>

                          <span className="text-[11px] font-mono text-purple-400 flex items-center gap-1">
                            <Activity size={13} />
                            Auditoria em Tempo Real Sincronizada
                          </span>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-slate-500 space-y-2">
                    <MessageSquare size={32} className="opacity-30" />
                    <p>Selecione um chamado ao lado para visualizar a conversa em tempo real.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Fechamento do Modal */}
            <div className="flex justify-end pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsSpyModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar Inspeção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
