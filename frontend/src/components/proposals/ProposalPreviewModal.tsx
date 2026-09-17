"use client";

import React from "react";
import { 
  X, Copy, Check, Printer, Send, ExternalLink, Calendar, 
  User, CheckCircle2, XCircle, Clock, ShieldCheck, FileText, ArrowUpRight,
  Edit3, Building2, MapPin, Phone, Mail
} from "lucide-react";
import { Proposal } from "@/types/commercial";
import toast from "react-hot-toast";

interface ProposalPreviewModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: Proposal["status"]) => void;
  onEdit?: (proposal: Proposal) => void;
}

export function ProposalPreviewModal({
  proposal,
  isOpen,
  onClose,
  onStatusChange,
  onEdit
}: ProposalPreviewModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !proposal) return null;

  const getOrigin = () => {
    return typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://verus-alpha.vercel.app");
  };

  const copyLink = () => {
    const origin = getOrigin();
    const link = proposal.publicLink || `${origin}/p/${proposal.code.toLowerCase()}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link público de aceite copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareViaWhatsApp = () => {
    const origin = getOrigin();
    const link = proposal.publicLink || `${origin}/p/${proposal.code.toLowerCase()}`;
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

  // Dados do emitente
  const issuer = {
    name: proposal.issuer?.name || "VERSUS Tecnologia & Soluções",
    document: proposal.issuer?.document || "",
    phone: proposal.issuer?.phone || "",
    email: proposal.issuer?.email || "",
    address: proposal.issuer?.address || "",
    logoUrl: proposal.logoUrl || proposal.issuer?.logoUrl || "",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
      <div 
        id="proposal-print-area"
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0B1224] border border-slate-700/80 shadow-2xl text-slate-200 overflow-hidden print:w-full print:max-w-none print:max-h-none print:h-auto print:border-0 print:bg-white print:text-black print:shadow-none print:rounded-none print:static print:overflow-visible print:p-0 print:block"
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
            {/* Botão de Edição Rápida */}
            {onEdit && (
              <button
                onClick={() => onEdit(proposal)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-950/40 transition-colors cursor-pointer"
                title="Editar itens, dados da empresa ou condições desta proposta"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar Proposta
              </button>
            )}

            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Copiar link público de aceite"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Copiar Link"}
            </button>

            <button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
              title="Enviar mensagem no WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Imprimir ou Salvar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              PDF / Imprimir
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Espelho do Documento de Proposta */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 print:p-0 print:space-y-3 print:overflow-visible print:block">
          {/* Header da Proposta Comercial com Logotipo e Dados do Emitente (Sua Marca) */}
          <div className="flex flex-row justify-between items-start gap-4 border-b border-slate-800 pb-4 print:border-slate-300 print:pb-3 print-avoid-break">
            {/* Bloco do Emitente (Logotipo + Informações da Empresa Vendedora) */}
            <div className="space-y-1.5 max-w-md">
              {issuer.logoUrl ? (
                <div className="h-12 flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={issuer.logoUrl}
                    alt={issuer.name}
                    className="max-h-full max-w-[200px] object-contain rounded"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm print:border-slate-400 print:text-black">
                    {issuer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-white print:text-black">
                    {issuer.name}
                  </h3>
                </div>
              )}

              {issuer.logoUrl && (
                <h3 className="text-sm font-bold text-white print:text-black">
                  {issuer.name}
                </h3>
              )}

              <div className="text-[11px] text-slate-400 print:text-slate-600 space-y-0.5">
                {issuer.document && (
                  <p>CNPJ/CPF: <strong className="text-slate-300 print:text-black">{issuer.document}</strong></p>
                )}
                {(issuer.phone || issuer.email) && (
                  <p>
                    {issuer.phone && <span>{issuer.phone}</span>}
                    {issuer.phone && issuer.email && <span> • </span>}
                    {issuer.email && <span>{issuer.email}</span>}
                  </p>
                )}
                {issuer.address && (
                  <p className="text-[10px] text-slate-500 print:text-slate-500">
                    {issuer.address}
                  </p>
                )}
              </div>
            </div>

            {/* Identificação e Validade da Proposta */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider print:text-slate-600">
                Proposta Comercial Oficial
              </span>
              <p className="text-lg font-mono font-extrabold text-white print:text-black">
                {proposal.code}
              </p>
              <p className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                Data: {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-[11px] text-amber-400 font-semibold print:text-slate-800">
                Válida até: {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Dados do Cliente / Contratante */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800 print:bg-transparent print:border-slate-300 print:p-2.5 print-avoid-break">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600">
                Destinatário / Contratante
              </span>
              <h4 className="text-sm font-bold text-white print:text-black">
                {proposal.clientName}
              </h4>
              {proposal.clientCompany && (
                <p className="text-xs text-blue-400 font-medium print:text-slate-700">
                  {proposal.clientCompany}
                </p>
              )}
              <p className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                {proposal.clientEmail} {proposal.clientPhone && `• ${proposal.clientPhone}`}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600">
                Consultor Responsável
              </span>
              <h4 className="text-sm font-bold text-white print:text-black">
                {proposal.sellerName}
              </h4>
              <p className="text-[11px] text-slate-400 print:text-slate-600">
                Condição: <span className="text-slate-200 font-semibold print:text-black">{proposal.paymentMethod}</span>
              </p>
            </div>
          </div>

          {/* Tabela de Itens e Serviços */}
          <div className="print-avoid-break">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 print:text-slate-700">
              Detalhamento de Itens & Escopo Fornecido
            </h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden print:border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                  <tr>
                    <th className="p-2.5">Descrição do Serviço / Produto</th>
                    <th className="p-2.5 text-center">Qtd</th>
                    <th className="p-2.5 text-right">Valor Unit.</th>
                    <th className="p-2.5 text-right">Desc.</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {proposal.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 print:text-slate-900">
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-100 print:text-black">{item.name}</div>
                        {item.description && item.description !== item.name && (
                          <div className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center text-slate-300 print:text-slate-900 font-mono">
                        {item.quantity}
                      </td>
                      <td className="p-2.5 text-right text-slate-300 print:text-slate-900 font-mono">
                        R$ {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right text-slate-400 print:text-slate-600 font-mono">
                        {item.discountPercent ? `${item.discountPercent}%` : "-"}
                      </td>
                      <td className="p-2.5 text-right font-bold text-blue-400 print:text-black font-mono">
                        R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="flex flex-row justify-between items-start gap-4 pt-1 print-avoid-break">
            <div className="flex-1 text-[11px] text-slate-400 space-y-1 print:text-slate-600">
              <span className="font-semibold uppercase tracking-wider text-slate-300 block mb-0.5 print:text-black">
                Observações, Termos & Garantia
              </span>
              <p className="leading-relaxed">{proposal.notes || "Proposta válida sob condições gerais acordadas entre as partes."}</p>
            </div>

            <div className="w-56 p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-right print:border-slate-300 print:bg-transparent print:p-2.5">
              <div className="flex justify-between text-xs text-slate-400 print:text-slate-700">
                <span>Subtotal:</span>
                <span className="font-mono">R$ {proposal.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              {proposal.discountTotal > 0 && (
                <div className="flex justify-between text-xs text-rose-400 print:text-slate-800">
                  <span>Desconto:</span>
                  <span className="font-mono">- R$ {proposal.discountTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t border-slate-800 print:border-slate-300 pt-1.5 flex justify-between items-center text-sm font-bold text-white print:text-black">
                <span>Total Final:</span>
                <span className="text-blue-400 text-base font-extrabold print:text-black font-mono">
                  R$ {proposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé de Aceite e Autenticação Eletrônica */}
          <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between gap-4 print:border-slate-300 print:p-2.5 print-avoid-break">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-400 print:text-black shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-200 block print:text-black">
                  Assinatura Eletrônica & Aceite Digital
                </span>
                <span className="text-[10px] text-slate-400 print:text-slate-600">
                  Documento emitido com autenticação digital e conformidade MP 2.200-2/2001.
                </span>
              </div>
            </div>

            <div className="hidden sm:block text-right print:hidden">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Link de Acesso Seguro</span>
              <a
                href={proposal.publicLink || `${getOrigin()}/p/${proposal.code.toLowerCase()}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-blue-400 hover:underline flex items-center gap-1 justify-end"
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
              className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
            >
              Marcar Enviada
            </button>
            <button
              onClick={() => {
                onStatusChange(proposal.id, "accepted");
                toast.success("Parabéns! Proposta marcada como 'Aceita'!");
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors font-semibold cursor-pointer"
            >
              Marcar Aceita
            </button>
            <button
              onClick={() => {
                onStatusChange(proposal.id, "declined");
                toast("Proposta marcada como recusada.");
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
            >
              Marcar Recusada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
