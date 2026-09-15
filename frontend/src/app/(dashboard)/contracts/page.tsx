"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ScrollText, Plus, Search, CheckCircle2, Clock, 
  FileText, Download, ShieldCheck, ExternalLink, Calendar,
  Building2, ArrowUpRight, Share2, Copy, Eye, Trash2, Filter,
  RefreshCw, Check, Sparkles, FolderOpen, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Contract } from "@/types/commercial";
import { ContractModal } from "@/components/contracts/ContractModal";
import { ContractPreviewModal } from "@/components/contracts/ContractPreviewModal";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Carregar contratos reais do backend
  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/contracts");
      if (Array.isArray(res.data)) {
        setContracts(res.data);
      }
    } catch (err: any) {
      console.error("Erro ao carregar contratos:", err);
      toast.error("Não foi possível carregar os contratos do banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Filtros dinâmicos
  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const matchesSearch = 
        c.clientName.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = 
        statusFilter === "all" || 
        c.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [contracts, search, statusFilter]);

  // KPIs calculados sobre os contratos reais
  const metrics = useMemo(() => {
    const signed = contracts.filter((c) => c.status === "signed");
    const pending = contracts.filter((c) => c.status === "pending_signature");

    const signedTotal = signed.reduce((acc, c) => acc + Number(c.value || 0), 0);
    const pendingTotal = pending.reduce((acc, c) => acc + Number(c.value || 0), 0);

    return {
      signedCount: signed.length,
      signedTotal,
      pendingCount: pending.length,
      pendingTotal,
      totalCount: contracts.length,
    };
  }, [contracts]);

  // Ações Rápidas
  const handleOpenPreview = (contract: Contract) => {
    setSelectedContract(contract);
    setIsPreviewOpen(true);
  };

  const handleDownloadPdf = (contract: Contract) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("versus_auth_token") || localStorage.getItem("token") : "";
    const url = `/api-backend/contracts/${contract.id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    window.open(url, "_blank");
    toast.success(`Abrindo minuta oficial do contrato ${contract.code}`);
  };

  const handleShareWhatsApp = async (contract: Contract) => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://verus-alpha.vercel.app");
      const res = await api.get(`/contracts/${contract.id}/whatsapp-share?origin=${encodeURIComponent(origin)}`);
      const fallbackUrl = `${origin}/c/${contract.code.toLowerCase()}`;
      const textToCopy = res.data?.message || `Olá, *${contract.clientName}*! Segue o link oficial para assinatura digital do seu contrato: *${contract.title}* (${contract.code}).\n\nVocê pode revisar os termos e efetuar a assinatura eletrônica com validade jurídica pelo link: ${fallbackUrl}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }

      if (res.data?.whatsappUrl) {
        window.open(res.data.whatsappUrl, "_blank");
        toast.success("WhatsApp aberto e mensagem copiada para a área de transferência!");
      } else {
        toast.success("Mensagem de assinatura copiada para o WhatsApp!");
      }
    } catch (err) {
      console.error("Erro ao gerar link de WhatsApp:", err);
      const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://verus-alpha.vercel.app");
      const fallbackUrl = `${origin}/c/${contract.code.toLowerCase()}`;
      const msg = `Olá, *${contract.clientName}*! Segue o link oficial para assinatura digital do seu contrato: *${contract.title}* (${contract.code}).\n\nVocê pode revisar os termos e efetuar a assinatura eletrônica com validade jurídica pelo link: ${fallbackUrl}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(msg);
      }
      const encoded = encodeURIComponent(msg);
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
      toast.success("WhatsApp aberto e link copiado!");
    }
  };

  const handleSignContract = async (contract: Contract) => {
    if (!confirm(`Deseja assinar e homologar o contrato ${contract.code} digitalmente com carimbo de auditoria?`)) {
      return;
    }

    try {
      const res = await api.patch(`/contracts/${contract.id}/status`, {
        status: "SIGNED",
      });
      toast.success(`Contrato ${contract.code} assinado com sucesso!`);
      const updatedContract: Contract = { ...contract, ...res.data, status: "signed" };
      setContracts((prev) =>
        prev.map((c) => (c.id === contract.id ? updatedContract : c))
      );
      if (selectedContract && selectedContract.id === contract.id) {
        setSelectedContract(updatedContract);
      }
    } catch (err) {
      console.error("Erro ao assinar contrato:", err);
      toast.error("Erro ao atualizar status do contrato.");
    }
  };

  const handleDeleteContract = async (contract: Contract) => {
    if (!confirm(`Tem certeza que deseja excluir o contrato ${contract.code}?`)) {
      return;
    }

    try {
      await api.delete(`/contracts/${contract.id}`);
      toast.success("Contrato excluído com sucesso.");
      setContracts((prev) => prev.filter((c) => c.id !== contract.id));
    } catch (err) {
      console.error("Erro ao excluir contrato:", err);
      toast.error("Erro ao excluir contrato.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Gestão de Contratos Digitais
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium font-mono">
                {contracts.length} {contracts.length === 1 ? "registro" : "registros"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Assinatura eletrônica com validade jurídica, trilha de auditoria e controle de vigência
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchContracts}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Emitir Novo Contrato
          </button>
        </div>
      </div>

      {/* Cards de Métricas Reais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Contratos Vigentes
          </span>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            {metrics.signedTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> 
            {metrics.signedCount} {metrics.signedCount === 1 ? "contrato 100% assinado" : "contratos 100% assinados"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Assinaturas Pendentes
          </span>
          <div className="text-2xl font-extrabold text-amber-400 mt-2 font-mono">
            {metrics.pendingTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> 
            {metrics.pendingCount} {metrics.pendingCount === 1 ? "minuta aguardando signatário" : "minutas aguardando signatários"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Conformidade Jurídica
          </span>
          <div className="text-2xl font-extrabold text-cyan-400 mt-2">
            MP 2.200-2 & Lei 14.063
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Carimbo de tempo, IP & Trilha Auditada
          </span>
        </div>
      </div>

      {/* Tabela de Contratos & Filtros */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, documento ou código..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todos os Status</option>
              <option value="signed">Assinados</option>
              <option value="pending_signature">Pendentes</option>
              <option value="canceled">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Conteúdo da Tabela / Estado Vazio */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto opacity-70" />
            <p className="text-xs text-slate-400">Carregando contratos digitais sincronizados...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
              <ScrollText className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-white">Nenhum contrato encontrado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {search || statusFilter !== "all"
                  ? "Nenhum contrato corresponde aos filtros aplicados. Tente ajustar o termo de busca."
                  : "Sua base de contratos ainda está vazia. Você pode emitir um novo contrato avulso ou vinculá-lo a uma proposta aceita."}
              </p>
            </div>
            {!(search || statusFilter !== "all") && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Emitir Primeiro Contrato
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Código / Documento</th>
                  <th className="p-3.5">Cliente / Razão Social</th>
                  <th className="p-3.5">Vigência</th>
                  <th className="p-3.5 text-right">Valor</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((contract) => {
                  const isSigned = contract.status === "signed";
                  return (
                    <tr key={contract.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          {contract.code}
                          {contract.proposal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-sans">
                              Via Proposta
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                          {contract.title}
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-200">
                        <div>{contract.clientName}</div>
                        {contract.clientDocument && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {contract.clientDocument}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-slate-400">
                        {contract.endDate 
                          ? `até ${new Date(contract.endDate).toLocaleDateString("pt-BR")}` 
                          : contract.startDate 
                            ? `a partir de ${new Date(contract.startDate).toLocaleDateString("pt-BR")}`
                            : "Indeterminado"}
                      </td>

                      <td className="p-3.5 text-right font-bold text-white font-mono">
                        {Number(contract.value || 0).toLocaleString("pt-BR", { 
                          style: "currency", 
                          currency: "BRL" 
                        })}
                      </td>

                      <td className="p-3.5 text-center">
                        {isSigned ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Assinado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Visualizar Detalhes */}
                          <button
                            onClick={() => handleOpenPreview(contract)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                            title="Visualizar Minuta e Trilha"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* PDF Oficial */}
                          <button
                            onClick={() => handleDownloadPdf(contract)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Baixar/Visualizar PDF Oficial"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Link WhatsApp */}
                          <button
                            onClick={() => handleShareWhatsApp(contract)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Enviar Link de Assinatura via WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Assinar */}
                          {!isSigned && (
                            <button
                              onClick={() => handleSignContract(contract)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Marcar como Assinado"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Excluir */}
                          <button
                            onClick={() => handleDeleteContract(contract)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir Contrato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Emitir Novo Contrato */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onContractCreated={(newContract) => {
          setContracts((prev) => [newContract, ...prev]);
        }}
      />

      {/* Modal para Visualizar / Assinar / PDF */}
      <ContractPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        contract={selectedContract}
        onStatusUpdated={(updated) => {
          setContracts((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated, status: "signed" } : c))
          );
          setSelectedContract((prev) => (prev ? { ...prev, ...updated, status: "signed" } : null));
        }}
      />
    </div>
  );
}
