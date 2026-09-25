"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Unlock, 
  PhoneCall, 
  Mail, 
  Users, 
  FileText, 
  Eye, 
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  LogIn
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import CompanyXRayModal from "@/components/super-admin/CompanyXRayModal";
import ResetAdminPasswordModal from "@/components/super-admin/ResetAdminPasswordModal";
import EditCompanyModal from "@/components/super-admin/EditCompanyModal";
import CreateCompanyModal from "@/components/super-admin/CreateCompanyModal";

export default function SuperAdminCompaniesPage() {
  const router = useRouter();

  // Estados de listagem com hidratação instantânea
  const [companies, setCompanies] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("versus_superadmin_companies");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("versus_superadmin_companies");
    }
    return true;
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("versus_superadmin_companies_pag");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return { total: 0, totalPages: 1, limit: 10 };
  });

  // Estados de modais
  const [xRayTenantId, setXRayTenantId] = useState<string | null>(null);
  const [isXRayOpen, setIsXRayOpen] = useState(false);
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);

  const [resetModalData, setResetModalData] = useState<{
    isOpen: boolean;
    tenantId: string | null;
    tenantName: string;
    adminEmail: string;
    adminSavedPassword?: string | null;
  }>({
    isOpen: false,
    tenantId: null,
    tenantName: "",
    adminEmail: "",
    adminSavedPassword: null,
  });

  const [editCompanyData, setEditCompanyData] = useState<{
    isOpen: boolean;
    tenantId: string | null;
    company: any;
  }>({
    isOpen: false,
    tenantId: null,
    company: null,
  });

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCompanies = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params: any = {
        page: String(page),
        limit: "10",
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (planFilter !== "ALL") params.planId = planFilter;

      const res = await api.get("/tenants", { params });
      const data = res.data.data || [];
      const pag = res.data.pagination || { total: 0, totalPages: 1, limit: 10 };
      setCompanies(data);
      setPagination(pag);

      if (typeof window !== "undefined" && page === 1 && !search.trim() && statusFilter === "ALL" && planFilter === "ALL") {
        sessionStorage.setItem("versus_superadmin_companies", JSON.stringify(data));
        sessionStorage.setItem("versus_superadmin_companies_pag", JSON.stringify(pag));
      }
    } catch (err: any) {
      console.error(err);
      if (companies.length === 0) toast.error(err.response?.data?.message || "Erro ao carregar lista de empresas.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, planFilter, companies.length]);

  useEffect(() => {
    const hasInitialData = companies.length > 0 && page === 1 && !search && statusFilter === 'ALL' && planFilter === 'ALL';
    fetchCompanies(hasInitialData);
  }, [fetchCompanies]);

  const handleToggleStatus = async (company: any) => {
    const nextStatus = !company.isActive;
    const actionLabel = nextStatus ? "desbloquear" : "bloquear";
    
    if (!confirm(`Tem certeza que deseja ${actionLabel} o acesso da empresa "${company.name}"?`)) {
      return;
    }

    setTogglingId(company.id);
    try {
      const res = await api.patch(`/tenants/${company.id}/status`, { isActive: nextStatus });
      toast.success(res.data.message || `Empresa ${nextStatus ? "desbloqueada" : "bloqueada"} com sucesso.`);
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, isActive: nextStatus } : c))
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || `Erro ao ${actionLabel} empresa.`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenXRay = (tenantId: string) => {
    setXRayTenantId(tenantId);
    setIsXRayOpen(true);
  };

  const handleOpenResetPassword = (company: any) => {
    setResetModalData({
      isOpen: true,
      tenantId: company.id,
      tenantName: company.name,
      adminEmail: company.adminUser?.email || company.email || "Administrador",
      adminSavedPassword: company.adminUser?.savedPassword || null,
    });
  };

  const handleAccessCompany = (company: any) => {
    localStorage.setItem('versus_target_tenant_id', company.id);
    localStorage.setItem('versus_target_tenant_name', company.name);
    if (company.logoUrl) {
      localStorage.setItem('versus_target_tenant_logo', company.logoUrl);
    } else {
      localStorage.removeItem('versus_target_tenant_logo');
    }
    localStorage.removeItem('versus_active_workspace');
    localStorage.removeItem('versus_scheduled_messages');
    sessionStorage.removeItem('versus_cached_chat');
    window.dispatchEvent(new Event('tenant_switched'));
    toast.success(`Acessando agência "${company.name}" em Modo Suporte...`);
    router.push('/inbox');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Gestão Global de Empresas</h1>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
              {pagination.total} empresas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Controle de acesso, diagnóstico profundo em Raio-X, métricas de conexões e ações administrativas em lote.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateCompanyOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Nova Empresa</span>
          </button>

          <button
            onClick={() => fetchCompanies()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1224] border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-400" : ""} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por Razão Social, CNPJ, e-mail ou telefone..."
            className="w-full bg-[#070D1B] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Filtro de Status */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#070D1B] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500 w-full md:w-auto"
          >
            <option value="ALL">Status: Todos</option>
            <option value="ACTIVE">Apenas Ativas</option>
            <option value="BLOCKED">Apenas Bloqueadas</option>
          </select>

          {/* Filtro de Plano */}
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#070D1B] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500 w-full md:w-auto"
          >
            <option value="ALL">Plano: Todos</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Pro">Pro</option>
            <option value="Basic">Basic</option>
          </select>
        </div>
      </div>

      {/* Tabela de Empresas */}
      <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#070D1B] border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="p-3.5 font-bold">Empresa (Tenant)</th>
                <th className="p-3.5 font-bold">Plano</th>
                <th className="p-3.5 font-bold">Usuários</th>
                <th className="p-3.5 font-bold">Contratos</th>
                <th className="p-3.5 font-bold">Conexões</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold text-right">Ações Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                      <span>Consultando empresas cadastradas no banco...</span>
                    </div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma empresa encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Empresa */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{company.name}</h3>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {company.cnpj || company.email || `ID: ${company.id.slice(0, 8)}...`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plano */}
                    <td className="p-3.5">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 border border-slate-700 uppercase">
                        {company.plan?.name || "Standard"}
                      </span>
                    </td>

                    {/* Usuários */}
                    <td className="p-3.5 font-mono text-slate-300">
                      {company.counts?.users || 0}
                    </td>

                    {/* Contratos */}
                    <td className="p-3.5 font-mono text-slate-300">
                      {company.counts?.contracts || 0}
                    </td>

                    {/* Conexões (WhatsApp e SMTP) */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          title={
                            company.connections?.whatsapp
                              ? `WhatsApp Conectado${company.connections?.whatsappPhone ? ` (${company.connections.whatsappPhone})` : ""}`
                              : "WhatsApp Desconectado"
                          }
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                            company.connections?.whatsapp
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                              : "bg-slate-800/80 text-slate-400 border-slate-700"
                          }`}
                        >
                          {company.connections?.whatsapp && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          )}
                          <PhoneCall size={10} className={company.connections?.whatsapp ? "text-emerald-400" : "text-slate-500"} />
                          <span>WA</span>
                        </span>

                        <span
                          title={company.connections?.smtp ? "SMTP Configurado" : "SMTP Não Configurado"}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                            company.connections?.smtp
                              ? "bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-sm shadow-blue-500/10"
                              : "bg-slate-800/80 text-slate-400 border-slate-700"
                          }`}
                        >
                          <Mail size={10} className={company.connections?.smtp ? "text-blue-400" : "text-slate-500"} />
                          <span>SMTP</span>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        company.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}>
                        {company.isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        <span>{company.isActive ? "Ativo" : "Bloqueado"}</span>
                      </span>
                    </td>

                    {/* Ações Administrativas */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Acessar Agência (Modo Suporte) */}
                        <button
                          onClick={() => handleAccessCompany(company)}
                          title={`Acessar painel e conversas da empresa "${company.name}" (Modo Suporte)`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/60 text-cyan-300 hover:text-white transition-all text-xs font-semibold shadow-sm cursor-pointer"
                        >
                          <LogIn size={12} className="text-cyan-400" />
                          <span>Acessar</span>
                        </button>

                        {/* Botão Raio-X */}
                        <button
                          onClick={() => handleOpenXRay(company.id)}
                          title="Abrir Raio-X Completo"
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#070D1B] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Eye size={12} className="text-blue-400" />
                          <span className="font-semibold">Raio-X</span>
                        </button>

                        {/* Botão Editar */}
                        <button
                          onClick={() => setEditCompanyData({
                            isOpen: true,
                            tenantId: company.id,
                            company: company,
                          })}
                          title="Editar Dados da Empresa"
                          className="p-1.5 rounded bg-[#070D1B] border border-slate-800 hover:border-slate-700 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Botão Redefinir Senha */}
                        <button
                          onClick={() => handleOpenResetPassword(company)}
                          title="Forçar Redefinição de Senha do Administrador"
                          className="p-1.5 rounded bg-[#070D1B] border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <KeyRound size={13} />
                        </button>

                        {/* Botão Bloquear / Desbloquear */}
                        <button
                          onClick={() => handleToggleStatus(company)}
                          disabled={togglingId === company.id}
                          title={company.isActive ? "Bloquear Acesso da Empresa" : "Desbloquear Acesso da Empresa"}
                          className={`p-1.5 rounded border transition-colors ${
                            company.isActive
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {togglingId === company.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : company.isActive ? (
                            <Lock size={13} />
                          ) : (
                            <Unlock size={13} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Paginação */}
        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 bg-[#070D1B] flex items-center justify-between text-xs text-slate-400">
            <span>
              Página {page} de {pagination.totalPages} ({pagination.total} empresas)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modais Integrados */}
      <CompanyXRayModal
        tenantId={xRayTenantId}
        isOpen={isXRayOpen}
        onClose={() => setIsXRayOpen(false)}
        onCompanyUpdated={() => fetchCompanies()}
        onNavigateToSupport={(ticketId) => {
          router.push(`/super-admin/support?ticketId=${ticketId}`);
        }}
      />

      <ResetAdminPasswordModal
        isOpen={resetModalData.isOpen}
        tenantId={resetModalData.tenantId}
        tenantName={resetModalData.tenantName}
        adminEmail={resetModalData.adminEmail}
        currentSavedPassword={resetModalData.adminSavedPassword}
        onClose={() => setResetModalData((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={() => fetchCompanies()}
      />

      <EditCompanyModal
        isOpen={editCompanyData.isOpen}
        tenantId={editCompanyData.tenantId}
        initialData={editCompanyData.company}
        onClose={() => setEditCompanyData((prev) => ({ ...prev, isOpen: false }))}
        onCompanyUpdated={() => fetchCompanies()}
      />

      <CreateCompanyModal
        isOpen={isCreateCompanyOpen}
        onClose={() => setIsCreateCompanyOpen(false)}
        onCompanyCreated={() => fetchCompanies()}
      />
    </div>
  );
}
