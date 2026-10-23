"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, Download, MoreHorizontal, Mail, Phone, 
  ChevronLeft, ChevronRight, X, ExternalLink, MessageSquare, 
  DollarSign, CheckCircle2, Clock, Flame, Snowflake, 
  ShieldCheck, Eye, Plus, ArrowUpDown, Tag as TagIcon,
  Users, RefreshCw, UserCheck, Briefcase, AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import ModalPortal from "@/components/ui/ModalPortal";
import toast from "react-hot-toast";

interface DealItem {
  id: string;
  title: string;
  status: string;
  value: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Contact {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  source: string;
  avatarUrl?: string | null;
  tags: string[];
  statusCategory?: 'won' | 'hot' | 'cold' | 'lost' | 'collaborator' | 'partner';
  isClient?: boolean;
  dealsCount?: number;
  totalWonValue?: number;
  totalActivePipelineValue?: number;
  deals?: DealItem[];
  lastActive: string;
  createdAt?: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const { isWhatsApp, theme } = useTheme();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, won, hot, cold, lost, collaborator, partner
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dealsFilter, setDealsFilter] = useState<string>("all"); // all, with_deals, without_deals
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modal de Detalhes do Lead
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [savingTags, setSavingTags] = useState(false);

  const fetchContacts = () => {
    setLoading(true);
    api.get('/contacts')
      .then(res => {
        setContacts(res.data);
        setError(false);
      })
      .catch(err => {
        console.error("Erro ao carregar contatos", err);
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContacts();
  }, [router]);

  // Lista de origens únicas para o filtro
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach(c => {
      if (c.source) set.add(c.source);
    });
    return Array.from(set).sort();
  }, [contacts]);

  // Métricas agregadas para os cards superiores
  const metrics = useMemo(() => {
    let clientsCount = 0;
    let totalWonRevenue = 0;
    let hotCount = 0;
    let totalPipelineValue = 0;
    let coldCount = 0;

    contacts.forEach(c => {
      const isClient = c.isClient || c.statusCategory === 'won' || c.tags.includes('Cliente');
      if (isClient) {
        clientsCount++;
        totalWonRevenue += Number(c.totalWonValue) || 0;
      } else if (c.statusCategory === 'hot' || c.tags.includes('Quente')) {
        hotCount++;
        totalPipelineValue += Number(c.totalActivePipelineValue) || 0;
      } else if (c.statusCategory === 'cold' || c.tags.includes('Frio')) {
        coldCount++;
      }
    });

    return {
      total: contacts.length,
      clientsCount,
      totalWonRevenue,
      hotCount,
      totalPipelineValue,
      coldCount
    };
  }, [contacts]);

  // Filtragem dos contatos
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // 1. Busca textual (nome, telefone, email, id)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = contact.name?.toLowerCase().includes(query);
        const matchesPhone = contact.phone?.toLowerCase().includes(query);
        const matchesEmail = contact.email?.toLowerCase().includes(query);
        const matchesId = contact.id?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesId) {
          return false;
        }
      }

      // 2. Filtro de Status / Carteira
      if (statusFilter !== "all") {
        if (statusFilter === "won") {
          const isClient = contact.isClient || contact.statusCategory === 'won' || contact.tags.includes('Cliente');
          if (!isClient) return false;
        } else if (statusFilter === "hot") {
          const isHot = !contact.isClient && (contact.statusCategory === 'hot' || contact.tags.includes('Quente'));
          if (!isHot) return false;
        } else if (statusFilter === "cold") {
          const isCold = !contact.isClient && contact.statusCategory === 'cold';
          if (!isCold) return false;
        } else if (statusFilter === "lost") {
          if (contact.statusCategory !== 'lost') return false;
        } else if (statusFilter === "collaborator") {
          if (!contact.tags.some(t => t.toLowerCase() === 'colaborador')) return false;
        } else if (statusFilter === "partner") {
          if (!contact.tags.some(t => t.toLowerCase() === 'parceiro')) return false;
        }
      }

      // 3. Filtro de Origem
      if (sourceFilter !== "all") {
        if (contact.source !== sourceFilter) return false;
      }

      // 4. Filtro de Oportunidades no CRM
      if (dealsFilter === "with_deals") {
        if (!contact.deals || contact.deals.length === 0) return false;
      } else if (dealsFilter === "without_deals") {
        if (contact.deals && contact.deals.length > 0) return false;
      }

      return true;
    });
  }, [contacts, searchTerm, statusFilter, sourceFilter, dealsFilter]);

  // Reseta para a primeira página ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter, dealsFilter]);

  // Paginação calculada
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage) || 1;
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(start, start + itemsPerPage);
  }, [filteredContacts, currentPage, itemsPerPage]);

  // Exportar CSV
  const handleExportCSV = () => {
    try {
      if (filteredContacts.length === 0) {
        toast.error("Nenhum lead para exportar com os filtros atuais.");
        return;
      }

      const headers = [
        "ID",
        "Nome",
        "Telefone",
        "E-mail",
        "Origem",
        "Status Carteira",
        "Tags",
        "Qtd Negocios",
        "Total Ganho (R$)",
        "Pipeline Ativo (R$)",
        "Data de Cadastro",
        "Ultima Atividade"
      ];

      const csvRows = [headers.join(";")];

      filteredContacts.forEach(c => {
        const isClient = c.isClient || c.tags.includes('Cliente');
        const statusLabel = isClient 
          ? "Cliente (Comprou)" 
          : c.statusCategory === 'hot' 
            ? "Lead Quente (Em Negociação)" 
            : c.statusCategory === 'lost'
              ? "Perdido/Desqualificado"
              : "Lead Frio";

        const row = [
          `"${c.id}"`,
          `"${(c.name || '').replace(/"/g, '""')}"`,
          `"${(c.phone || '').replace(/"/g, '""')}"`,
          `"${(c.email || '').replace(/"/g, '""')}"`,
          `"${(c.source || '').replace(/"/g, '""')}"`,
          `"${statusLabel}"`,
          `"${(c.tags || []).join(', ')}"`,
          c.dealsCount || (c.deals ? c.deals.length : 0),
          (Number(c.totalWonValue) || 0).toFixed(2),
          (Number(c.totalActivePipelineValue) || 0).toFixed(2),
          `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : ''}"`,
          `"${c.lastActive ? new Date(c.lastActive).toLocaleDateString('pt-BR') : ''}"`
        ];
        csvRows.push(row.join(";"));
      });

      // UTF-8 BOM para garantir acentos corretos no Excel no Windows
      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `versus-base-de-leads-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${filteredContacts.length} leads exportados com sucesso!`);
    } catch (e: any) {
      console.error("Erro ao exportar CSV", e);
      toast.error("Falha ao exportar CSV.");
    }
  };

  // Abrir Modal de Detalhes do Lead
  const handleOpenContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  // Salvar Tags do Contato
  const handleAddTag = async () => {
    if (!selectedContact || !newTagInput.trim()) return;
    const tagToAdd = newTagInput.trim();
    if (selectedContact.tags.includes(tagToAdd)) {
      toast.error("Esta tag já existe no contato.");
      return;
    }

    const updatedTags = [...selectedContact.tags, tagToAdd];
    setSavingTags(true);
    try {
      await api.patch(`/contacts/${selectedContact.id}/tags`, { tags: updatedTags });
      const updated = { ...selectedContact, tags: updatedTags };
      setSelectedContact(updated);
      setContacts(prev => prev.map(c => c.id === updated.id ? { ...c, tags: updatedTags } : c));
      setNewTagInput("");
      toast.success("Tag adicionada com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar tag", e);
      toast.error("Não foi possível adicionar a tag.");
    } finally {
      setSavingTags(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedContact) return;
    const updatedTags = selectedContact.tags.filter(t => t !== tagToRemove);
    setSavingTags(true);
    try {
      await api.patch(`/contacts/${selectedContact.id}/tags`, { tags: updatedTags });
      const updated = { ...selectedContact, tags: updatedTags };
      setSelectedContact(updated);
      setContacts(prev => prev.map(c => c.id === updated.id ? { ...c, tags: updatedTags } : c));
      toast.success("Tag removida.");
    } catch (e) {
      console.error("Erro ao remover tag", e);
      toast.error("Não foi possível remover a tag.");
    } finally {
      setSavingTags(false);
    }
  };

  // Classes dinâmicas do tema
  const focusBorderClass = isWhatsApp 
    ? "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
    : "focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  const primaryBtnClass = isWhatsApp
    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Carregando Base de Leads & Carteira de Clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-rose-500 flex flex-col items-start gap-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 m-6">
        <div className="flex items-center gap-2 font-bold text-lg">
          <AlertCircle className="w-5 h-5" />
          <span>Erro ao carregar os dados</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sua sessão pode ter expirado ou o servidor está temporariamente indisponível.
        </p>
        <button 
          onClick={() => router.push('/login')} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
        >
          Fazer Login Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full h-full pb-10 text-slate-900 dark:text-slate-100 animate-in fade-in duration-200">
      
      {/* 1. CABEÇALHO SUPERIOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Base de Leads
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {contacts.length.toLocaleString('pt-BR')} registros
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Carteira inteligente de clientes, leads qualificados e contatos captados.
          </p>
        </div>
        
        {/* Barra de Ações: Busca, Filtros e Exportação */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, telefone, e-mail..." 
              className={`w-full sm:w-72 pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none ${focusBorderClass} transition-colors shadow-sm`}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              showFilterBar || statusFilter !== "all" || sourceFilter !== "all" || dealsFilter !== "all"
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                : "bg-white dark:bg-[#121824] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Filter size={14} className={statusFilter !== "all" || sourceFilter !== "all" ? "text-blue-600 dark:text-blue-400" : ""} /> 
            <span>Filtros</span>
            {(statusFilter !== "all" || sourceFilter !== "all" || dealsFilter !== "all") && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </button>

          <button 
            onClick={handleExportCSV}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${primaryBtnClass}`}
            title="Exportar contatos filtrados em formato CSV (compatível com Excel)"
          >
            <Download size={14} /> 
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 2. CARDS DE RESUMO DA CARTEIRA INTELIGENTE (CLICK-TO-FILTER) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Geral */}
        <div 
          onClick={() => { setStatusFilter("all"); setSourceFilter("all"); setDealsFilter("all"); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            statusFilter === "all" && sourceFilter === "all" && dealsFilter === "all"
              ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20"
              : "bg-white dark:bg-[#0c1017] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-blue-500" />
              Total na Base
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Geral</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {metrics.total.toLocaleString('pt-BR')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">contatos</span>
          </div>
        </div>

        {/* Clientes Confirmados (Compraram) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === "won" ? "all" : "won")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            statusFilter === "won"
              ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-[#0c1017] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              Clientes (Já Compraram)
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              Ganho
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.clientsCount.toLocaleString('pt-BR')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">clientes</span>
            </div>
            {metrics.totalWonRevenue > 0 && (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={`Total Ganho: R$ ${metrics.totalWonRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                R$ {(metrics.totalWonRevenue / 1000).toFixed(0)}k
              </span>
            )}
          </div>
        </div>

        {/* Leads Quentes (Em Negociação) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === "hot" ? "all" : "hot")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            statusFilter === "hot"
              ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-[#0c1017] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Flame size={14} className="text-amber-500" />
              Leads Quentes
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
              Pipeline
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {metrics.hotCount.toLocaleString('pt-BR')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">em negociação</span>
            </div>
            {metrics.totalPipelineValue > 0 && (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={`Pipeline Ativo: R$ ${metrics.totalPipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                R$ {(metrics.totalPipelineValue / 1000).toFixed(0)}k
              </span>
            )}
          </div>
        </div>

        {/* Leads Frios (Sem Oportunidade) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === "cold" ? "all" : "cold")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            statusFilter === "cold"
              ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20"
              : "bg-white dark:bg-[#0c1017] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Snowflake size={14} className="text-sky-500" />
              Leads Frios
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              Prospecção
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-sky-600 dark:text-sky-400">
              {metrics.coldCount.toLocaleString('pt-BR')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">para campanhas</span>
          </div>
        </div>
      </div>

      {/* 3. BARRA EXPANSÍVEL DE FILTROS AVANÇADOS */}
      {showFilterBar && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2 duration-200">
          {/* Filtro de Status da Carteira */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Classificação na Carteira
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium outline-none ${focusBorderClass}`}
            >
              <option value="all">Todas as classificações</option>
              <option value="won">Clientes Confirmados (Já Compraram)</option>
              <option value="hot">Leads Quentes (Em Negociação)</option>
              <option value="cold">Leads Frios (Sem Negócio Ativo)</option>
              <option value="lost">Perdidos / Desqualificados</option>
              <option value="collaborator">Colaboradores da Equipe</option>
              <option value="partner">Parceiros Estratégicos</option>
            </select>
          </div>

          {/* Filtro de Origem */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Origem do Contato
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium outline-none ${focusBorderClass}`}
            >
              <option value="all">Todas as origens</option>
              {availableSources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Negócios */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Oportunidades no CRM
            </label>
            <select
              value={dealsFilter}
              onChange={(e) => setDealsFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium outline-none ${focusBorderClass}`}
            >
              <option value="all">Todos os contatos</option>
              <option value="with_deals">Apenas com Negócios no CRM</option>
              <option value="without_deals">Apenas sem Negócios no CRM</option>
            </select>
          </div>

          {/* Itens por Página */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Exibir por Página
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className={`px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium outline-none ${focusBorderClass}`}
            >
              <option value={25}>25 leads</option>
              <option value={50}>50 leads</option>
              <option value={100}>100 leads</option>
            </select>
          </div>

          {/* Botão Limpar Filtros */}
          {(statusFilter !== "all" || sourceFilter !== "all" || dealsFilter !== "all" || searchTerm) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSourceFilter("all");
                  setDealsFilter("all");
                  setSearchTerm("");
                }}
                className="px-3.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold transition-colors flex items-center gap-1.5"
              >
                <X size={14} />
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. TABELA PRINCIPAL DE LEADS */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                <th className="py-3 px-4 font-bold rounded-tl-2xl">Contato</th>
                <th className="py-3 px-4 font-bold">Telefone / E-mail</th>
                <th className="py-3 px-4 font-bold">Origem</th>
                <th className="py-3 px-4 font-bold">Classificação / Tags</th>
                <th className="py-3 px-4 font-bold">Negócios (CRM)</th>
                <th className="py-3 px-4 font-bold">Última Atividade</th>
                <th className="py-3 px-4 font-bold text-center rounded-tr-2xl">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                    Nenhum contato encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedContacts.map((contact) => {
                  const isClient = contact.isClient || contact.tags.includes('Cliente');
                  const isHot = !isClient && (contact.statusCategory === 'hot' || contact.tags.includes('Quente'));
                  const isCollaborator = contact.tags.some(t => t.toLowerCase() === 'colaborador');
                  const isPartner = contact.tags.some(t => t.toLowerCase() === 'parceiro');
                  const isLost = contact.statusCategory === 'lost';

                  return (
                    <tr 
                      key={contact.id} 
                      onClick={() => handleOpenContact(contact)}
                      className="group hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {/* Nome e Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                            isClient
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60"
                              : isHot
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}>
                            {contact.avatarUrl ? (
                              <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span>{contact.name?.charAt(0).toUpperCase() || "C"}</span>
                            )}
                          </div>
                          <div className="min-w-[160px] max-w-[240px]">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              <span>{contact.name}</span>
                              {isClient && (
                                <span title="Cliente Confirmado (Já comprou)">
                                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              ID: #{contact.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contato Info: Telefone / Email */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5 min-w-[150px]">
                          <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                            <Phone size={12} className="text-emerald-500 shrink-0" />
                            <span>
                              {contact.phone?.includes('@lid') 
                                ? 'WhatsApp (Privado)' 
                                : (contact.phone || 'Sem telefone')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            <span>{contact.email || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Origem */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/70">
                          {contact.source || 'Versus CRM'}
                        </span>
                      </td>

                      {/* Classificação / Tags */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-[240px]">
                          {/* Badge Principal Inteligente */}
                          {isClient ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40">
                              <ShieldCheck size={11} /> CLIENTE
                            </span>
                          ) : isHot ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40">
                              <Flame size={11} /> QUENTE
                            </span>
                          ) : isCollaborator ? (
                            <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40">
                              COLABORADOR
                            </span>
                          ) : isPartner ? (
                            <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40">
                              PARCEIRO
                            </span>
                          ) : isLost ? (
                            <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40">
                              PERDIDO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40">
                              <Snowflake size={11} /> FRIO
                            </span>
                          )}

                          {/* Outras Tags */}
                          {contact.tags
                            ?.filter(t => !['Cliente', 'Quente', 'Frio', 'Não categorizado'].includes(t))
                            .slice(0, 2)
                            .map(tag => (
                              <span 
                                key={tag} 
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      </td>

                      {/* Negócios (CRM) */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5 min-w-[120px]">
                          {contact.deals && contact.deals.length > 0 ? (
                            <>
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                                <span>{contact.deals.length} {contact.deals.length === 1 ? 'negócio' : 'negócios'}</span>
                              </div>
                              {contact.totalWonValue && contact.totalWonValue > 0 ? (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  R$ {Number(contact.totalWonValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              ) : contact.totalActivePipelineValue && contact.totalActivePipelineValue > 0 ? (
                                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                  R$ {Number(contact.totalActivePipelineValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Sem valor def.</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                          )}
                        </div>
                      </td>

                      {/* Tempo / Última Atividade */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {contact.lastActive ? new Date(contact.lastActive).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenContact(contact);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Abrir cadastro e detalhes do lead"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. RODAPÉ E PAGINAÇÃO */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium mt-auto">
          <div>
            Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredContacts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> a <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredContacts.length)}</strong> de <strong className="text-slate-800 dark:text-slate-200">{filteredContacts.length.toLocaleString('pt-BR')}</strong> leads
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121824] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
            >
              <ChevronLeft size={13} />
              Anterior
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNumber = currentPage - 3 + i;
                  if (pageNumber > totalPages) pageNumber = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNumber
                        ? isWhatsApp
                          ? "bg-emerald-600 text-white"
                          : "bg-blue-600 text-white"
                        : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121824] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121824] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
            >
              Próxima
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. MODAL EXECUTIVO: CADASTRO E DETALHES DO LEAD / CLIENTE */}
      {isModalOpen && selectedContact && (
        <ModalPortal>
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="w-full max-w-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-white flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Topo do Modal */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-base shrink-0 border ${
                    selectedContact.isClient || selectedContact.tags.includes('Cliente')
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                      : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                  }`}>
                    {selectedContact.avatarUrl ? (
                      <img src={selectedContact.avatarUrl} alt={selectedContact.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{selectedContact.name?.charAt(0).toUpperCase() || "C"}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight">{selectedContact.name}</h2>
                      {selectedContact.isClient || selectedContact.tags.includes('Cliente') ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                          <ShieldCheck size={12} /> CLIENTE CONFIRMADO
                        </span>
                      ) : selectedContact.statusCategory === 'hot' || selectedContact.tags.includes('Quente') ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                          <Flame size={12} /> EM NEGOCIAÇÃO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40">
                          <Snowflake size={12} /> LEAD FRIO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>ID: #{selectedContact.id}</span>
                      <span>•</span>
                      <span>Origem: {selectedContact.source || 'Versus CRM'}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corpo com Scroll */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* 1. Banner Inteligente de Status */}
                {(selectedContact.isClient || selectedContact.tags.includes('Cliente')) ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Cliente Ativo da Carteira</h4>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Este contato possui compras e negócios ganhos confirmados.</p>
                      </div>
                    </div>
                    {selectedContact.totalWonValue && selectedContact.totalWonValue > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Total Faturado</span>
                        <span className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                          R$ {Number(selectedContact.totalWonValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (selectedContact.statusCategory === 'hot' || selectedContact.tags.includes('Quente')) ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Flame size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">Lead Quente em Negociação</h4>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">Oportunidade ativa no funil comercial do CRM.</p>
                      </div>
                    </div>
                    {selectedContact.totalActivePipelineValue && selectedContact.totalActivePipelineValue > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Em Pipeline</span>
                        <span className="text-sm font-black text-amber-900 dark:text-amber-200">
                          R$ {Number(selectedContact.totalActivePipelineValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Snowflake size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">Lead da Base (Frio)</h4>
                        <p className="text-[11px] text-blue-700 dark:text-blue-400">Contato cadastrado na base sem negociações ativas no momento.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Informações de Contato */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      <Phone size={13} className="text-emerald-500" />
                      Telefone / WhatsApp
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold font-mono">
                        {selectedContact.phone?.includes('@lid') ? 'WhatsApp (Privado)' : (selectedContact.phone || 'Não informado')}
                      </span>
                      {selectedContact.phone && !selectedContact.phone.includes('@lid') && (
                        <a 
                          href={`https://wa.me/${selectedContact.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={11} /> Conversar
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      <Mail size={13} className="text-blue-500" />
                      E-mail Corporativo
                    </div>
                    <span className="text-xs font-bold">
                      {selectedContact.email || 'Não informado'}
                    </span>
                  </div>
                </div>

                {/* 3. Negócios Vinculados no CRM */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-blue-500" />
                      Oportunidades Comerciais no CRM ({selectedContact.deals?.length || 0})
                    </h3>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        router.push(`/crm?search=${encodeURIComponent(selectedContact.name)}`);
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Abrir no Funil CRM
                    </button>
                  </div>

                  {selectedContact.deals && selectedContact.deals.length > 0 ? (
                    <div className="space-y-2">
                      {selectedContact.deals.map((deal) => (
                        <div 
                          key={deal.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{deal.title}</h4>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Status: <strong className="uppercase text-slate-700 dark:text-slate-300">{deal.status}</strong>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                              R$ {Number(deal.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              deal.status === 'won'
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                                : deal.status === 'lost'
                                  ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                                  : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                            }`}>
                              {deal.status === 'won' ? 'Ganho / Fechado' : deal.status === 'lost' ? 'Perdido' : 'Em Negociação'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                      Nenhuma oportunidade comercial vinculada a este contato ainda.
                    </div>
                  )}
                </div>

                {/* 4. Gestão de Tags */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <TagIcon size={14} className="text-slate-500" />
                    Etiquetas / Tags
                  </h3>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {selectedContact.tags.map(t => (
                      <span 
                        key={t}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {t}
                        <button 
                          onClick={() => handleRemoveTag(t)}
                          disabled={savingTags}
                          className="hover:text-rose-500 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Input para adicionar nova tag */}
                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                      placeholder="Adicionar nova tag (ex: VIP, Feira 2026)..."
                      className={`flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 outline-none ${focusBorderClass}`}
                    />
                    <button
                      onClick={handleAddTag}
                      disabled={savingTags || !newTagInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Rodapé do Modal com Ações */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Fechar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      router.push(`/inbox?search=${encodeURIComponent(selectedContact.name)}`);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>Abrir no WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}