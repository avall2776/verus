"use client";

import React, { useState, useMemo } from "react";
import { 
  FileText, Plus, Search, Filter, ArrowUpDown, Download, 
  Send, Eye, CheckCircle2, XCircle, Clock, Copy, MoreHorizontal, 
  TrendingUp, DollarSign, Award, Percent, ChevronRight, ExternalLink,
  Trash2, RefreshCw
} from "lucide-react";
import { Proposal, ProposalStatus } from "@/types/commercial";
import { ProposalModal } from "@/components/proposals/ProposalModal";
import { ProposalPreviewModal } from "@/components/proposals/ProposalPreviewModal";
import toast from "react-hot-toast";

// Mocks realistas para demonstração imediata
const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: "prop-1",
    code: "PROP-2026-1042",
    title: "Implantação VERSUS Enterprise & Omnichannel WhatsApp",
    clientName: "Roberto Alencar",
    clientCompany: "Nexus Logística e Transportes",
    clientEmail: "roberto@nexuslog.com.br",
    clientPhone: "(11) 98765-4321",
    sellerName: "Ana Paula Mendes",
    status: "accepted",
    items: [
      { id: "i1", name: "Licença VERSUS Enterprise (20 operadores)", quantity: 1, unitPrice: 9600, total: 9600 },
      { id: "i2", name: "Setup e Integração ERP Protheus", quantity: 1, unitPrice: 4500, total: 4500 }
    ],
    subtotal: 14100,
    discountTotal: 1100,
    total: 13000,
    paymentMethod: "50% Entrada + 50% na Entrega",
    validUntil: "2026-09-30",
    createdAt: "2026-09-10T10:30:00Z",
    publicLink: "https://app.versus.com.br/p/prop-2026-1042"
  },
  {
    id: "prop-2",
    code: "PROP-2026-1043",
    title: "Agentes de Inteligência Artificial & Automação de SDR",
    clientName: "Fernanda Takahashi",
    clientCompany: "Inovare Odontologia Digital",
    clientEmail: "fernanda@inovare.odo.br",
    clientPhone: "(11) 97123-8899",
    sellerName: "Lucas Fontes",
    status: "viewed",
    items: [
      { id: "i3", name: "Agente IA Triagem & Qualificação 24/7", quantity: 2, unitPrice: 3200, total: 6400 },
      { id: "i4", name: "Treinamento de RAG & Base de Conhecimento", quantity: 1, unitPrice: 2800, total: 2800 }
    ],
    subtotal: 9200,
    discountTotal: 0,
    total: 9200,
    paymentMethod: "Recorrência Mensal (SaaS)",
    validUntil: "2026-09-28",
    createdAt: "2026-09-12T14:15:00Z",
    publicLink: "https://app.versus.com.br/p/prop-2026-1043"
  },
  {
    id: "prop-3",
    code: "PROP-2026-1044",
    title: "Upgrade Plano Pro e Disparador de Campanhas",
    clientName: "Marcelo Dantas",
    clientCompany: "Dantas & Filhos Advocacia",
    clientEmail: "contato@dantasadv.com",
    clientPhone: "(21) 99881-2244",
    sellerName: "Gabriel Sampaio",
    status: "sent",
    items: [
      { id: "i5", name: "Módulo Broadcast & Campanhas em Massa", quantity: 1, unitPrice: 3500, total: 3500 },
      { id: "i6", name: "Consultoria de Warm-up de Chips WhatsApp", quantity: 1, unitPrice: 1500, total: 1500 }
    ],
    subtotal: 5000,
    discountTotal: 500,
    total: 4500,
    paymentMethod: "3x no Boleto Faturado",
    validUntil: "2026-09-25",
    createdAt: "2026-09-14T09:00:00Z",
    publicLink: "https://app.versus.com.br/p/prop-2026-1044"
  },
  {
    id: "prop-4",
    code: "PROP-2026-1045",
    title: "Pacote de Transição de CRM & Migração de Dados",
    clientName: "Juliana Camargo",
    clientCompany: "Camargo & Barros Construtora",
    clientEmail: "juliana@camargobarros.com.br",
    clientPhone: "(31) 98455-7711",
    sellerName: "Ana Paula Mendes",
    status: "draft",
    items: [
      { id: "i7", name: "Higienização e Importação de 45.000 Leads", quantity: 1, unitPrice: 4200, total: 4200 },
      { id: "i8", name: "Configuração de Funis Personalizados", quantity: 3, unitPrice: 1200, total: 3600 }
    ],
    subtotal: 7800,
    discountTotal: 800,
    total: 7000,
    paymentMethod: "À Vista com 5% de Desconto",
    validUntil: "2026-10-05",
    createdAt: "2026-09-15T11:45:00Z",
    publicLink: "https://app.versus.com.br/p/prop-2026-1045"
  }
];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    const totalPipeline = proposals.reduce((acc, curr) => acc + curr.total, 0);
    const accepted = proposals.filter((p) => p.status === "accepted");
    const acceptedVal = accepted.reduce((acc, curr) => acc + curr.total, 0);
    const totalCount = proposals.length;
    const acceptedCount = accepted.length;
    const avgTicket = totalCount > 0 ? totalPipeline / totalCount : 0;
    const convRate = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;

    return {
      totalPipeline,
      acceptedVal,
      totalCount,
      acceptedCount,
      avgTicket,
      convRate
    };
  }, [proposals]);

  // Filtros de listagem
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.code.toLowerCase().includes(query) ||
        p.clientName.toLowerCase().includes(query) ||
        (p.clientCompany && p.clientCompany.toLowerCase().includes(query)) ||
        p.sellerName.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [proposals, statusFilter, searchQuery]);

  // Manipulação de estados
  const handleCreateProposal = (newProposal: Proposal) => {
    setProposals((prev) => [newProposal, ...prev]);
  };

  const handleStatusChange = (id: string, newStatus: ProposalStatus) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    if (selectedProposal && selectedProposal.id === id) {
      setSelectedProposal((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteProposal = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta proposta?")) {
      setProposals((prev) => prev.filter((p) => p.id !== id));
      toast.success("Proposta excluída com sucesso.");
    }
  };

  const openPreview = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsPreviewOpen(true);
  };

  const copyQuickLink = (proposal: Proposal) => {
    const link = proposal.publicLink || `https://app.versus.com.br/p/${proposal.code.toLowerCase()}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link de aceite da proposta ${proposal.code} copiado!`);
  };

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Aceita
          </span>
        );
      case "viewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Eye className="w-3 h-3" /> Visualizada
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Send className="w-3 h-3" /> Enviada
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Recusada
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Expirada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <FileText className="w-3 h-3" /> Rascunho
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header com Título e Botão de Criação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Propostas Comerciais
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-medium">
                  {proposals.length} registradas
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Gerencie orçamentos dinâmicos, acompanhe visualizações e capture assinaturas digitais
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nova Proposta Comercial
        </button>
      </div>

      {/* Cards de Métricas e KPIs Comerciais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pipeline em Propostas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total em Propostas
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">
              R$ {kpis.totalPipeline.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs. mês anterior</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all pointer-events-none" />
        </div>

        {/* Card 2: Propostas Aceitas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Propostas Aceitas
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">
              R$ {kpis.acceptedVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
              <span className="text-emerald-400 font-bold">{kpis.acceptedCount} contratos</span>
              <span>fechados neste ciclo</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
        </div>

        {/* Card 3: Ticket Médio Comercial */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">
              R$ {kpis.avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
              <span>Média por cliente negociado</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
        </div>

        {/* Card 4: Taxa de Conversão */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Taxa de Conversão
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">
              {kpis.convRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Alta performance de fechamento</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />
        </div>
      </div>

      {/* Barra de Filtros & Abas de Status */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Abas de Status */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "Todas" },
              { id: "draft", label: "Rascunhos" },
              { id: "sent", label: "Enviadas" },
              { id: "viewed", label: "Visualizadas" },
              { id: "accepted", label: "Aceitas" },
              { id: "declined", label: "Recusadas" }
            ].map((tab) => {
              const count =
                tab.id === "all"
                  ? proposals.length
                  : proposals.filter((p) => p.status === tab.id).length;
              const isActive = statusFilter === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-cyan-500/30 text-white" : "bg-slate-700/60 text-slate-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Busca por cliente ou código */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, código ou vendedor..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Tabela de Propostas */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Código / Proposta</th>
                <th className="p-3.5">Cliente / Empresa</th>
                <th className="p-3.5">Vendedor</th>
                <th className="p-3.5">Validade</th>
                <th className="p-3.5 text-right">Valor Total</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma proposta encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr
                    key={proposal.id}
                    onClick={() => openPreview(proposal)}
                    className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
                  >
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {proposal.code}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                        {proposal.title}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">
                        {proposal.clientName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {proposal.clientCompany || proposal.clientPhone}
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-300">
                      {proposal.sellerName}
                    </td>

                    <td className="p-3.5 text-slate-400 font-mono">
                      {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}
                    </td>

                    <td className="p-3.5 text-right font-bold text-white font-mono">
                      R$ {proposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      {getStatusBadge(proposal.status)}
                    </td>

                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyQuickLink(proposal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          title="Copiar link de aceite"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openPreview(proposal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Visualizar proposta completa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteProposal(proposal.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Excluir proposta"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal de Criação Dinâmica */}
      <ProposalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateProposal}
      />

      {/* Modal de Prévia e Compartilhamento */}
      <ProposalPreviewModal
        proposal={selectedProposal}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
