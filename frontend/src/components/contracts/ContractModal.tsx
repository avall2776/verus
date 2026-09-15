"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Plus, FileText, Building2, User, DollarSign, 
  Calendar, CheckCircle2, ShieldCheck, Sparkles, Loader2, ArrowRight
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Contract } from "@/types/commercial";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContractCreated: (contract: Contract) => void;
}

interface ProposalOption {
  id: string;
  code: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientDocument?: string;
  clientAddress?: string;
  validUntil?: string;
  total: number;
  status: string;
}

export function ContractModal({ isOpen, onClose, onContractCreated }: ContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<ProposalOption[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Form states
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const [title, setTitle] = useState("Contrato de Prestação de Serviços & Licença de Software");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [value, setValue] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  // Load available proposals when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchProposals() {
      setLoadingProposals(true);
      try {
        const res = await api.get("/proposals");
        if (isMounted && Array.isArray(res.data)) {
          const mapped: ProposalOption[] = res.data.map((p: any) => ({
            id: p.id,
            code: p.code || `PROP-${p.id.slice(0, 6)}`,
            title: p.title || "Proposta Comercial",
            clientName: p.clientName || p.lead?.name || "Cliente",
            clientEmail: p.clientEmail || p.lead?.email || "",
            clientPhone: p.clientPhone || p.lead?.phone || "",
            clientDocument: p.clientDocument || p.lead?.document || p.clientCpfCnpj || "",
            clientAddress: p.clientAddress || p.lead?.address || "",
            validUntil: p.validUntil ? p.validUntil.split("T")[0] : "",
            total: Number(p.total || p.totalValue || 0),
            status: (p.status || "draft").toLowerCase(),
          }));

          // Ordena propostas aceitas primeiro
          mapped.sort((a, b) => {
            if (a.status === "accepted" && b.status !== "accepted") return -1;
            if (b.status === "accepted" && a.status !== "accepted") return 1;
            return 0;
          });

          setProposals(mapped);
        }
      } catch (err) {
        console.error("Erro ao carregar propostas para o contrato:", err);
      } finally {
        if (isMounted) setLoadingProposals(false);
      }
    }

    fetchProposals();
  }, [isOpen]);

  // Handle proposal selection
  const handleSelectProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    if (!proposalId) return;

    const prop = proposals.find((p) => p.id === proposalId);
    if (prop) {
      setTitle(`Contrato de Prestação de Serviços - ${prop.title}`);
      setClientName(prop.clientName || "");
      setClientEmail(prop.clientEmail || "");
      setClientPhone(prop.clientPhone || "");
      if (prop.clientDocument) setClientDocument(prop.clientDocument);
      if (prop.clientAddress) setClientAddress(prop.clientAddress);
      setValue(prop.total || 0);
      if (prop.validUntil) {
        setValidUntil(prop.validUntil);
        setEndDate(prop.validUntil);
      }
      toast.success(`Dados da proposta ${prop.code} preenchidos com sucesso!`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      toast.error("Por favor, preencha o nome do cliente / contratante.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: title.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientDocument: clientDocument.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        value: Number(value) || 0,
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate || undefined,
        validUntil: validUntil || undefined,
        proposalId: selectedProposalId || undefined,
        terms: terms.trim() || undefined,
        notes: notes.trim() || undefined,
        status: "PENDING_SIGNATURE",
      };

      const res = await api.post("/contracts", payload);
      toast.success("Contrato emitido e registrado no Supabase com sucesso!");
      onContractCreated(res.data);
      onClose();
    } catch (err: any) {
      console.error("Erro ao emitir contrato:", err);
      const msg = err.response?.data?.message || "Erro ao salvar contrato no banco de dados.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#090E1A]/95 border border-slate-800 shadow-2xl p-6 sm:p-8 text-white space-y-6 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Emitir Novo Contrato Digital
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Assinatura Eletrônica
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gere a minuta oficial com validade jurídica, vinculando ou não a uma proposta comercial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seletor de Proposta Comercial Existente */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Importar dados de Proposta Aceita (Opcional)
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={selectedProposalId}
                onChange={(e) => handleSelectProposal(e.target.value)}
                disabled={loadingProposals}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#060913] border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="">-- Contrato avulso (Preenchimento manual) --</option>
                {proposals.map((prop) => {
                  const isAccepted = prop.status === "accepted";
                  return (
                    <option key={prop.id} value={prop.id}>
                      {isAccepted ? "★ [ACEITA] " : ""}{prop.code} - {prop.title} | {prop.clientName} (R$ {prop.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              Ao selecionar uma proposta, o cliente, o valor e o objeto contratual serão preenchidos automaticamente.
            </p>
          </div>

          {/* Dados Gerais do Contrato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Título / Objeto do Contrato *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Contrato de Prestação de Serviços & Licença de Software"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Nome do Cliente / Razão Social *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome da Empresa ou Contratante"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                CPF / CNPJ do Contratante
              </label>
              <input
                type="text"
                value={clientDocument}
                onChange={(e) => setClientDocument(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                E-mail para Assinatura
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="diretoria@cliente.com.br"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Endereço Completo do Contratante
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Av. Paulista, 1000, Sala 50 - São Paulo/SP"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Valores e Prazos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor do Contrato (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Início da Vigência
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Término da Vigência
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Observações Internas */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Observações / Instruções Específicas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Assinatura exigida pelo sócio administrador até a próxima sexta-feira."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Footer com Ações */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Emitindo Contrato...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Emitir e Registrar Contrato
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
