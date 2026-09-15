"use client";

import React from "react";
import { 
  X, Copy, Check, Printer, Send, ExternalLink, Calendar, 
  User, CheckCircle2, XCircle, Clock, ShieldCheck, FileText, ArrowUpRight
} from "lucide-react";
import { Proposal } from "@/types/commercial";
import toast from "react-hot-toast";

interface ProposalPreviewModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: Proposal["status"]) => void;
}

export function ProposalPreviewModal({
  proposal,
  isOpen,
  onClose,
  onStatusChange
}: ProposalPreviewModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !proposal) return null;

  const copyLink = () => {
    const link = proposal.publicLink || `https://app.versus.com.br/p/${proposal.code.toLowerCase()}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link público de aceite copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareViaWhatsApp = () => {
    const link = proposal.publicLink || `https://app.versus.com.br/p/${proposal.code.toLowerCase()}`;
    const cleanPhone = (proposal.clientPhone || "").replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá ${proposal.clientName}! Segue a proposta comercial oficial (${proposal.code}) elaborada para você no valor de R$ ${proposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.\n\nVocê pode analisar todos os detalhes e assinar digitalmente pelo link seguro: ${link}\n\nFicamos à disposição para quaisquer dúvidas!`
    );
    const targetUrl = cleanPhone 
      ? `https://wa.me/55${cleanPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(targetUrl, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: Proposal["status"]) => {
    switch (status) {
      case "accepted":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Aceita & Aprovada
          </span>
        );
      case "viewed":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Visualizada pelo Cliente
          </span>
        );
      case "sent":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Enviada ao Cliente
          </span>
        );
      case "declined":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Proposta Recusada
          </span>
        );
      case "expired":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Validade Expirada
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Rascunho
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      <div 
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0B1224] border border-slate-700/80 shadow-2xl text-slate-200 overflow-hidden print:max-w-none print:max-h-none print:border-0 print:bg-white print:text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior de Ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white tracking-wide font-mono">
              {proposal.code}
            </span>
            {getStatusBadge(proposal.status)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Copiar link público de aceite"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Copiar Link"}
            </button>

            <button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
              title="Enviar mensagem no WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors"
              title="Imprimir ou Salvar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              PDF / Imprimir
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Espelho do Documento de Proposta */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-8 print:space-y-4">
          {/* Header da Proposta Comercial */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-6 print:border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 print:text-black">
                  VERSUS
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase font-mono tracking-wider print:border-gray-300 print:text-black">
                  COMMERCIAL SUITE
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600">
                Plataforma de Comunicação Omnichannel & Inteligência Comercial
              </p>
              <p className="text-xs text-slate-500 print:text-gray-500">
                CNPJ: 45.123.890/0001-22 • contato@versus.com.br
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider print:text-gray-600">
                Identificador da Proposta
              </span>
              <p className="text-lg font-mono font-bold text-white print:text-black">
                {proposal.code}
              </p>
              <p className="text-xs text-slate-400 print:text-gray-600">
                Data: {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-xs text-amber-400 font-medium print:text-gray-800">
                Validade até: {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Dados do Cliente e Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 print:bg-transparent print:border-gray-300">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 print:text-gray-600">
                Destinatário / Contratante
              </span>
              <h4 className="text-base font-bold text-white print:text-black">
                {proposal.clientName}
              </h4>
              {proposal.clientCompany && (
                <p className="text-xs text-cyan-400 font-medium print:text-gray-700">
                  {proposal.clientCompany}
                </p>
              )}
              <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                {proposal.clientEmail} • {proposal.clientPhone}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 print:text-gray-600">
                Responsável Comercial
              </span>
              <h4 className="text-base font-bold text-white print:text-black">
                {proposal.sellerName}
              </h4>
              <p className="text-xs text-slate-400 print:text-gray-600">
                Condição: <span className="text-slate-200 font-semibold print:text-black">{proposal.paymentMethod}</span>
              </p>
            </div>
          </div>

          {/* Tabela de Itens e Serviços */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 print:text-gray-700">
              Detalhamento de Itens & Escopo
            </h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden print:border-gray-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="p-3">Descrição do Serviço / Produto</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-right">Valor Unit.</th>
                    <th className="p-3 text-right">Desc.</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                  {proposal.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 print:text-black">
                      <td className="p-3">
                        <div className="font-semibold text-slate-100 print:text-black">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 print:text-gray-600 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-300 print:text-black">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right text-slate-300 print:text-black">
                        R$ {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right text-slate-400 print:text-gray-600">
                        {item.discountPercent ? `${item.discountPercent}%` : "-"}
                      </td>
                      <td className="p-3 text-right font-semibold text-cyan-400 print:text-black">
                        R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="flex-1 text-xs text-slate-400 space-y-1 print:text-gray-600">
              <span className="font-semibold uppercase tracking-wider text-slate-300 block mb-1 print:text-black">
                Observações e Garantias
              </span>
              <p>{proposal.notes || "Proposta válida sob condições gerais de fornecimento VERSUS."}</p>
            </div>

            <div className="w-full sm:w-64 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-right print:border-gray-300 print:bg-transparent">
              <div className="flex justify-between text-xs text-slate-400 print:text-gray-700">
                <span>Subtotal:</span>
                <span>R$ {proposal.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              {proposal.discountTotal > 0 && (
                <div className="flex justify-between text-xs text-rose-400 print:text-gray-800">
                  <span>Desconto Global:</span>
                  <span>- R$ {proposal.discountTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-bold text-white print:text-black">
                <span>Total Final:</span>
                <span className="text-cyan-400 text-base font-extrabold print:text-black">
                  R$ {proposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé de Aceite Simulado */}
          <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-between gap-4 print:border-gray-400">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-cyan-400 print:text-black" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block print:text-black">
                  Assinatura Digital & Aceite Eletrônico
                </span>
                <span className="text-[11px] text-slate-400 print:text-gray-600">
                  Documento com autenticação e trilha de auditoria digital conforme ICP-Brasil e MP 2.200-2/2001.
                </span>
              </div>
            </div>

            <div className="hidden sm:block text-right print:hidden">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Link de Acesso Seguro</span>
              <a
                href={proposal.publicLink || `https://app.versus.com.br/p/${proposal.code.toLowerCase()}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-cyan-400 hover:underline flex items-center gap-1 justify-end"
              >
                Abrir Portal do Cliente <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Rodapé de Mudança Rápida de Status (Workflow Comercial) */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <span className="text-xs text-slate-400">
            Alterar status comercial:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onStatusChange(proposal.id, "sent");
                toast.success("Status atualizado para 'Enviada'!");
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
            >
              Marcar Enviada
            </button>
            <button
              onClick={() => {
                onStatusChange(proposal.id, "accepted");
                toast.success("Parabéns! Proposta marcada como 'Aceita'!");
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors font-semibold"
            >
              Marcar Aceita
            </button>
            <button
              onClick={() => {
                onStatusChange(proposal.id, "declined");
                toast("Proposta marcada como recusada.");
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
            >
              Marcar Recusada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
