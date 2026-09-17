"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, X, Kanban, MessageSquare, Users, 
  ChevronRight, ArrowRight, Loader2, Sparkles,
  FileText, ScrollText, Target, LifeBuoy, Zap
} from "lucide-react";
import api from "@/lib/api";

interface LeadItem {
  id: string;
  title: string;
  value: number;
  status: string;
  contactName: string;
  contactPhone?: string;
  href: string;
}

interface ContactItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  conversationId?: string;
  href: string;
}

interface TeamItem {
  id: string;
  name: string;
  email?: string;
  role: string;
  isOnline: boolean;
  href: string;
}

interface SearchResponse {
  leads: LeadItem[];
  contacts: ContactItem[];
  team: TeamItem[];
  total: number;
}

const QUICK_ACTIONS = [
  { label: "Inbox WhatsApp", href: "/inbox", keywords: ["whatsapp", "inbox", "conversa", "zap", "mensagem"] },
  { label: "Funil Comercial (CRM)", href: "/crm", keywords: ["crm", "funil", "kanban", "lead", "oportunidade", "venda"] },
  { label: "Chat Interno da Equipe", href: "/chat-interno", keywords: ["chat", "interno", "equipe", "time", "colaborador"] },
  { label: "Metas Comerciais", href: "/dashboard/goals", keywords: ["meta", "metas", "faturamento", "alvo"] },
  { label: "Propostas Comerciais", href: "/proposals", keywords: ["proposta", "propostas", "orcamento"] },
  { label: "Contratos Digitais", href: "/contracts", keywords: ["contrato", "contratos", "assinatura"] },
  { label: "Central de Suporte", href: "/support", keywords: ["suporte", "ajuda", "ticket", "chamado", "duvida"] },
  { label: "Relatório de Gestão & Checklist", href: "/relatorio", keywords: ["relatorio", "checklist", "ponto", "gestao"] },
];

export default function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>({ leads: [], contacts: [], team: [], total: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Atalho Global Ctrl + K ou Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca Reativa com Debounce
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim() || val.trim().length < 2) {
      setResults({ leads: [], contacts: [], team: [], total: 0 });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(val.trim())}`);
        if (res.data) {
          setResults(res.data);
        }
      } catch (err) {
        console.warn("[GlobalSearchBar] Falha na busca:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);
  };

  const navigateTo = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  // Filtragem de Atalhos Rápidos por palavras-chave
  const matchedActions = query.trim().length >= 2 
    ? QUICK_ACTIONS.filter(act => 
        act.keywords.some(k => k.includes(query.toLowerCase()) || query.toLowerCase().includes(k)) ||
        act.label.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div ref={containerRef} className="relative w-full md:w-80 lg:w-96 group">
      {/* Campo de Input da Topbar */}
      <div className="relative">
        <Search 
          size={16} 
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" 
        />
        <input 
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Buscar leads, conversas..."
          className="w-full bg-[#0B1224] border border-slate-800 rounded-full pl-10 pr-16 py-2 text-xs text-white outline-none transition-all focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] placeholder:text-slate-500"
        />

        {/* Loading ou Botão Limpar ou Atalho Ctrl K */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-auto">
          {isLoading ? (
            <Loader2 size={13} className="text-blue-400 animate-spin" />
          ) : query ? (
            <button
              onClick={() => {
                setQuery("");
                setResults({ leads: [], contacts: [], team: [], total: 0 });
                setIsOpen(false);
              }}
              title="Limpar busca"
              className="text-slate-500 hover:text-white p-0.5 rounded-full transition-colors"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-800/60 rounded border border-slate-700/60">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Flutuante de Resultados em Tempo Real */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 mt-2 w-full sm:w-[480px] bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl shadow-black/90 p-2 z-50 overflow-hidden flex flex-col text-slate-100 animate-fadeIn">
          
          {/* Header dos Resultados */}
          <div className="px-3 py-2 border-b border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
            <span>Resultados para <strong className="text-white font-semibold">"{query}"</strong></span>
            {isLoading ? (
              <span className="flex items-center gap-1 text-blue-400">
                <Loader2 size={11} className="animate-spin" />
                <span>Buscando...</span>
              </span>
            ) : (
              <span className="text-slate-500">{results.total + matchedActions.length} encontrado(s)</span>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-800/40 py-1">
            
            {/* 1. SEÇÃO DE LEADS / OPORTUNIDADES DO CRM */}
            {results.leads.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Kanban size={12} className="text-blue-400" />
                  <span>Leads & Oportunidades CRM ({results.leads.length})</span>
                </div>
                <div className="space-y-1 mt-1">
                  {results.leads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => navigateTo(lead.href)}
                      className="px-3 py-2 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-blue-400 truncate">
                            {lead.title}
                          </h4>
                          {lead.status && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-slate-400 rounded">
                              {lead.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {lead.contactName} {lead.contactPhone ? `• ${lead.contactPhone}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        {lead.value > 0 && (
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {formatBRL(lead.value)}
                          </span>
                        )}
                        <ChevronRight size={13} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. SEÇÃO DE CONVERSAS & CONTATOS (WHATSAPP / INBOX) */}
            {results.contacts.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={12} className="text-emerald-400" />
                  <span>Conversas & Contatos ({results.contacts.length})</span>
                </div>
                <div className="space-y-1 mt-1">
                  {results.contacts.map(c => (
                    <div
                      key={c.id}
                      onClick={() => navigateTo(c.href)}
                      className="px-3 py-2 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                          {c.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          {c.phone || c.email || "WhatsApp"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-emerald-400 transition-colors">
                        <span>Abrir</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SEÇÃO DE EQUIPE / COLABORADORES */}
            {results.team.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={12} className="text-purple-400" />
                  <span>Equipe / Chat Interno ({results.team.length})</span>
                </div>
                <div className="space-y-1 mt-1">
                  {results.team.map(member => (
                    <div
                      key={member.id}
                      onClick={() => navigateTo(member.href)}
                      className="px-3 py-2 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-[10px]">
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0F172A] ${
                            member.isOnline ? "bg-emerald-400" : "bg-slate-500"
                          }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-purple-400 truncate">
                            {member.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {member.role || "Colaborador"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 group-hover:text-purple-400 flex items-center gap-1 transition-colors">
                        <span>Conversar</span>
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. ATALHOS RÁPIDOS DE NAVEGAÇÃO */}
            {matchedActions.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-400" />
                  <span>Acesso Rápido a Módulos</span>
                </div>
                <div className="space-y-1 mt-1">
                  {matchedActions.map(act => (
                    <div
                      key={act.href}
                      onClick={() => navigateTo(act.href)}
                      className="px-3 py-2 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400">
                        {act.label}
                      </span>
                      <ArrowRight size={13} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {!isLoading && results.total === 0 && matchedActions.length === 0 && (
              <div className="py-8 px-4 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-2">
                  <Search size={18} className="opacity-70" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Nenhum resultado encontrado</h4>
                <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed">
                  Não encontramos leads, contatos ou conversas para <span className="text-blue-300 font-semibold">"{query}"</span>.
                </p>
              </div>
            )}

          </div>

          {/* Rodapé do Dropdown */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-[#0B1224]/80 flex items-center justify-between text-[10px] text-slate-400 rounded-b-xl">
            <span>Pressione <kbd className="px-1 bg-slate-800 rounded text-slate-300 font-mono">Esc</kbd> para fechar</span>
            <span className="text-slate-500">Busca Global VERSUS</span>
          </div>
        </div>
      )}
    </div>
  );
}
