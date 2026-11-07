"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Building2,
  Users,
  Globe,
  Laptop,
  Smartphone,
  MapPin,
  PowerOff,
  Lock,
  Unlock,
  Clock,
  Activity,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Fingerprint,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface SessionItem {
  id: string;
  userId: string;
  tenantId: string;
  ipAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  userAgent: string | null;
  isTrustedDevice: boolean;
  trustedUntil: string | null;
  lastActiveAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isSuperAdmin: boolean;
    avatarUrl: string | null;
    lockedUntil: string | null;
    failedLoginAttempts: number;
  };
  tenant: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

interface AuditLogItem {
  id: string;
  userId: string | null;
  tenantId: string | null;
  email: string;
  userName: string | null;
  tenantName: string | null;
  status: string;
  failReason: string | null;
  ipAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  createdAt: string;
}

export default function SecurityAuditPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"sessions" | "audit">("sessions");
  const [loading, setLoading] = useState(true);
  const [killingId, setKillingId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  // Carrega lista de empresas para o filtro multi-tenant
  useEffect(() => {
    api
      .get("/tenants")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.tenants || [];
        setTenants(list);
      })
      .catch(() => {});
  }, []);

  // Busca dados de telemetria e sessões ativas
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = selectedTenantId !== "ALL" ? { tenantId: selectedTenantId } : {};
      const [sessionsRes, auditRes] = await Promise.all([
        api.get("/auth/admin/sessions", { params }),
        api.get("/auth/admin/audit-logs", { params }),
      ]);
      setSessions(sessionsRes.data || []);
      setAuditLogs(auditRes.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao carregar dados de segurança.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTenantId]);

  // Derrubada Remota de Sessão (Kill Session)
  const handleKillSession = async (session: SessionItem) => {
    const confirm = window.confirm(
      `Deseja derrubar a conexão de ${session.user?.name} (${session.tenant?.name}) imediatamente?`,
    );
    if (!confirm) return;

    setKillingId(session.id);
    try {
      await api.post("/auth/admin/kill-session", { sessionId: session.id });
      toast.success(`Sessão de ${session.user?.name} encerrada remotamente.`);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao derrubar sessão.");
    } finally {
      setKillingId(null);
    }
  };

  // Desbloqueio de Usuário Bloqueado por Força Bruta
  const handleUnlockUser = async (userId: string, userName: string) => {
    setUnlockingId(userId);
    try {
      await api.post("/auth/admin/unlock-user", { userId });
      toast.success(`Usuário ${userName} desbloqueado com sucesso.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao desbloquear usuário.");
    } finally {
      setUnlockingId(null);
    }
  };

  // Filtro de busca textual
  const filteredSessions = useMemo(() => {
    if (!searchTerm) return sessions;
    const term = searchTerm.toLowerCase();
    return sessions.filter((s) => {
      return (
        s.user?.name?.toLowerCase().includes(term) ||
        s.user?.email?.toLowerCase().includes(term) ||
        s.tenant?.name?.toLowerCase().includes(term) ||
        s.ipAddress?.toLowerCase().includes(term) ||
        s.city?.toLowerCase().includes(term) ||
        s.state?.toLowerCase().includes(term)
      );
    });
  }, [sessions, searchTerm]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return auditLogs;
    const term = searchTerm.toLowerCase();
    return auditLogs.filter((l) => {
      return (
        l.email?.toLowerCase().includes(term) ||
        l.userName?.toLowerCase().includes(term) ||
        l.tenantName?.toLowerCase().includes(term) ||
        l.ipAddress?.toLowerCase().includes(term) ||
        l.city?.toLowerCase().includes(term)
      );
    });
  }, [auditLogs, searchTerm]);

  // Contagem de contas bloqueadas
  const lockedUsersCount = useMemo(() => {
    const now = new Date();
    return sessions.filter(
      (s) => s.user?.lockedUntil && new Date(s.user.lockedUntil) > now,
    ).length;
  }, [sessions]);

  // Contagem de dispositivos confiáveis
  const trustedDevicesCount = useMemo(() => {
    return sessions.filter((s) => s.isTrustedDevice).length;
  }, [sessions]);

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const min = Math.floor(diffMs / 60000);
      if (min < 1) return "Agora mesmo";
      if (min === 1) return "Há 1 minuto";
      if (min < 60) return `Há ${min} minutos`;
      const hours = Math.floor(min / 60);
      if (hours === 1) return "Há 1 hora";
      return `Há ${hours} horas`;
    } catch (e) {
      return "Recente";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ================= CABEÇALHO SOC VALLOR ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck size={20} strokeWidth={2} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Central de Segurança SOC & Sessões Ativas
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Monitoramento em Tempo Real
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Auditoria bancária multi-tenant, gestão de conexões ativas, telemetria por IP e derrubada remota.
          </p>
        </div>

        {/* Controles: Filtro Multi-tenant e Botão Atualizar */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="relative">
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-white dark:bg-[#0B1224] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm pr-8"
            >
              <option value="ALL">🏢 Todas as Empresas (Global)</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* ================= 4 CARDS DE MÉTRICAS SOC ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sessões Ativas Agora */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sessões Conectadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {sessions.length}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              ● Ativas agora
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Conexões autenticadas na plataforma
          </p>
        </div>

        {/* Card 2: Dispositivos Confiáveis (30d) */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dispositivos Confiáveis
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Laptop size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {trustedDevicesCount}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              Autorizados
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Computadores pré-autorizados
          </p>
        </div>

        {/* Card 3: Contas Bloqueadas */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Contas Travadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <Lock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {lockedUsersCount}
            </span>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              Anti-Força Bruta
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {lockedUsersCount > 0 ? "Requer liberação pelo Master" : "Nenhum bloqueio ativo"}
          </p>
        </div>

        {/* Card 4: WhatsApp Master de Validação */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              WhatsApp Master 2FA
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <KeyRound size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-black text-slate-900 dark:text-white font-mono">
              (54) 99110-9159
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} />
            Despacho Central Ativo
          </p>
        </div>
      </div>

      {/* ================= ABAS E BUSCA ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "sessions"
                ? "bg-white dark:bg-[#0B1224] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Radio size={14} />
            <span>Sessões Ativas ({sessions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-white dark:bg-[#0B1224] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Clock size={14} />
            <span>Histórico de Auditoria ({auditLogs.length})</span>
          </button>
        </div>

        {/* Input de busca rápida */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail, IP ou cidade..."
            className="w-full bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* ================= ABA 1: SESSÕES ATIVAS ================= */}
      {activeTab === "sessions" && (
        <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Empresa (Tenant)</th>
                  <th className="py-3 px-4">Localização & IP</th>
                  <th className="py-3 px-4">Dispositivo</th>
                  <th className="py-3 px-4">Segurança</th>
                  <th className="py-3 px-4">Atividade</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <ShieldCheck size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      Nenhuma sessão ativa encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => {
                    const isLocked =
                      session.user?.lockedUntil && new Date(session.user.lockedUntil) > new Date();

                    return (
                      <tr
                        key={session.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        {/* Usuário */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
                              {session.user?.avatarUrl ? (
                                <img
                                  src={session.user.avatarUrl}
                                  alt={session.user.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                session.user?.name?.charAt(0).toUpperCase() || "U"
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white truncate">
                                  {session.user?.name || "Sem Nome"}
                                </span>
                                {session.user?.isSuperAdmin && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                    Master
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {session.user?.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Empresa / Tenant */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                            <Building2 size={13} className="text-slate-400" />
                            <span className="truncate max-w-[140px]">
                              {session.tenant?.name || "Empresa"}
                            </span>
                          </div>
                        </td>

                        {/* Localização & IP */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                              <MapPin size={13} className="text-rose-500 shrink-0" />
                              <span>
                                {session.city || "Cidade"}, {session.state || "UF"}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 ml-4.5">
                              {session.ipAddress || "127.0.0.1"}
                            </span>
                          </div>
                        </td>

                        {/* Dispositivo */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {session.device?.toLowerCase().includes("phone") ||
                            session.device?.toLowerCase().includes("android") ? (
                              <Smartphone size={16} className="text-blue-500 shrink-0" />
                            ) : (
                              <Laptop size={16} className="text-blue-500 shrink-0" />
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {session.device || "Computador"}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {session.browser || "Navegador Web"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Segurança */}
                        <td className="py-3.5 px-4">
                          {session.isTrustedDevice ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              <ShieldCheck size={11} />
                              Confiável
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                              Sessão Padrão
                            </span>
                          )}
                        </td>

                        {/* Atividade */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-slate-600 dark:text-slate-400">
                              {formatRelativeTime(session.lastActiveAt || session.createdAt)}
                            </span>
                          </div>
                        </td>

                        {/* Ação */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isLocked && (
                              <button
                                type="button"
                                disabled={unlockingId === session.userId}
                                onClick={() =>
                                  handleUnlockUser(session.userId, session.user.name)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                                title="Liberar conta bloqueada por senha"
                              >
                                <Unlock size={13} />
                                <span>Liberar</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={killingId === session.id}
                              onClick={() => handleKillSession(session)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                              title="Derrubar sessão agora"
                            >
                              <PowerOff size={13} />
                              <span>{killingId === session.id ? "Derrubando..." : "Desconectar"}</span>
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
      )}

      {/* ================= ABA 2: HISTÓRICO DE AUDITORIA ================= */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Resultado</th>
                  <th className="py-3 px-4">Localização & IP</th>
                  <th className="py-3 px-4">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Nenhum registro de auditoria encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isSuccess = log.status === "SUCCESS";
                    const isLocked = log.status === "ACCOUNT_LOCKED";
                    const is2FA = log.status === "2FA_REQUESTED";

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          <div>
                            <span>{log.userName || log.email}</span>
                            <span className="text-[11px] text-slate-400 block font-normal">
                              {log.email}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {log.tenantName || "Empresa"}
                        </td>

                        <td className="py-3 px-4">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={11} />
                              Sucesso
                            </span>
                          ) : isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <Lock size={11} />
                              Conta Bloqueada
                            </span>
                          ) : is2FA ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              <KeyRound size={11} />
                              2FA Solicitado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <AlertTriangle size={11} />
                              Falha de Senha
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[11px]">
                          <span>
                            {log.city || "Brasil"} •{" "}
                            <span className="font-mono text-slate-400">{log.ipAddress}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {log.failReason || "Autenticação aprovada"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

