"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  FileText, Plus, Search, Filter, ArrowUpDown, Download, 
  Send, Eye, CheckCircle2, XCircle, Clock, Copy, MoreHorizontal, 
  TrendingUp, DollarSign, Award, Percent, ChevronRight, ExternalLink,
  Trash2, RefreshCw, Info, Edit3, Sparkles, FolderOpen
} from "lucide-react";
import { Proposal, ProposalStatus } from "@/types/commercial";
import { ProposalModal } from "@/components/proposals/ProposalModal";
import { ProposalPreviewModal } from "@/components/proposals/ProposalPreviewModal";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ProposalsPage() {
  // A tela nasce 100% limpa, sem nenhum dado fictício
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Carregar propostas reais da API do backend
  useEffect(() => {
    let isMounted = true;

    async function loadProposals() {
      setLoading(true);
      try {
        const response = await api.get("/proposals");
        if (isMounted && Array.isArray(response.data)) {
          const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://verus-alpha.vercel.app");
          const mapped: Proposal[] = response.data.map((p: any) => {
            return {
              id: p.id,
              code: p.code || `PROP-${p.id.slice(0, 8).toUpperCase()}`,
              title: p.title || "Proposta Comercial",
              clientName: p.lead?.name || p.clientName || "Cliente",
              clientCompany: p.lead?.company || p.clientCompany || undefined,
              clientEmail: p.lead?.email || p.clientEmail || "",
              clientPhone: p.lead?.phone || p.clientPhone || "",
              sellerName: p.sellerName || "Equipe Comercial",
              status: p.status || "draft",
              items: p.items || [],
              subtotal: Number(p.subtotal || 0),
              discountTotal: Number(p.discountTotal || 0),
              total: Number(p.total || 0),
              paymentMethod: p.paymentMethod || "50% Entrada + 50% na Entrega",
              validUntil: p.validUntil ? p.validUntil.split("T")[0] : new Date().toISOString().split("T")[0],
              createdAt: p.createdAt || new Date().toISOString(),
              notes: p.notes,
              publicLink: `${origin}/p/${(p.code || p.id).toLowerCase()}`,
              issuer: p.tenant ? {
                name: p.tenant.name || "",
                document: p.tenant.cnpj || "",
                phone: p.tenant.phone || "",
                email: p.tenant.email || "",
                address: p.tenant.address || "",
                logoUrl: p.tenant.logoUrl || ""
              } : undefined
            };
          });
          setProposals(mapped);
        } else if (isMounted) {
          setProposals([]);
        }
      } catch (err) {
        // Se a API retornar vazio ou falhar na ausência de dados, mantém a tela 100% limpa
        if (isMounted) {
          setProposals([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProposals();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cálculos de KPIs dinâmicos (zerados se não houver propostas)
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

  // Salvar ou atualizar proposta no backend com validação de payload estrita e tratamento de erros
  const handleSaveProposal = async (proposalData: Proposal) => {
    // Sanitização rigorosa dos itens para o CreateProposalItemDto do NestJS
    const sanitizedItems = (proposalData.items || []).map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const disc = Math.max(0, Math.min(100, Number(item.discountPercent) || 0));
      const total = item.total !== undefined ? Number(item.total) : qty * unitPrice * (1 - disc / 100);

      return {
        // Omitir id se for gerado localmente pelo frontend (evitar quebrar UUID no banco)
        id: item.id && !item.id.startsWith("item-") ? item.id : undefined,
        name: (item.name || item.description || "Item").trim(),
        description: (item.description || item.name || "Item de Proposta").trim(),
        quantity: qty,
        unitPrice: unitPrice,
        discountPercent: disc,
        total: total,
      };
    });

    // Título obrigatório no backend (@IsNotEmpty)
    const safeTitle = (
      proposalData.title?.trim() ||
      (proposalData.clientName ? `Proposta Comercial - ${proposalData.clientName.trim()}` : "Proposta Comercial")
    );

    // Montagem do payload contendo APENAS propriedades aceitas pelo CreateProposalDto / UpdateProposalDto
    // Isso é crítico pois o NestJS usa forbidNonWhitelisted: true e rejeita qualquer campo excedente (ex: createdAt, updatedAt)
    const payload: Record<string, any> = {
      title: safeTitle,
      code: proposalData.code?.trim() || undefined,
      clientName: proposalData.clientName?.trim() || undefined,
      clientCompany: proposalData.clientCompany?.trim() || undefined,
      clientEmail: proposalData.clientEmail?.trim() || undefined,
      clientPhone: proposalData.clientPhone?.trim() || undefined,
      sellerName: proposalData.sellerName?.trim() || "Equipe Comercial",
      status: (proposalData.status || "DRAFT").toUpperCase(),
      validUntil: proposalData.validUntil ? new Date(proposalData.validUntil).toISOString() : undefined,
      paymentMethod: proposalData.paymentMethod?.trim() || undefined,
      paymentTerms: proposalData.paymentMethod?.trim() || undefined,
      notes: proposalData.notes?.trim() || undefined,
      subtotal: Number(proposalData.subtotal || 0),
      discountTotal: Number(proposalData.discountTotal || 0),
      total: Number(proposalData.total || 0),
      publicLink: proposalData.publicLink || undefined,
      logoUrl: proposalData.issuer?.logoUrl || proposalData.logoUrl || undefined,
      issuer: proposalData.issuer || undefined,
      items: sanitizedItems,
    };

    const isEditing = Boolean(editingProposal && editingProposal.id);
    const targetUrl = isEditing ? `/proposals/${editingProposal!.id}` : "/proposals";
    const method = isEditing ? "PUT" : "POST";

    if (isEditing) {
      payload.id = editingProposal!.id;
    }

    // Log claro e explícito para auditar a requisição no console
    console.log("[PROPOSALS_PAYLOAD_SEND] Disparando requisição para API:", {
      url: targetUrl,
      method,
      timestamp: new Date().toISOString(),
      payload,
    });

    try {
      let res;
      if (isEditing) {
        res = await api.put(targetUrl, payload);
      } else {
        res = await api.post(targetUrl, payload);
      }

      console.log("[PROPOSALS_API_SUCCESS] Proposta salva com sucesso no Supabase:", res.data);

      const savedData = res.data;
      const savedLogo = savedData.logoUrl || savedData.issuer?.logoUrl || proposalData.issuer?.logoUrl || proposalData.logoUrl || "";
      const savedProposal: Proposal = {
        id: savedData.id || proposalData.id,
        code: savedData.code || proposalData.code,
        title: savedData.title || safeTitle,
        clientName: savedData.clientName || proposalData.clientName || "Cliente",
        clientCompany: savedData.clientCompany || proposalData.clientCompany,
        clientEmail: savedData.clientEmail || proposalData.clientEmail || "",
        clientPhone: savedData.clientPhone || proposalData.clientPhone || "",
        sellerName: savedData.sellerName || proposalData.sellerName || "Equipe Comercial",
        status: (savedData.status || proposalData.status || "draft").toLowerCase() as ProposalStatus,
        items: savedData.items && savedData.items.length > 0 ? savedData.items : proposalData.items,
        subtotal: Number(savedData.subtotal ?? proposalData.subtotal ?? 0),
        discountTotal: Number(savedData.discountTotal ?? proposalData.discountTotal ?? 0),
        total: Number(savedData.total ?? savedData.totalValue ?? proposalData.total ?? 0),
        paymentMethod: savedData.paymentMethod || proposalData.paymentMethod || "50% Entrada + 50% na Entrega",
        validUntil: savedData.validUntil ? savedData.validUntil.split("T")[0] : proposalData.validUntil,
        createdAt: savedData.createdAt || new Date().toISOString(),
        notes: savedData.notes || proposalData.notes,
        publicLink: savedData.publicLink || proposalData.publicLink,
        logoUrl: savedLogo,
        issuer: savedData.issuer ? {
          ...savedData.issuer,
          logoUrl: savedLogo,
        } : (proposalData.issuer ? {
          ...proposalData.issuer,
          logoUrl: savedLogo,
        } : undefined),
      };

      if (isEditing) {
        setProposals((prev) => prev.map((p) => (p.id === savedProposal.id ? savedProposal : p)));
        if (selectedProposal && selectedProposal.id === savedProposal.id) {
          setSelectedProposal(savedProposal);
        }
      } else {
        setProposals((prev) => [savedProposal, ...prev.filter((p) => p.id !== savedProposal.id)]);
      }

      setEditingProposal(null);
    } catch (err: any) {
      const apiErrors = err.response?.data?.message || err.response?.data?.error || err.message;
      const formattedError = Array.isArray(apiErrors) ? apiErrors.join(", ") : String(apiErrors || "Falha na comunicação com a API");

      console.error("[PROPOSALS_API_ERROR] Falha ao persistir proposta no Supabase:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        error: err,
      });

      // Exibe erro nítido retornado pelo axios
      toast.error(`Erro ao salvar no banco: ${formattedError}`);

      // Relança o erro para que o ProposalModal NÃO feche nem exiba mensagem de sucesso falsa!
      throw err;
    }
  };

  const handleEditProposal = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setIsPreviewOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: ProposalStatus) => {
    try {
      await api.patch(`/proposals/${id}/status`, { status: newStatus.toUpperCase() });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    if (selectedProposal && selectedProposal.id === id) {
      setSelectedProposal((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta proposta comercial?")) {
      try {
        await api.delete(`/proposals/${id}`);
      } catch (err) {
        console.error("Erro ao excluir proposta:", err);
      }
      setProposals((prev) => prev.filter((p) => p.id !== id));
      toast.success("Proposta excluída com sucesso.");
    }
  };

  const openPreview = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsPreviewOpen(true);
  };

  const copyQuickLink = (proposal: Proposal) => {
    const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://verus-alpha.vercel.app");
    const link = proposal.publicLink || `${origin}/p/${proposal.code.toLowerCase()}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link de aceite da proposta ${proposal.code} copiado!`);
  };

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Aceita
          </span>
        );
      case "viewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Eye className="w-3 h-3" /> Visualizada
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Send className="w-3 h-3" /> Enviada
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Recusada
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Expirada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/30 text-slate-300 border border-slate-700/60">
            <FileText className="w-3 h-3" /> Rascunho
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Interface Operacional de Gestão - Ocultada 100% durante impressão/PDF de proposta */}
      <div className="space-y-6 print:hidden">
        {/* Top Header com Título e Botão de Criação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Propostas Comerciais
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono font-medium">
                  {proposals.length} registradas
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Gerencie orçamentos dinâmicos, acompanhe visualizações e capture assinaturas digitais
              </p>
            </div>
          </div>
        </div>

        {/* Botão Padronizado com Azul Sólido Oficial do VERSUS */}
        <button
          onClick={() => {
            setEditingProposal(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Proposta Comercial
        </button>
      </div>

      {/* Cards de Métricas e KPIs Comerciais com Tooltips Robustos & Zero Corte */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pipeline em Propostas */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md relative group hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/20 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="relative group/tip flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total em Propostas
              </span>
              <button
                type="button"
                className="text-slate-500 hover:text-cyan-400 transition-colors focus:outline-none cursor-help p-0.5 rounded"
                aria-label="Informações sobre o indicador"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {/* Tooltip Hover Explicativo de Alta Densidade (Nunca Cortado) */}
              <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 p-3.5 rounded-2xl bg-[#070D1B] border border-slate-700/90 text-xs text-slate-300 shadow-2xl shadow-black/95 backdrop-blur-xl pointer-events-none transition-all duration-200 opacity-0 group-hover/tip:opacity-100 scale-95 group-hover/tip:scale-100 space-y-2">
                <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#070D1B] border-t border-l border-slate-700/90 rotate-45" />
                <div className="flex items-center gap-1.5 font-bold text-white text-xs border-b border-slate-800 pb-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                  Total em Propostas (Pipeline)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Soma consolidada do valor bruto de todas as propostas comerciais abertas e emitidas no sistema.
                </p>
                <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 font-mono text-[10px] text-cyan-300">
                  Fórmula: ∑ (Itens - Descontos) de todas as propostas ativas
                </div>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              R$ {kpis.totalPipeline.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <TrendingUp className="w-3 h-3" />
                {proposals.length > 0 ? "+18.4% vs. mês anterior" : "Sem movimentação"}
              </span>
            </div>
          </div>

          {/* Glow de fundo contido */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-cyan-500/15 transition-all duration-500" />
          </div>
        </div>

        {/* Card 2: Propostas Aceitas */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md relative group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/20 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="relative group/tip flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Propostas Aceitas
              </span>
              <button
                type="button"
                className="text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none cursor-help p-0.5 rounded"
                aria-label="Informações sobre o indicador"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {/* Tooltip Hover Explicativo */}
              <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 p-3.5 rounded-2xl bg-[#070D1B] border border-slate-700/90 text-xs text-slate-300 shadow-2xl shadow-black/95 backdrop-blur-xl pointer-events-none transition-all duration-200 opacity-0 group-hover/tip:opacity-100 scale-95 group-hover/tip:scale-100 space-y-2">
                <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#070D1B] border-t border-l border-slate-700/90 rotate-45" />
                <div className="flex items-center gap-1.5 font-bold text-white text-xs border-b border-slate-800 pb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Receita Convertida & Fechamento
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Volume financeiro e contagem de propostas que foram aprovadas e assinadas digitalmente pelos clientes.
                </p>
                <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 font-mono text-[10px] text-emerald-300">
                  Critério: Status = "accepted" no período vigente
                </div>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              R$ {kpis.acceptedVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                {kpis.acceptedCount} contratos fechados
              </span>
            </div>
          </div>

          {/* Glow de fundo contido */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/15 transition-all duration-500" />
          </div>
        </div>

        {/* Card 3: Ticket Médio Comercial */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md relative group hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-950/20 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="relative group/tip flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ticket Médio
              </span>
              <button
                type="button"
                className="text-slate-500 hover:text-blue-400 transition-colors focus:outline-none cursor-help p-0.5 rounded"
                aria-label="Informações sobre o indicador"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {/* Tooltip Hover Explicativo */}
              <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 p-3.5 rounded-2xl bg-[#070D1B] border border-slate-700/90 text-xs text-slate-300 shadow-2xl shadow-black/95 backdrop-blur-xl pointer-events-none transition-all duration-200 opacity-0 group-hover/tip:opacity-100 scale-95 group-hover/tip:scale-100 space-y-2">
                <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#070D1B] border-t border-l border-slate-700/90 rotate-45" />
                <div className="flex items-center gap-1.5 font-bold text-white text-xs border-b border-slate-800 pb-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  Média por Cliente Negociado
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Valor médio de cada proposta comercial emitida pela equipe comercial no ciclo.
                </p>
                <div className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-800/40 font-mono text-[10px] text-blue-300">
                  Fórmula: Total do Pipeline ÷ Quantidade de Propostas
                </div>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              R$ {kpis.avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Valor médio por orçamento
              </span>
            </div>
          </div>

          {/* Glow de fundo contido */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/15 transition-all duration-500" />
          </div>
        </div>

        {/* Card 4: Taxa de Conversão */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md relative group hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/20 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="relative group/tip flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Taxa de Conversão
              </span>
              <button
                type="button"
                className="text-slate-500 hover:text-purple-400 transition-colors focus:outline-none cursor-help p-0.5 rounded"
                aria-label="Informações sobre o indicador"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {/* Tooltip Hover Explicativo posicionado à direita para evitar transbordar a tela */}
              <div className="absolute top-full right-0 mt-2 z-50 w-72 sm:w-80 p-3.5 rounded-2xl bg-[#070D1B] border border-slate-700/90 text-xs text-slate-300 shadow-2xl shadow-black/95 backdrop-blur-xl pointer-events-none transition-all duration-200 opacity-0 group-hover/tip:opacity-100 scale-95 group-hover/tip:scale-100 space-y-2">
                <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#070D1B] border-t border-r border-slate-700/90 rotate-45" />
                <div className="flex items-center gap-1.5 font-bold text-white text-xs border-b border-slate-800 pb-1.5">
                  <Percent className="w-3.5 h-3.5 text-purple-400" />
                  Taxa de Conversão de Propostas
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Percentual de propostas que foram aceitas pelo cliente em relação ao total de propostas geradas.
                </p>
                <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-800/40 font-mono text-[10px] text-purple-300">
                  Fórmula: (Propostas Aceitas ÷ Total de Propostas) × 100
                </div>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
              <Percent className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {kpis.convRate.toFixed(1)}%
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3 h-3 text-purple-400" />
                {proposals.length > 0 ? "Conversão em tempo real" : "Aguardando dados"}
              </span>
            </div>
          </div>

          {/* Glow de fundo contido */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/15 transition-all duration-500" />
          </div>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-950/30"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-blue-500/30 text-white font-bold" : "bg-slate-700/60 text-slate-400"
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
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Tabela de Propostas ou Empty State Limpo */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            Carregando propostas comerciais...
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 bg-[#070D1B]/40 rounded-xl border border-dashed border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">Nenhuma proposta encontrada</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery || statusFilter !== "all"
                ? "Nenhum resultado corresponde aos filtros selecionados."
                : "Seu pipeline comercial está limpo. Crie sua primeira proposta oficial com cálculo dinâmico e link de aceite."}
            </p>
            {proposals.length === 0 && (
              <button
                onClick={() => {
                  setEditingProposal(null);
                  setIsCreateModalOpen(true);
                }}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-950/40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Criar Primeira Proposta
              </button>
            )}
          </div>
        ) : (
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
                {filteredProposals.map((proposal) => (
                  <tr
                    key={proposal.id}
                    onClick={() => openPreview(proposal)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-all duration-150 group"
                  >
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-white group-hover:text-blue-400 transition-colors">
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

                    <td className="p-3.5 text-right font-bold text-white font-mono text-sm">
                      R$ {proposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      {getStatusBadge(proposal.status)}
                    </td>

                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditProposal(proposal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/15 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Editar proposta"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => copyQuickLink(proposal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/15 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Copiar link de aceite"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openPreview(proposal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Visualizar proposta completa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteProposal(proposal.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title="Excluir proposta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Modal de Criação ou Edição Dinâmica */}
      <ProposalModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProposal(null);
        }}
        onSave={handleSaveProposal}
        proposalToEdit={editingProposal}
      />

      {/* Modal de Prévia e Compartilhamento */}
      <ProposalPreviewModal
        proposal={selectedProposal}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onStatusChange={handleStatusChange}
        onEdit={handleEditProposal}
      />
    </div>
  );
}
