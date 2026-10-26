"use client";

import React from "react";
import { 
  X, Copy, Check, Printer, Send, ExternalLink, Calendar, 
  User, CheckCircle2, XCircle, Clock, ShieldCheck, FileText, ArrowUpRight,
  Edit3, Building2, MapPin, Phone, Mail, Image as ImageIcon, ZoomIn, Download
} from "lucide-react";
import { Proposal } from "@/types/commercial";
import { getDriveThumbnailUrl } from "@/lib/googleDriveHelper";
import { getPublicProposalUrl } from "@/lib/proposalUrlHelper";
import toast from "react-hot-toast";
import ModalPortal from "@/components/ui/ModalPortal";

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
  const [zoomImageUrl, setZoomImageUrl] = React.useState<string | null>(null);

  if (!isOpen || !proposal) return null;

  const publicProposalUrl = getPublicProposalUrl(proposal.code, proposal.publicLink);

  const copyLink = () => {
    navigator.clipboard.writeText(publicProposalUrl);
    setCopied(true);
    toast.success("Link público copiado!");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareViaWhatsApp = () => {
    const cleanPhone = (proposal.clientPhone || "").replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá ${proposal.clientName}! Segue a proposta comercial oficial (${proposal.code}) elaborada para você no valor de R$ ${proposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.\n\nVocê pode analisar todos os detalhes e assinar digitalmente pelo link seguro: ${publicProposalUrl}\n\nFicamos à disposição para quaisquer dúvidas!`
    );
    const targetUrl = cleanPhone 
      ? `https://wa.me/55${cleanPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(targetUrl, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadOfficialPdf = () => {
    window.open(`/api-backend/proposals/${proposal.id}/pdf`, "_blank");
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
    name: proposal.issuer?.name || "Vallor Tecnologia & Soluções",
    document: proposal.issuer?.document || "",
    phone: proposal.issuer?.phone || "",
    email: proposal.issuer?.email || "",
    address: proposal.issuer?.address || "",
    logoUrl: proposal.logoUrl || proposal.issuer?.logoUrl || "",
  };

  return (
    <ModalPortal>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body, html {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #proposal-print-area {
            background-color: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          #proposal-print-area * {
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          #proposal-print-area .text-slate-500,
          #proposal-print-area .text-slate-400,
          #proposal-print-area .text-slate-600 {
            color: #475569 !important;
          }
          #proposal-print-area .text-blue-600,
          #proposal-print-area .text-blue-400 {
            color: #1e40af !important;
          }
          #proposal-print-area th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto">
      <div 
        id="proposal-print-area"
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-700/80 shadow-2xl text-slate-800 dark:text-slate-200 overflow-hidden print:w-full print:max-w-none print:max-h-none print:h-auto print:border-0 print:bg-white print:text-black print:shadow-none print:rounded-none print:static print:overflow-visible print:p-0 print:block"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior de Ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide font-mono">
              {proposal.code}
            </span>
            {getStatusBadge(proposal.status)}
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Edição Rápida */}
            {onEdit && (
              <button
                onClick={() => onEdit(proposal)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
                title="Editar itens, dados da empresa ou condições desta proposta"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar Proposta
              </button>
            )}

            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-sm"
              title="Copiar link público de aceite"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Copiar Link"}
            </button>

            <button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition-colors cursor-pointer shadow-sm"
              title="Enviar mensagem no WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              onClick={handleDownloadOfficialPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 transition-colors cursor-pointer shadow-sm"
              title="Baixar arquivo PDF profissional formatado"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Oficial
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-sm"
              title="Imprimir direto do navegador"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Espelho do Documento de Proposta */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 print:p-0 print:space-y-3 print:overflow-visible print:block">
          {/* Header da Proposta Comercial com Logotipo e Dados do Emitente (Sua Marca) */}
          <div className="flex flex-row justify-between items-start gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:border-slate-300 print:pb-3 print-avoid-break">
            {/* Bloco do Emitente (Logotipo Maior + Informações da Empresa Vendedora com Alto Contraste) */}
            <div className="space-y-2 max-w-md">
              {issuer.logoUrl ? (
                <div className="h-16 sm:h-20 flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={issuer.logoUrl}
                    alt={issuer.name}
                    className="max-h-full max-w-[260px] object-contain rounded"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-base print:border-slate-400 print:text-black">
                    {issuer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                    {issuer.name}
                  </h3>
                </div>
              )}

              {issuer.logoUrl && (
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white print:text-black">
                  {issuer.name}
                </h3>
              )}

              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium print:text-slate-900 space-y-0.5">
                {issuer.document && (
                  <p>CNPJ/CPF: <strong className="text-slate-900 dark:text-white print:text-black font-bold">{issuer.document}</strong></p>
                )}
                {(issuer.phone || issuer.email) && (
                  <p>
                    {issuer.phone && <span><strong>Tel:</strong> {issuer.phone}</span>}
                    {issuer.phone && issuer.email && <span> • </span>}
                    {issuer.email && <span><strong>E-mail:</strong> {issuer.email}</span>}
                  </p>
                )}
                {issuer.address && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-700">
                    {issuer.address}
                  </p>
                )}
              </div>
            </div>

            {/* Identificação e Validade da Proposta */}
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white text-[10.5px] uppercase tracking-wider font-extrabold print:bg-slate-900 print:text-white">
                Proposta Comercial Oficial
              </span>
              <p className="text-xl font-mono font-black text-slate-900 dark:text-white print:text-black mt-1">
                {proposal.code}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold print:text-slate-800 mt-1">
                Data: {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-extrabold print:text-slate-900">
                Válida até: {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Dados do Cliente / Contratante com Cores e Destaque Executivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:p-0 print-avoid-break">
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/25 border-l-4 border-l-blue-600 border border-blue-200 dark:border-blue-900/40 print:bg-blue-50/40 print:border-blue-300">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 print:text-blue-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Destinatário / Contratante
              </span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white print:text-black mt-1">
                {proposal.clientName}
              </h4>
              {proposal.clientCompany && (
                <p className="text-xs text-blue-700 dark:text-blue-400 font-bold print:text-blue-900">
                  {proposal.clientCompany}
                </p>
              )}
              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium print:text-slate-900 mt-1 space-y-0.5">
                {proposal.clientEmail && <div><strong>E-mail:</strong> {proposal.clientEmail}</div>}
                {proposal.clientPhone && <div><strong>Tel/WhatsApp:</strong> {proposal.clientPhone}</div>}
              </div>
              {(proposal.clientCep || proposal.clientAddress) && (
                <div className="text-xs text-slate-800 dark:text-slate-200 font-semibold print:text-black mt-2 pt-2 border-t border-dashed border-blue-200 dark:border-blue-900/50 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 print:hidden" />
                  <span>
                    {proposal.clientCep && <strong>CEP: {proposal.clientCep} </strong>}
                    {proposal.clientAddress && <span>• {proposal.clientAddress}</span>}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/25 border-l-4 border-l-emerald-600 border border-emerald-200 dark:border-emerald-900/40 print:bg-emerald-50/40 print:border-emerald-300">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 print:text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Consultor & Condições
              </span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white print:text-black mt-1">
                {proposal.sellerName || "Equipe Comercial"}
              </h4>
              <div className="mt-2 text-xs">
                <span className="text-emerald-800 dark:text-emerald-400 font-bold">Condição de Pagamento:</span>
                <p className="text-slate-900 dark:text-white font-extrabold print:text-black mt-0.5 text-sm">
                  {proposal.paymentMethod || "A combinar"}
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Itens e Serviços */}
          <div className="print-avoid-break">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 print:text-slate-700">
              Detalhamento de Itens & Escopo Fornecido
            </h4>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                  <tr>
                    <th className="p-3">Descrição do Serviço / Produto</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-right">Valor Unit.</th>
                    <th className="p-3 text-right">Desc.</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 print:divide-slate-200">
                  {proposal.items.map((item) => {
                    const thumb = item.imageUrl ? (getDriveThumbnailUrl(item.imageUrl, 200) || item.imageUrl) : null;
                    const highResThumb = item.imageUrl ? (getDriveThumbnailUrl(item.imageUrl, 1200) || item.imageUrl) : null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 print:text-slate-900">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {thumb && (
                              <div
                                onClick={() => setZoomImageUrl(highResThumb)}
                                className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-xs print:w-10 print:h-10 print:rounded-md"
                                title="Clique para ampliar a foto do produto"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={thumb}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">
                                {item.name}
                              </div>
                              {item.description && item.description !== item.name && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5 line-clamp-2">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center text-slate-700 dark:text-slate-300 print:text-slate-900 font-mono">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right text-slate-700 dark:text-slate-300 print:text-slate-900 font-mono">
                          R$ {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right text-slate-500 dark:text-slate-400 print:text-slate-600 font-mono">
                          {item.discountPercent ? `${item.discountPercent}%` : "-"}
                        </td>
                        <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400 print:text-black font-mono">
                          R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="flex flex-row justify-between items-start gap-4 pt-1 print-avoid-break">
            <div className="flex-1 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 print:text-slate-600">
              <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-0.5 print:text-black">
                Observações, Termos & Garantia
              </span>
              <p className="leading-relaxed">{proposal.notes || "Proposta válida sob condições gerais acordadas entre as partes."}</p>
            </div>

            <div className="w-60 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-right print:border-slate-300 print:bg-transparent print:p-2.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 print:text-slate-700">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">R$ {proposal.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              {proposal.discountTotal > 0 && (
                <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 print:text-slate-800">
                  <span>Desconto:</span>
                  <span className="font-mono font-semibold">- R$ {proposal.discountTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-slate-800 print:border-slate-300 pt-2 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white print:text-black">
                <span>Total Final:</span>
                <span className="text-blue-600 dark:text-blue-400 text-base font-black print:text-black font-mono">
                  R$ {proposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé de Aceite e Autenticação Eletrônica */}
          <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/5 flex items-center justify-between gap-4 print:border-slate-300 print:p-2.5 print-avoid-break">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 print:text-black shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block print:text-black">
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
                href={proposal.publicLink || `${typeof window !== "undefined" ? window.location.origin : ""}/p/${proposal.code.toLowerCase()}`}
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

    {/* LIGHTBOX DE VISUALIZAÇÃO AMPLIADA DA FOTO DO PRODUTO */}
    {zoomImageUrl && (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        onClick={() => setZoomImageUrl(null)}
      >
        <div className="relative max-w-3xl max-h-[85vh] p-2 flex flex-col items-center">
          <button
            onClick={() => setZoomImageUrl(null)}
            className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fechar ampliação"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImageUrl}
            alt="Foto do produto em alta resolução"
            className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )}
    </ModalPortal>
  );
}
