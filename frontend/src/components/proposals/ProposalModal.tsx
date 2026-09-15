"use client";

import React, { useState } from "react";
import { 
  X, Plus, Trash2, FileText, DollarSign, Calendar, User, 
  Building2, Mail, Phone, ShieldCheck, Sparkles, CheckCircle2 
} from "lucide-react";
import { Proposal, ProposalItem } from "@/types/commercial";
import toast from "react-hot-toast";

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proposal: Proposal) => void;
}

export function ProposalModal({ isOpen, onClose, onSave }: ProposalModalProps) {
  // Gerar código inicial da proposta
  const [code] = useState(() => `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // Dados do cliente
  const [title, setTitle] = useState("Proposta de Prestação de Serviços Digitais");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [sellerName, setSellerName] = useState("Equipe Comercial VERSUS");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [paymentMethod, setPaymentMethod] = useState("50% Entrada + 50% na Entrega");
  const [notes, setNotes] = useState("A proposta inclui implementação assistida, suporte prioritário e garantia técnica de 90 dias após entrega final.");

  // Itens dinâmicos do orçamento
  const [items, setItems] = useState<ProposalItem[]>([
    {
      id: "item-1",
      name: "Implantação Plataforma VERSUS Pro",
      description: "Setup completo de canais WhatsApp, agentes de IA e treinamento de equipe",
      quantity: 1,
      unitPrice: 4500,
      discountPercent: 0,
      total: 4500
    },
    {
      id: "item-2",
      name: "Licenciamento Anual (10 Usuários)",
      description: "Acesso contínuo com SLA de 99.9% e automações ilimitadas",
      quantity: 1,
      unitPrice: 7200,
      discountPercent: 10,
      total: 6480
    }
  ]);

  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

  const handleSaveProposal = (status: "draft" | "sent") => {
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

    const newProposal: Proposal = {
      id: `prop-${Date.now()}`,
      code,
      title: title.trim() || "Proposta Comercial",
      clientName: clientName.trim(),
      clientCompany: clientCompany.trim() || undefined,
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      sellerName: sellerName.trim(),
      status,
      items,
      subtotal,
      discountTotal: Number(globalDiscount || 0),
      total: finalTotal,
      paymentMethod,
      validUntil,
      createdAt: new Date().toISOString(),
      notes: notes.trim(),
      publicLink: `https://app.versus.com.br/p/${code.toLowerCase()}`
    };

    setTimeout(() => {
      onSave(newProposal);
      setIsSubmitting(false);
      toast.success(
        status === "sent" 
          ? "Proposta gerada e pronta para envio!" 
          : "Proposta salva como rascunho!"
      );
      onClose();
    }, 400);
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Novo Orçamento / Proposta Comercial
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Construa propostas inteligentes com cálculo de margens e link de aceite
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

        {/* Corpo rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Seção 1: Informações Gerais */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
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
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Empresa / Razão Social
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Ex: Nexus Logística & Distribuição"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white [color-scheme:dark] focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Itens do Orçamento */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                Itens & Serviços Orçados
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
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
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
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
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between gap-2 pt-4 md:pt-0">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase">Subtotal</span>
                      <span className="text-sm font-bold text-cyan-400">
                        R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
                  className="w-28 px-2 py-1 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-6 self-end md:self-auto">
                <div className="text-right">
                  <span className="text-xs text-slate-400">Subtotal Bruto:</span>
                  <p className="text-sm text-slate-200">
                    R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                  <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold">
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
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
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
                Vendedor Responsável
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
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
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Descartar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveProposal("draft")}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Salvar como Rascunho
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveProposal("sent")}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? "Gerando Proposta..." : "Gerar Proposta & Link de Aceite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
