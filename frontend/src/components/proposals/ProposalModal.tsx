"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, Plus, Trash2, FileText, DollarSign, Calendar, User, 
  Building2, Mail, Phone, ShieldCheck, Sparkles, CheckCircle2, 
  Edit3, Upload, Image as ImageIcon, MapPin
} from "lucide-react";
import { Proposal, ProposalItem, CompanyIssuer, ProposalStatus } from "@/types/commercial";
import toast from "react-hot-toast";

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proposal: Proposal) => void | Promise<void>;
  proposalToEdit?: Proposal | null;
}

export function ProposalModal({ isOpen, onClose, onSave, proposalToEdit }: ProposalModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Código da proposta
  const [code, setCode] = useState(() => `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // Dados do emitente (Sua Empresa / Tenant) - 100% limpos por padrão
  const [issuerName, setIssuerName] = useState("");
  const [issuerDocument, setIssuerDocument] = useState("");
  const [issuerPhone, setIssuerPhone] = useState("");
  const [issuerEmail, setIssuerEmail] = useState("");
  const [issuerAddress, setIssuerAddress] = useState("");
  const [issuerLogoUrl, setIssuerLogoUrl] = useState<string>("");

  // Dados do cliente - 100% limpos por padrão
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [paymentMethod, setPaymentMethod] = useState("50% Entrada + 50% na Entrega");
  const [notes, setNotes] = useState("");

  // Itens dinâmicos do orçamento - nasce zerado com 1 item em branco
  const [items, setItems] = useState<ProposalItem[]>([
    {
      id: "item-1",
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      total: 0
    }
  ]);

  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar estado caso haja proposta em edição ou resetar 100% limpo para nova proposta
  useEffect(() => {
    if (proposalToEdit && isOpen) {
      setCode(proposalToEdit.code);
      setTitle(proposalToEdit.title || "");
      setClientName(proposalToEdit.clientName || "");
      setClientCompany(proposalToEdit.clientCompany || "");
      setClientEmail(proposalToEdit.clientEmail || "");
      setClientPhone(proposalToEdit.clientPhone || "");
      setSellerName(proposalToEdit.sellerName || "");
      setValidUntil(proposalToEdit.validUntil || "");
      setPaymentMethod(proposalToEdit.paymentMethod || "50% Entrada + 50% na Entrega");
      setNotes(proposalToEdit.notes || "");
      setItems(proposalToEdit.items && proposalToEdit.items.length > 0 ? proposalToEdit.items : [
        {
          id: `item-${Date.now()}`,
          name: "",
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          total: 0
        }
      ]);
      setGlobalDiscount(proposalToEdit.discountTotal || 0);

      // Carregar emitente da proposta se houver
      if (proposalToEdit.issuer) {
        setIssuerName(proposalToEdit.issuer.name || "");
        setIssuerDocument(proposalToEdit.issuer.document || "");
        setIssuerPhone(proposalToEdit.issuer.phone || "");
        setIssuerEmail(proposalToEdit.issuer.email || "");
        setIssuerAddress(proposalToEdit.issuer.address || "");
        setIssuerLogoUrl(proposalToEdit.issuer.logoUrl || "");
      }
    } else if (!proposalToEdit && isOpen) {
      // NOVA PROPOSTA: Nasce 100% limpa e zerada, sem dados fictícios
      setCode(`PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setTitle("");
      setClientName("");
      setClientCompany("");
      setClientEmail("");
      setClientPhone("");
      setSellerName("");
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setValidUntil(d.toISOString().split("T")[0]);
      setPaymentMethod("50% Entrada + 50% na Entrega");
      setNotes("");
      setIssuerName("");
      setIssuerDocument("");
      setIssuerPhone("");
      setIssuerEmail("");
      setIssuerAddress("");
      setIssuerLogoUrl("");
      setItems([
        {
          id: `item-${Date.now()}`,
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          total: 0
        }
      ]);
      setGlobalDiscount(0);
    }
  }, [proposalToEdit, isOpen]);

  if (!isOpen) return null;

  // Upload do Logotipo da Empresa Emitente
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setIssuerLogoUrl(result);
      toast.success("Logotipo da empresa carregado com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setIssuerLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast("Logotipo removido.");
  };

  // Atualizar campo de um item dinâmico
  const updateItem = (id: string, field: keyof ProposalItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const disc = Number(updated.discountPercent) || 0;
        const calculated = (qty * price) * (1 - disc / 100);
        updated.total = Math.max(0, calculated);
        return updated;
      })
    );
  };

  // Adicionar novo item dinâmico
  const addItem = () => {
    const newItem: ProposalItem = {
      id: `item-${Date.now()}`,
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      total: 0
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Remover item
  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("A proposta precisa ter pelo menos um item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Totais calculados automaticamente
  const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);
  const finalTotal = Math.max(0, subtotal - Number(globalDiscount || 0));

  const handleSaveProposal = async (status: ProposalStatus) => {
    if (!clientName.trim()) {
      toast.error("Preencha o nome do cliente.");
      return;
    }
    if (!clientEmail.trim() && !clientPhone.trim()) {
      toast.error("Informe pelo menos um contato (e-mail ou telefone).");
      return;
    }
    if (items.length === 0 || subtotal <= 0) {
      toast.error("Adicione itens válidos com valor no orçamento.");
      return;
    }

    setIsSubmitting(true);

    const issuerData: CompanyIssuer = {
      name: issuerName.trim() || "Empresa Emitente",
      document: issuerDocument.trim(),
      phone: issuerPhone.trim(),
      email: issuerEmail.trim(),
      address: issuerAddress.trim(),
      logoUrl: issuerLogoUrl
    };

    // Cache local para próximas propostas
    try {
      localStorage.setItem("versus_proposal_issuer_cache", JSON.stringify(issuerData));
    } catch (e) {
      // Silencioso
    }

    const updatedOrNewProposal: Proposal = {
      id: proposalToEdit ? proposalToEdit.id : `prop-${Date.now()}`,
      code: proposalToEdit ? proposalToEdit.code : code,
      title: title.trim() || "Proposta Comercial",
      clientName: clientName.trim(),
      clientCompany: clientCompany.trim() || undefined,
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      sellerName: sellerName.trim(),
      status: proposalToEdit ? proposalToEdit.status : status,
      items,
      subtotal,
      discountTotal: Number(globalDiscount || 0),
      total: finalTotal,
      paymentMethod,
      validUntil,
      createdAt: proposalToEdit ? proposalToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes.trim(),
      publicLink: proposalToEdit?.publicLink || `https://app.versus.com.br/p/${(proposalToEdit?.code || code).toLowerCase()}`,
      issuer: issuerData
    };

    try {
      await Promise.resolve(onSave(updatedOrNewProposal));
      toast.success(
        proposalToEdit 
          ? "Proposta comercial atualizada com sucesso!"
          : status === "sent" 
          ? "Proposta gerada e pronta para envio!" 
          : "Proposta salva como rascunho!"
      );
      onClose();
    } catch (err) {
      toast.error("Erro ao salvar proposta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0B1224] border border-slate-700/80 shadow-2xl shadow-cyan-950/40 text-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {proposalToEdit ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {proposalToEdit ? "Editar Proposta Comercial" : "Novo Orçamento / Proposta Comercial"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {proposalToEdit 
                  ? "Modifique itens, valores e dados da sua empresa nesta proposta"
                  : "Construa orçamentos profissionais com o logotipo e dados da sua empresa"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Seção 0: Dados da Empresa Emitente & Logotipo (Sua Marca) */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Dados da Empresa Emitente & Logotipo (Sua Marca no PDF)
              </h3>
              <span className="text-[11px] text-blue-400/80 font-medium">
                Estampado no cabeçalho do documento
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Box de Upload do Logotipo */}
              <div className="md:col-span-4 p-3.5 rounded-xl bg-[#070D1B] border border-slate-700/80 flex flex-col items-center justify-center text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {issuerLogoUrl ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <div className="h-20 max-w-full flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={issuerLogoUrl}
                        alt="Logotipo da empresa"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                      >
                        Trocar Logo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 px-2 flex flex-col items-center space-y-2 w-full">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">Logotipo da Empresa</p>
                      <p className="text-[10px] text-slate-400">PNG, JPG ou SVG (máx. 2MB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Fazer Upload
                    </button>
                  </div>
                )}
              </div>

              {/* Campos Textuais do Emitente */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Nome Fantasia / Razão Social
                  </label>
                  <input
                    type="text"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    placeholder="Ex: Clínica Sorriso & Estética"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    value={issuerDocument}
                    onChange={(e) => setIssuerDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Telefone Comercial / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={issuerPhone}
                    onChange={(e) => setIssuerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    value={issuerEmail}
                    onChange={(e) => setIssuerEmail(e.target.value)}
                    placeholder="comercial@suaempresa.com.br"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={issuerAddress}
                    onChange={(e) => setIssuerAddress(e.target.value)}
                    placeholder="Rua, Número, Sala/Andar, Bairro, Cidade - UF"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 1: Dados do Cliente & Proposta */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Dados do Cliente & Proposta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Título da Proposta
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Proposta de Consultoria e Automação"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome do Cliente / Decisor <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silveira"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Empresa / Razão Social do Cliente
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Ex: Nexus Logística & Distribuição"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  WhatsApp / Celular Comercial
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  E-mail do Cliente
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="carlos@nexuslog.com.br"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Validade da Proposta
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white [color-scheme:dark] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Itens do Orçamento */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                Itens & Serviços Orçados
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#070D1B] border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-4">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Item / Serviço #{index + 1}
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      placeholder="Nome do produto ou serviço"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Preço Unit. (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Desc. (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discountPercent || 0}
                      onChange={(e) => updateItem(item.id, "discountPercent", e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between gap-2 pt-4 md:pt-0">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Subtotal</span>
                      <span className="text-sm font-bold text-blue-400">
                        R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totais & Desconto Geral */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-300 font-medium">
                  Desconto Global (R$):
                </label>
                <input
                  type="number"
                  min={0}
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-28 px-2 py-1 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-6 self-end md:self-auto">
                <div className="text-right">
                  <span className="text-xs text-slate-400">Subtotal Bruto:</span>
                  <p className="text-sm text-slate-200">
                    R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <span className="text-[11px] uppercase tracking-wider text-blue-400 font-semibold">
                    Valor Total da Proposta
                  </span>
                  <p className="text-xl font-extrabold text-white">
                    R$ {finalTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Condição de Pagamento e Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Condição de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="50% Entrada + 50% na Entrega">50% Entrada + 50% na Entrega</option>
                <option value="À Vista com 5% de Desconto">À Vista com 5% de Desconto</option>
                <option value="3x no Boleto Faturado (30/60/90 dias)">3x no Boleto Faturado (30/60/90 dias)</option>
                <option value="Recorrência Mensal (SaaS/Serviço)">Recorrência Mensal (SaaS/Serviço)</option>
                <option value="Cartão de Crédito em até 12x">Cartão de Crédito em até 12x</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Vendedor / Consultor Responsável
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Termos Comerciais, Escopo & Garantia
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes adicionais de SLA, garantia ou escopo do projeto..."
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Descartar
          </button>

          <div className="flex items-center gap-3">
            {!proposalToEdit && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSaveProposal("draft")}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Salvar como Rascunho
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveProposal(proposalToEdit?.status || "sent")}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40 transition-all disabled:opacity-50 cursor-pointer"
            >
              {proposalToEdit ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  {isSubmitting ? "Salvando Alterações..." : "Salvar Alterações"}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting ? "Gerando Proposta..." : "Gerar Proposta & Link de Aceite"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
