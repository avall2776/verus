"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  Users, 
  PhoneCall, 
  Mail, 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Headphones, 
  ExternalLink,
  ShieldAlert,
  Loader2,
  FileText,
  DollarSign,
  Edit2,
  KeyRound,
  Trash2,
  RefreshCw,
  Check,
  Copy,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import EditCompanyModal from "./EditCompanyModal";

interface CompanyXRayModalProps {
  tenantId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSupport?: (ticketId: string) => void;
  onCompanyUpdated?: (updated: any) => void;
}

export default function CompanyXRayModal({
  tenantId,
  isOpen,
  onClose,
  onNavigateToSupport,
  onCompanyUpdated,
}: CompanyXRayModalProps) {
  const [activeTab, setActiveTab] = useState<"cadastro" | "metricas" | "conexoes" | "chamados">("cadastro");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados para Gestão de Usuários / Operadores
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [passwordUser, setPasswordUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

  // Visualização de senhas salvas
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Formulário de Edição
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "AGENT",
    isActive: true,
  });
  const [userSaving, setUserSaving] = useState(false);

  // Formulário de Redefinição de Senha
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [sendEmailCheckbox, setSendEmailCheckbox] = useState(true);
  const [passwordResetting, setPasswordResetting] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    temporaryPassword: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Estado de Exclusão
  const [userDeleting, setUserDeleting] = useState(false);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !tenantId) return;

    setUserSaving(true);
    try {
      const res = await api.patch(`/tenants/${tenantId}/users/${editingUser.id}`, {
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        isActive: userFormData.isActive,
      });

      const updatedUser = res.data.user;

      setData((prev: any) => {
        if (!prev) return prev;
        const updatedUsers = (prev.users || []).map((u: any) =>
          u.id === editingUser.id ? { ...u, ...updatedUser } : u
        );
        return { ...prev, users: updatedUsers };
      });

      toast.success(res.data.message || "Usuário atualizado com sucesso!");
      setEditingUser(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao atualizar usuário.");
    } finally {
      setUserSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordUser || !tenantId) return;

    setPasswordResetting(true);
    try {
      const trimmedPass = newPasswordInput.trim();
      const res = await api.post(`/tenants/${tenantId}/users/${passwordUser.id}/reset-password`, {
        newPassword: trimmedPass || undefined,
        sendEmail: sendEmailCheckbox,
      });

      const effectivePassword = res.data.savedPassword || res.data.temporaryPassword;

      setGeneratedResult({
        temporaryPassword: effectivePassword,
        emailSent: res.data.emailSent,
        emailError: res.data.emailError,
      });

      // Atualiza o estado da tabela imediatamente com a nova senha gravada
      setData((prev: any) => {
        if (!prev) return prev;
        const updatedUsers = (prev.users || []).map((u: any) =>
          u.id === passwordUser.id ? { ...u, savedPassword: effectivePassword } : u
        );
        return { ...prev, users: updatedUsers };
      });

      setPasswordUser((prev: any) => (prev ? { ...prev, savedPassword: effectivePassword } : null));

      toast.success("Senha gravada e atualizada com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao redefinir senha.");
    } finally {
      setPasswordResetting(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser || !tenantId) return;

    setUserDeleting(true);
    try {
      const res = await api.delete(`/tenants/${tenantId}/users/${deletingUser.id}`);

      setData((prev: any) => {
        if (!prev) return prev;
        const remainingUsers = (prev.users || []).filter((u: any) => u.id !== deletingUser.id);
        const currentTotal = prev.metrics?.totalUsers || 0;
        return {
          ...prev,
          users: remainingUsers,
          metrics: {
            ...prev.metrics,
            totalUsers: Math.max(0, currentTotal - 1),
          },
        };
      });

      toast.success(res.data.message || "Usuário removido com sucesso!");
      setDeletingUser(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao excluir usuário.");
    } finally {
      setUserDeleting(false);
    }
  };


  useEffect(() => {
    if (!isOpen || !tenantId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tenants/${tenantId}`);
        setData(res.data);
      } catch (err: any) {
        console.error(err);
        toast.error("Erro ao carregar detalhes da empresa.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, tenantId]);

  if (!isOpen || !tenantId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#070D1B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  {loading ? "Carregando Raio-X..." : data?.company?.name || "Empresa"}
                </h2>
                {data?.company && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    data.company.isActive 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}>
                    {data.company.isActive ? "Ativa" : "Bloqueada"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Diagnóstico detalhado, saúde operacional e histórico de suporte.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors shadow-sm"
              title="Editar Dados Cadastrais da Empresa"
            >
              <Edit2 size={13} />
              <span>Editar Dados</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-[#070D1B]">
          {[
            { key: "cadastro", label: "Dados Cadastrais", icon: Building2 },
            { key: "metricas", label: "Métricas & Uso", icon: Activity },
            { key: "conexoes", label: "Conexões (WhatsApp & SMTP)", icon: PhoneCall },
            { key: "chamados", label: `Chamados (${data?.recentTickets?.length || 0})`, icon: Headphones },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.key
                  ? "text-blue-400 border-blue-500 bg-blue-600/10 rounded-t"
                  : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <span className="text-sm font-medium">Extraindo telemetria e dados do banco...</span>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Não foi possível carregar os dados desta empresa.
            </div>
          ) : (
            <>
              {/* ABA 1: DADOS CADASTRAIS */}
              {activeTab === "cadastro" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-3">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <Building2 size={14} /> Identificação Fiscal & Cadastral
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Razão Social / Nome Fantasia:</span>
                          <span className="font-semibold text-white">{data.company.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">CNPJ / CPF:</span>
                          <span className="font-mono text-slate-200">{data.company.cnpj || "Não informado"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Identificador do Tenant (UUID):</span>
                          <span className="font-mono text-[11px] text-slate-300 select-all bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {data.company.id}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Data de Entrada no Sistema:</span>
                          <span className="text-slate-200">
                            {new Date(data.company.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-3">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <Mail size={14} /> Contato & Localização
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">E-mail Corporativo:</span>
                          <span className="font-semibold text-white">{data.company.email || "Não informado"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Telefone Principal:</span>
                          <span className="text-slate-200">{data.company.phone || "Não informado"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Endereço Completo:</span>
                          <span className="text-slate-300">{data.company.address || "Endereço não cadastrado"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Plano Contratado:</span>
                          <span className="font-bold text-blue-400 bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase text-[10px]">
                            {data.company.plan?.name || "Standard"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usuários Cadastrados */}
                  <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} className="text-blue-400" /> Operadores & Usuários Cadastrados ({data.users?.length || 0})
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Gestão de acessos, credenciais e permissões do tenant
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                            <th className="pb-2 font-bold">Nome</th>
                            <th className="pb-2 font-bold">E-mail</th>
                            <th className="pb-2 font-bold">Papel</th>
                            <th className="pb-2 font-bold">Status</th>
                            <th className="pb-2 font-bold">Senha de Acesso</th>
                            <th className="pb-2 font-bold">Cadastrado em</th>
                            <th className="pb-2 font-bold text-right pr-2">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {data.users?.map((u: any) => (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 font-semibold text-white">{u.name}</td>
                              <td className="py-2.5 font-mono text-slate-300">{u.email}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  u.role === "ADMIN" || u.role === "SUPER_ADMIN"
                                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/30"
                                    : "bg-slate-800 text-slate-300 border border-slate-700/50"
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                                  u.isActive !== false
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                }`}>
                                  {u.isActive !== false ? "Ativo" : "Bloqueado"}
                                </span>
                              </td>
                              {/* Senha de Acesso */}
                              <td className="py-2.5">
                                {u.savedPassword ? (
                                  <div className="inline-flex items-center gap-1.5 bg-[#070D1B] border border-slate-800 px-2 py-1 rounded-lg">
                                    <span className="font-mono text-[11px] text-slate-200">
                                      {revealedPasswords[u.id] ? u.savedPassword : "••••••••"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleRevealPassword(u.id)}
                                      title={revealedPasswords[u.id] ? "Ocultar senha" : "Ver senha salva"}
                                      className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
                                    >
                                      {revealedPasswords[u.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(u.savedPassword);
                                        toast.success(`Senha de ${u.name} copiada!`);
                                      }}
                                      title="Copiar senha"
                                      className="text-slate-400 hover:text-blue-400 p-0.5 transition-colors cursor-pointer"
                                    >
                                      <Copy size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <span 
                                    className="text-slate-500 font-mono text-[11px] inline-flex items-center gap-1"
                                    title="Senha protegida unidirecional. Redefina na chave para deixá-la visível permanentemente."
                                  >
                                    •••••••• <span className="text-[9px] text-amber-500/70">(redefinir p/ ver)</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 text-slate-400">
                                {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="py-2.5 text-right pr-2">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    title="Editar Dados do Operador"
                                    onClick={() => {
                                      setEditingUser(u);
                                      setUserFormData({
                                        name: u.name || "",
                                        email: u.email || "",
                                        role: u.role || "AGENT",
                                        isActive: u.isActive !== false,
                                      });
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/50"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Redefinir / Ver Senha de Acesso"
                                    onClick={() => {
                                      setPasswordUser(u);
                                      setNewPasswordInput("");
                                      setShowCurrentPassword(false);
                                      setGeneratedResult(null);
                                      setCopiedPass(false);
                                      setSendEmailCheckbox(true);
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 transition-colors border border-slate-700/50"
                                  >
                                    <KeyRound size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Excluir Usuário"
                                    onClick={() => setDeletingUser(u)}
                                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors border border-slate-700/50"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: MÉTRICAS & USO */}
              {activeTab === "metricas" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Operadores</span>
                      <p className="text-2xl font-black text-white mt-1 font-mono">{data.metrics.totalUsers}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Contatos (Leads)</span>
                      <p className="text-2xl font-black text-white mt-1 font-mono">{data.metrics.totalContacts}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Deals no CRM</span>
                      <p className="text-2xl font-black text-white mt-1 font-mono">{data.metrics.totalDeals}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block uppercase">Contratos Emitidos</span>
                      <p className="text-2xl font-black text-white mt-1 font-mono">{data.metrics.totalContracts}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300 block uppercase">Contratos Assinados & Faturamento</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-400 font-mono">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.metrics.signedContractsValue || 0)}
                        </span>
                        <span className="text-xs text-slate-400">({data.metrics.signedContracts} assinados)</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Volume financeiro gerado e formalizado através dos módulos de propostas e contratos.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300 block uppercase">Pipeline Ativo no CRM</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-400 font-mono">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.metrics.dealsValue || 0)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Total de negócios em negociação pelas equipes de vendas da empresa.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: DIAGNÓSTICO DE CONEXÕES */}
              {activeTab === "conexoes" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card WhatsApp */}
                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <PhoneCall size={14} className="text-emerald-400" /> WhatsApp Cloud API
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          data.diagnostics.whatsapp.connected
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          {data.diagnostics.whatsapp.connected ? "Conectado" : "Não Configurado"}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Phone Number ID:</span>
                          <span className="font-mono text-slate-200">
                            {data.diagnostics.whatsapp.phoneNumberId || "Não vinculado"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Instâncias Cadastradas:</span>
                          <span className="text-slate-200">
                            {data.diagnostics.whatsapp.instances?.length || 0} instância(s) ativa(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card SMTP */}
                    <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Mail size={14} className="text-blue-400" /> Transporte de E-mail (SMTP)
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          data.diagnostics.smtp.configured
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          {data.diagnostics.smtp.configured ? "Configurado" : "Padrão / Não Ativo"}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Provedor / Tipo:</span>
                          <span className="font-semibold text-slate-200 uppercase">
                            {data.diagnostics.smtp.provider}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">E-mail Remetente:</span>
                          <span className="font-mono text-slate-200">
                            {data.diagnostics.smtp.fromEmail || "Envio via fallback do sistema"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Servidor Host:</span>
                          <span className="font-mono text-slate-300">
                            {data.diagnostics.smtp.host || "SMTP Global"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: HISTÓRICO DE CHAMADOS */}
              {activeTab === "chamados" && (
                <div className="space-y-4">
                  {data.recentTickets?.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                      <Headphones size={32} className="mx-auto text-slate-500 mb-2" />
                      <p className="text-sm font-semibold text-white">Nenhum chamado aberto por esta empresa</p>
                      <p className="text-xs text-slate-400 mt-1">Quando os operadores abrirem tickets na Central de Suporte, eles brotarão aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.recentTickets?.map((ticket: any) => (
                        <div 
                          key={ticket.id}
                          className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-blue-400 font-bold">
                                #{ticket.ticketNumber}
                              </span>
                              <h4 className="text-xs font-bold text-white">{ticket.subject}</h4>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                ticket.status === "OPEN" 
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : ticket.status === "RESOLVED"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Aberto por: <span className="text-slate-300 font-medium">{ticket.requester}</span> • {ticket.messagesCount} mensagem(ns)
                            </p>
                          </div>

                          {onNavigateToSupport && (
                            <button
                              onClick={() => {
                                onClose();
                                onNavigateToSupport(ticket.id);
                              }}
                              className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 px-2.5 py-1 rounded transition-colors"
                            >
                              <span>Atender</span>
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#070D1B] flex items-center justify-between">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors"
          >
            <Edit2 size={14} />
            <span>Editar Informações da Empresa</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Fechar Raio-X
          </button>
        </div>
      </div>

      {/* Modal de Edição de Dados da Empresa */}
      <EditCompanyModal
        isOpen={isEditModalOpen}
        tenantId={tenantId}
        initialData={data?.company}
        onClose={() => setIsEditModalOpen(false)}
        onCompanyUpdated={(updated) => {
          setData((prev: any) => prev ? {
            ...prev,
            company: {
              ...prev.company,
              ...updated,
            }
          } : prev);
          if (onCompanyUpdated) {
            onCompanyUpdated(updated);
          }
        }}
      />

      {/* Sub-modal: Editar Dados do Usuário */}
      {editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#070D1B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Editar Operador</h3>
                  <p className="text-[11px] text-slate-400">{editingUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  placeholder="Ex: Ana Clara Lima"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                  placeholder="usuario@empresa.com.br"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nível de Acesso (ROLE)
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
                  >
                    <option value="ADMIN">Administrador (ADMIN)</option>
                    <option value="AGENT">Atendente (AGENT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Status da Conta
                  </label>
                  <select
                    value={userFormData.isActive ? "true" : "false"}
                    onChange={(e) => setUserFormData({ ...userFormData, isActive: e.target.value === "true" })}
                    className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-all"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors"
                >
                  {userSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Redefinir Senha do Usuário */}
      {passwordUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#070D1B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Redefinir Senha de Acesso</h3>
                  <p className="text-[11px] text-slate-400">{passwordUser.name} ({passwordUser.email})</p>
                </div>
              </div>
              <button 
                onClick={() => { setPasswordUser(null); setGeneratedResult(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!generatedResult ? (
                <>
                  {/* Visualização da Senha Atual Cadastrada para Testes Imediatos */}
                  {passwordUser.savedPassword ? (
                    <div className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Senha Atual Salva
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                          Pronta para Acesso / Testes
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-[#0B1224] p-2.5 rounded-lg border border-slate-800">
                        <span className="font-mono text-xs font-bold text-slate-100 tracking-wider">
                          {showCurrentPassword ? passwordUser.savedPassword : "••••••••••••"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            title={showCurrentPassword ? "Ocultar senha" : "Ver senha salva"}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(passwordUser.savedPassword);
                              toast.success("Senha copiada para a área de transferência!");
                            }}
                            title="Copiar senha atual"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Você pode copiar a senha acima para fazer login e testes imediatamente, sem precisar redefini-la.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 flex items-start gap-2">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                      <span>
                        Este usuário possui senha protegida anterior. Digite ou gere uma nova senha abaixo para gravá-la e torná-la visível permanentemente para seus testes.
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Defina manualmente uma nova senha para o operador ou clique em <strong className="text-white">Gerar Automática</strong>.
                  </p>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Nova Senha (Manual ou Automática)
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewPasswordInput(`Versus@${Math.floor(100000 + Math.random() * 900000)}`)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                      >
                        <RefreshCw size={11} /> Gerar Automática
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Digite a senha que você desejar (ex: minhaSenha123)"
                      className="w-full bg-[#070D1B] border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#070D1B] border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={sendEmailCheckbox}
                      onChange={(e) => setSendEmailCheckbox(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">Disparar e-mail com credenciais via SMTP</span>
                      <span className="text-[11px] text-slate-400 block leading-normal">
                        Envia as instruções de acesso diretamente para <strong className="text-slate-300">{passwordUser.email}</strong> via servidor SMTP real (Gmail/Hostinger).
                      </span>
                    </div>
                  </label>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setPasswordUser(null); setNewPasswordInput(""); setShowCurrentPassword(false); }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={passwordResetting}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      {passwordResetting ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      <span>Confirmar Nova Senha</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>Senha atualizada e gravada com sucesso no banco de dados!</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#070D1B] border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                      Nova Senha Gravada:
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-[#0B1224] p-3 rounded-lg border border-slate-800">
                      <span className="font-mono text-sm font-bold text-blue-400 tracking-wider">
                        {generatedResult.temporaryPassword}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedResult.temporaryPassword);
                          setCopiedPass(true);
                          toast.success("Senha copiada para a área de transferência!");
                          setTimeout(() => setCopiedPass(false), 2500);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors cursor-pointer"
                      >
                        {copiedPass ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copiedPass ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>

                  {generatedResult.emailSent ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <Mail size={13} /> E-mail de notificação com a nova senha enviado via SMTP para <strong>{passwordUser.email}</strong>.
                    </p>
                  ) : sendEmailCheckbox ? (
                    <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
                      <AlertTriangle size={13} /> O e-mail não pôde ser disparado ({generatedResult.emailError || "SMTP não configurado"}). Forneça a senha provisória acima diretamente ao operador.
                    </p>
                  ) : null}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordUser(null);
                        setGeneratedResult(null);
                        setNewPasswordInput("");
                        setShowCurrentPassword(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Exclusão Segura de Usuário */}
      {deletingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-[#0B1224] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#070D1B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Excluir Usuário do Tenant</h3>
                  <p className="text-[11px] text-slate-400">Ação irreversível no banco de dados</p>
                </div>
              </div>
              <button 
                onClick={() => setDeletingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span>
                  Tem certeza que deseja apagar permanentemente o usuário <strong className="text-white">{deletingUser.name}</strong> ({deletingUser.email})?
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Esta operação removerá o operador de forma segura no Prisma/Supabase, desvinculando automaticamente tickets de suporte em aberto e negociações associadas.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteUser}
                  disabled={userDeleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors shadow-lg shadow-rose-600/20"
                >
                  {userDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>Sim, Excluir Usuário</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

