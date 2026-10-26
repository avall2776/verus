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

import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme, isClean, isDark, isWhatsApp } = useTheme();
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
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:block print:w-full print:h-auto transition-colors ${
        isClean ? "bg-slate-900/40" : isWhatsApp ? "bg-black/80" : "bg-black/85"
      }`}>
      <div 
        id="proposal-print-area"
        className={`relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden print:w-full print:max-w-none print:max-h-none print:h-auto print:border-0 print:bg-white print:text-black print:shadow-none print:rounded-none print:static print:overflow-visible print:p-0 print:block transition-colors ${
          isClean 
            ? "bg-white border-slate-200 text-slate-800 shadow-slate-300/50" 
            : isWhatsApp 
              ? "bg-[#111B21] border-[#222D34] text-[#E9EDEF]" 
              : "bg-[#0B1224] border-slate-700/80 text-slate-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra Superior de Ações */}
        <div className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b print:hidden transition-colors ${
          isClean 
            ? "border-slate-200 bg-slate-50 text-slate-900" 
            : isWhatsApp 
              ? "border-[#222D34] bg-[#182229] text-[#E9EDEF]" 
              : "border-slate-800/80 bg-slate-900/80 text-white"
        }`}>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold tracking-wide font-mono ${
              isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
            }`}>
              {proposal.code}
            </span>
            {getStatusBadge(proposal.status)}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão de Edição Rápida */}
            {onEdit && (
              <button
                onClick={() => onEdit(proposal)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white shadow-xs transition-colors cursor-pointer ${
                  isWhatsApp ? "bg-[#00A884] hover:bg-[#008f6f]" : "bg-blue-600 hover:bg-blue-500"
                }`}
                title="Editar itens, dados da empresa ou condições desta proposta"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar Proposta
              </button>
            )}

            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer shadow-xs ${
                isClean 
                  ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200" 
                  : isWhatsApp 
                    ? "bg-[#202C33] hover:bg-[#2a3942] text-[#E9EDEF] border-[#222D34]" 
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
              title="Copiar link público de aceite"
            >
              {copied ? (
                <Check className={`w-3.5 h-3.5 ${isWhatsApp ? "text-[#00A884]" : "text-emerald-500"}`} />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copiado!" : "Copiar Link"}
            </button>

            <button
              onClick={shareViaWhatsApp}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer shadow-xs ${
                isClean 
                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200" 
                  : isWhatsApp 
                    ? "bg-[#00A884]/20 hover:bg-[#00A884]/30 text-[#00A884] border-[#00A884]/40" 
                    : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30"
              }`}
              title="Enviar mensagem no WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              onClick={handleDownloadOfficialPdf}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer shadow-xs ${
                isClean 
                  ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200" 
                  : isWhatsApp 
                    ? "bg-[#202C33] hover:bg-[#2a3942] text-[#00A884] border-[#00A884]/40" 
                    : "bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30"
              }`}
              title="Baixar arquivo PDF profissional formatado"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Oficial
            </button>

            <button
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer shadow-xs ${
                isClean 
                  ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200" 
                  : isWhatsApp 
                    ? "bg-[#202C33] hover:bg-[#2a3942] text-[#E9EDEF] border-[#222D34]" 
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
              title="Imprimir direto do navegador"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors ml-1 cursor-pointer ${
                isClean 
                  ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100" 
                  : isWhatsApp 
                    ? "text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#202C33]" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Espelho do Documento de Proposta */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 print:p-0 print:space-y-3 print:overflow-visible print:block">
          {/* Header da Proposta Comercial com Logotipo e Dados do Emitente (Sua Marca) */}
          <div className={`flex flex-row justify-between items-start gap-4 border-b pb-4 print:border-slate-300 print:pb-3 print-avoid-break ${
            isClean ? "border-slate-200" : isWhatsApp ? "border-[#222D34]" : "border-slate-800"
          }`}>
            {/* Bloco do Emitente (Logotipo Maior + Informações da Empresa Vendedora) */}
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
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-base print:border-slate-400 print:text-black ${
                    isClean ? "bg-blue-50 border-blue-200 text-blue-600" : isWhatsApp ? "bg-[#00A884]/20 border-[#00A884]/40 text-[#00A884]" : "bg-blue-500/20 border-blue-500/30 text-blue-400"
                  }`}>
                    {issuer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className={`text-xl font-black tracking-tight print:text-black ${
                    isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
                  }`}>
                    {issuer.name}
                  </h3>
                </div>
              )}

              {issuer.logoUrl && (
                <h3 className={`text-base font-extrabold print:text-black ${
                  isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
                }`}>
                  {issuer.name}
                </h3>
              )}

              <div className={`text-xs font-medium print:text-slate-900 space-y-0.5 ${
                isClean ? "text-slate-700" : isWhatsApp ? "text-[#8696A0]" : "text-slate-300"
              }`}>
                {issuer.document && (
                  <p>CNPJ/CPF: <strong className={`font-bold print:text-black ${
                    isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
                  }`}>{issuer.document}</strong></p>
                )}
                {(issuer.phone || issuer.email) && (
                  <p>
                    {issuer.phone && <span><strong>Tel:</strong> {issuer.phone}</span>}
                    {issuer.phone && issuer.email && <span> • </span>}
                    {issuer.email && <span><strong>E-mail:</strong> {issuer.email}</span>}
                  </p>
                )}
                {issuer.address && (
                  <p className={`text-[11px] print:text-slate-700 ${
                    isClean ? "text-slate-600" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
                  }`}>
                    {issuer.address}
                  </p>
                )}
              </div>
            </div>

            {/* Identificação e Validade da Proposta */}
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-md text-[10.5px] uppercase tracking-wider font-extrabold print:bg-slate-900 print:text-white ${
                isClean ? "bg-slate-900 text-white" : isWhatsApp ? "bg-[#00A884] text-white" : "bg-slate-800 text-white"
              }`}>
                Proposta Comercial Oficial
              </span>
              <p className={`text-xl font-mono font-black print:text-black mt-1 ${
                isClean ? "text-slate-900" : isWhatsApp ? "text-[#00A884]" : "text-white"
              }`}>
                {proposal.code}
              </p>
              <p className={`text-xs font-semibold print:text-slate-800 mt-1 ${
                isClean ? "text-slate-700" : isWhatsApp ? "text-[#8696A0]" : "text-slate-300"
              }`}>
                Data: {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
              </p>
              <p className={`text-xs font-extrabold print:text-slate-900 ${
                isClean ? "text-amber-700" : isWhatsApp ? "text-[#00A884]" : "text-amber-400"
              }`}>
                Válida até: {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Dados do Cliente / Contratante com Cores e Destaque Executivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:p-0 print-avoid-break">
            <div className={`p-4 rounded-xl border-l-4 border transition-colors ${
              isClean 
                ? "bg-blue-50/80 border-l-blue-600 border-blue-200 text-slate-900" 
                : isWhatsApp 
                  ? "bg-[#182229] border-l-[#00A884] border-[#222D34] text-[#E9EDEF]" 
                  : "bg-blue-950/25 border-l-blue-500 border-blue-900/40 text-slate-200"
            }`}>
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isClean ? "text-blue-700" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
              }`}>
                <User className="w-3.5 h-3.5" /> Destinatário / Contratante
              </span>
              <h4 className={`text-base font-extrabold print:text-black mt-1 ${
                isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
              }`}>
                {proposal.clientName}
              </h4>
              {proposal.clientCompany && (
                <p className={`text-xs font-bold ${
                  isClean ? "text-blue-700" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
                }`}>
                  {proposal.clientCompany}
                </p>
              )}
              <div className={`text-xs font-medium print:text-slate-900 mt-1 space-y-0.5 ${
                isClean ? "text-slate-700" : isWhatsApp ? "text-[#8696A0]" : "text-slate-300"
              }`}>
                {proposal.clientEmail && <div><strong>E-mail:</strong> {proposal.clientEmail}</div>}
                {proposal.clientPhone && <div><strong>Tel/WhatsApp:</strong> {proposal.clientPhone}</div>}
              </div>
              {(proposal.clientCep || proposal.clientAddress) && (
                <div className={`text-xs font-semibold print:text-black mt-2 pt-2 border-t border-dashed flex items-start gap-1 ${
                  isClean 
                    ? "border-blue-200 text-slate-800" 
                    : isWhatsApp 
                      ? "border-[#222D34] text-[#E9EDEF]" 
                      : "border-blue-900/50 text-slate-200"
                }`}>
                  <MapPin className={`w-3.5 h-3.5 shrink-0 mt-0.5 print:hidden ${
                    isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
                  }`} />
                  <span>
                    {proposal.clientCep && <strong>CEP: {proposal.clientCep} </strong>}
                    {proposal.clientAddress && <span>• {proposal.clientAddress}</span>}
                  </span>
                </div>
              )}
            </div>

            <div className={`p-4 rounded-xl border-l-4 border transition-colors ${
              isClean 
                ? "bg-emerald-50/80 border-l-emerald-600 border-emerald-200 text-slate-900" 
                : isWhatsApp 
                  ? "bg-[#182229] border-l-[#00A884] border-[#222D34] text-[#E9EDEF]" 
                  : "bg-emerald-950/25 border-l-emerald-500 border-emerald-900/40 text-slate-200"
            }`}>
              <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isClean ? "text-emerald-700" : isWhatsApp ? "text-[#00A884]" : "text-emerald-400"
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" /> Consultor & Condições
              </span>
              <h4 className={`text-base font-extrabold print:text-black mt-1 ${
                isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
              }`}>
                {proposal.sellerName || "Equipe Comercial"}
              </h4>
              <div className="mt-2 text-xs">
                <span className={`font-bold ${
                  isClean ? "text-emerald-800" : isWhatsApp ? "text-[#00A884]" : "text-emerald-400"
                }`}>Condição de Pagamento:</span>
                <p className={`font-extrabold print:text-black mt-0.5 text-sm ${
                  isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
                }`}>
                  {proposal.paymentMethod || "A combinar"}
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Itens e Serviços */}
          <div className="print-avoid-break">
            <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2 print:text-slate-700 ${
              isClean ? "text-slate-600" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
            }`}>
              Detalhamento de Itens & Escopo Fornecido
            </h4>
            <div className={`rounded-2xl border overflow-hidden print:border-slate-300 ${
              isClean ? "border-slate-200" : isWhatsApp ? "border-[#222D34]" : "border-slate-800"
            }`}>
              <table className="w-full text-left text-xs">
                <thead className={`font-bold border-b uppercase print:bg-slate-100 print:text-slate-900 print:border-slate-300 ${
                  isClean 
                    ? "bg-slate-100 text-slate-700 border-slate-200" 
                    : isWhatsApp 
                      ? "bg-[#202C33] text-[#8696A0] border-[#222D34]" 
                      : "bg-slate-900/80 text-slate-400 border-slate-800"
                }`}>
                  <tr>
                    <th className="p-3">Descrição do Serviço / Produto</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-right">Valor Unit.</th>
                    <th className="p-3 text-right">Desc.</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className={`divide-y print:divide-slate-200 ${
                  isClean ? "divide-slate-200" : isWhatsApp ? "divide-[#222D34]" : "divide-slate-800/60"
                }`}>
                  {proposal.items.map((item) => {
                    const thumb = item.imageUrl ? (getDriveThumbnailUrl(item.imageUrl, 200) || item.imageUrl) : null;
                    const highResThumb = item.imageUrl ? (getDriveThumbnailUrl(item.imageUrl, 1200) || item.imageUrl) : null;

                    return (
                      <tr key={item.id} className={`transition-colors print:text-slate-900 ${
                        isClean 
                          ? "hover:bg-slate-50 text-slate-800" 
                          : isWhatsApp 
                            ? "hover:bg-[#182229] text-[#E9EDEF]" 
                            : "hover:bg-slate-900/30 text-slate-200"
                      }`}>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {thumb && (
                              <div
                                onClick={() => setZoomImageUrl(highResThumb)}
                                className={`w-12 h-12 rounded-xl border overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-xs print:w-10 print:h-10 print:rounded-md ${
                                  isClean 
                                    ? "bg-slate-100 border-slate-200" 
                                    : isWhatsApp 
                                      ? "bg-[#202C33] border-[#222D34]" 
                                      : "bg-slate-800 border-slate-700/80"
                                }`}
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
                              <div className={`font-semibold print:text-black ${
                                isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-slate-100"
                              }`}>
                                {item.name}
                              </div>
                              {item.description && item.description !== item.name && (
                                <div className={`text-[10px] mt-0.5 line-clamp-2 print:text-slate-600 ${
                                  isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
                                }`}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right font-mono">
                          R$ {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-3 text-right font-mono ${
                          isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
                        }`}>
                          {item.discountPercent ? `${item.discountPercent}%` : "-"}
                        </td>
                        <td className={`p-3 text-right font-bold font-mono print:text-black ${
                          isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
                        }`}>
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
            <div className={`flex-1 text-[11px] space-y-1 print:text-slate-600 ${
              isClean ? "text-slate-600" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
            }`}>
              <span className={`font-bold uppercase tracking-wider block mb-0.5 print:text-black ${
                isClean ? "text-slate-800" : isWhatsApp ? "text-[#E9EDEF]" : "text-slate-300"
              }`}>
                Observações, Termos & Garantia
              </span>
              <p className="leading-relaxed">{proposal.notes || "Proposta válida sob condições gerais acordadas entre as partes."}</p>
            </div>

            <div className={`w-60 p-4 rounded-2xl border space-y-1.5 text-right print:border-slate-300 print:bg-transparent print:p-2.5 transition-colors ${
              isClean 
                ? "bg-slate-50 border-slate-200" 
                : isWhatsApp 
                  ? "bg-[#182229] border-[#222D34]" 
                  : "bg-slate-900/60 border-slate-800"
            }`}>
              <div className={`flex justify-between text-xs print:text-slate-700 ${
                isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
              }`}>
                <span>Subtotal:</span>
                <span className={`font-mono font-semibold ${
                  isClean ? "text-slate-800" : isWhatsApp ? "text-[#E9EDEF]" : "text-slate-300"
                }`}>R$ {proposal.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
              {proposal.discountTotal > 0 && (
                <div className={`flex justify-between text-xs print:text-slate-800 ${
                  isClean ? "text-rose-600" : isWhatsApp ? "text-rose-400" : "text-rose-400"
                }`}>
                  <span>Desconto:</span>
                  <span className="font-mono font-semibold">- R$ {proposal.discountTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className={`border-t print:border-slate-300 pt-2 flex justify-between items-center text-sm font-bold print:text-black ${
                isClean 
                  ? "border-slate-200 text-slate-900" 
                  : isWhatsApp 
                    ? "border-[#222D34] text-[#E9EDEF]" 
                    : "border-slate-800 text-white"
              }`}>
                <span>Total Final:</span>
                <span className={`text-base font-black print:text-black font-mono ${
                  isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
                }`}>
                  R$ {proposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé de Aceite e Autenticação Eletrônica */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 print:border-slate-300 print:p-2.5 print-avoid-break transition-colors ${
            isClean 
              ? "border-blue-200 bg-blue-50/60 text-slate-800" 
              : isWhatsApp 
                ? "border-[#00A884]/30 bg-[#182229] text-[#E9EDEF]" 
                : "border-blue-500/20 bg-blue-500/5 text-slate-200"
          }`}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`w-5 h-5 shrink-0 print:text-black ${
                isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
              }`} />
              <div>
                <span className={`text-[11px] font-bold block print:text-black ${
                  isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-slate-200"
                }`}>
                  Assinatura Eletrônica & Aceite Digital
                </span>
                <span className={`text-[10px] print:text-slate-600 ${
                  isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
                }`}>
                  Documento emitido com autenticação digital e conformidade MP 2.200-2/2001.
                </span>
              </div>
            </div>

            <div className="hidden sm:block text-right print:hidden">
              <span className={`text-[10px] block uppercase font-mono ${
                isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-500"
              }`}>Link de Acesso Seguro</span>
              <a
                href={proposal.publicLink || `${typeof window !== "undefined" ? window.location.origin : ""}/p/${proposal.code.toLowerCase()}`}
                target="_blank"
                rel="noreferrer"
                className={`text-xs font-semibold hover:underline flex items-center gap-1 justify-end ${
                  isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
                }`}
              >
                Abrir Portal do Cliente <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Rodapé de Mudança Rápida de Status (Workflow Comercial) */}
        <div className={`px-6 py-3 border-t flex flex-wrap items-center justify-between gap-3 print:hidden transition-colors ${
          isClean 
            ? "bg-slate-100 border-slate-200 text-slate-700" 
            : isWhatsApp 
              ? "bg-[#111B21] border-[#222D34] text-[#8696A0]" 
              : "bg-slate-900/90 border-slate-800 text-slate-400"
        }`}>
          <span className="text-xs font-medium">
            Alterar status comercial:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onStatusChange(proposal.id, "sent");
                toast.success("Status atualizado para 'Enviada'!");
              }}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer font-medium ${
                isClean 
                  ? "bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300" 
                  : isWhatsApp 
                    ? "bg-[#202C33] hover:bg-[#2a3942] text-cyan-300 border-cyan-500/30" 
                    : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
              }`}
            >
              Marcar Enviada
            </button>
            <button
              onClick={() => {
                onStatusChange(proposal.id, "accepted");
                toast.success("Parabéns! Proposta marcada como 'Aceita'!");
              }}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer font-bold ${
                isClean 
                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300" 
                  : isWhatsApp 
                    ? "bg-[#00A884] hover:bg-[#008f6f] text-white border-[#00A884]" 
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              }`}
            >
              Marcar Aceita
            </button>
            <button
              onClick={() => {
                onStatusChange(proposal.id, "declined");
                toast("Proposta marcada como recusada.");
              }}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer font-medium ${
                isClean 
                  ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300" 
                  : isWhatsApp 
                    ? "bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border-rose-500/30" 
                    : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
              }`}
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
