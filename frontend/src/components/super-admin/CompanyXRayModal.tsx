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
  DollarSign
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface CompanyXRayModalProps {
  tenantId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSupport?: (ticketId: string) => void;
}

export default function CompanyXRayModal({
  tenantId,
  isOpen,
  onClose,
  onNavigateToSupport,
}: CompanyXRayModalProps) {
  const [activeTab, setActiveTab] = useState<"cadastro" | "metricas" | "conexoes" | "chamados">("cadastro");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
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
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Users size={14} className="text-blue-400" /> Operadores & Usuários Cadastrados ({data.users?.length || 0})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                            <th className="pb-2 font-bold">Nome</th>
                            <th className="pb-2 font-bold">E-mail</th>
                            <th className="pb-2 font-bold">Papel</th>
                            <th className="pb-2 font-bold">Cadastrado em</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {data.users?.map((u: any) => (
                            <tr key={u.id} className="hover:bg-slate-800/30">
                              <td className="py-2.5 font-semibold text-white">{u.name}</td>
                              <td className="py-2.5 font-mono text-slate-300">{u.email}</td>
                              <td className="py-2.5">
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 font-semibold uppercase">
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-2.5 text-slate-400">
                                {new Date(u.createdAt).toLocaleDateString("pt-BR")}
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
        <div className="p-4 border-t border-slate-800 bg-[#070D1B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Fechar Raio-X
          </button>
        </div>
      </div>
    </div>
  );
}
