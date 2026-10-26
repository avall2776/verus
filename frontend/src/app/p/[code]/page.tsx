"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  FileText, CheckCircle2, Clock, Printer, Download, 
  Building2, User, Calendar, DollarSign, Check, AlertCircle, Loader2, X, Image as ImageIcon, ArrowLeft,
  ShieldCheck, MapPin
} from "lucide-react";
import api from "@/lib/api";
import { getDriveThumbnailUrl } from "@/lib/googleDriveHelper";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function PublicProposalViewPage() {
  const params = useParams();
  const code = (params?.code as string) || "";
  const { theme, isDark, isClean, isWhatsApp } = useTheme();

  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    let isMounted = true;
    async function loadProposal() {
      setLoading(true);
      try {
        const res = await api.get(`/proposals/public/${code}`);
        if (isMounted && res.data) {
          setProposal(res.data);
        }
      } catch (err: any) {
        console.error("Erro ao carregar proposta pública:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Proposta não encontrada ou link expirado.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProposal();
  }, [code]);

  const handleAccept = async () => {
    if (!confirm("Deseja aprovar e aceitar oficialmente esta proposta comercial?")) {
      return;
    }

    setAccepting(true);
    try {
      const res = await api.post(`/proposals/public/${code}/accept`, {});
      toast.success("Proposta aprovada com sucesso!");
      setProposal(res.data);
    } catch (err: any) {
      console.error("Erro ao aceitar proposta:", err);
      toast.error(err.response?.data?.message || "Erro ao aprovar proposta.");
    } finally {
      setAccepting(false);
    }
  };

  const handlePrintPdf = () => {
    if (!proposal?.id) return;
    window.open(`/api-backend/proposals/${proposal.id}/pdf`, "_blank");
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
        isClean ? "bg-slate-50 text-slate-800" : isWhatsApp ? "bg-[#0C1317] text-[#E9EDEF]" : "bg-[#050814] text-white"
      }`}>
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 animate-pulse ${
          isClean ? "bg-blue-50 text-blue-600 border border-blue-200" : isWhatsApp ? "bg-[#00A884]/15 text-[#00A884] border border-[#00A884]/30" : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
        }`}>
          <FileText className="w-8 h-8" />
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${
          isClean ? "text-slate-600" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
        }`}>
          <Loader2 className={`w-4 h-4 animate-spin ${
            isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
          }`} />
          Carregando proposta comercial...
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
        isClean ? "bg-slate-50 text-slate-800" : isWhatsApp ? "bg-[#0C1317] text-[#E9EDEF]" : "bg-[#050814] text-white"
      }`}>
        <div className={`max-w-md w-full p-8 rounded-3xl text-center space-y-4 border ${
          isClean ? "bg-white border-slate-200 shadow-xl" : isWhatsApp ? "bg-[#111B21] border-[#222D34] shadow-2xl" : "bg-[#0B1224] border-slate-800"
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className={`text-xl font-bold ${isClean ? "text-slate-900" : "text-white"}`}>Proposta Não Encontrada</h1>
          <p className={`text-xs leading-relaxed ${isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"}`}>
            {error || "A proposta comercial solicitada não foi localizada ou o link expirou."}
          </p>
        </div>
      </div>
    );
  }

  const isAccepted = proposal.status === "accepted";
  const formattedTotal = Number(proposal.total || proposal.totalValue || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white print:min-h-0 print:bg-white print:text-black print:p-0 print:m-0 transition-colors ${
      isClean ? "bg-slate-50 text-slate-800" : isWhatsApp ? "bg-[#0C1317] text-[#E9EDEF]" : "bg-[#050814] text-slate-200"
    }`}>
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-4 print:max-w-none print:w-full">
        {/* Header da Proposta */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden print:p-4 print:bg-transparent print:border-slate-300 print:shadow-none print:rounded-xl print-avoid-break transition-colors ${
          isClean 
            ? "bg-white border-slate-200 shadow-slate-200/50" 
            : isWhatsApp 
              ? "bg-[#111B21] border-[#222D34]" 
              : "bg-[#0B1224] border-slate-800/90 backdrop-blur-xl"
        }`}>
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 print:border-slate-300 print:pb-3 ${
            isClean ? "border-slate-200" : isWhatsApp ? "border-[#222D34]" : "border-slate-800/80"
          }`}>
            <div className="flex items-center gap-4">
              {proposal.issuer?.logoUrl || proposal.logoUrl ? (
                <img
                  src={proposal.issuer?.logoUrl || proposal.logoUrl}
                  alt={proposal.issuer?.name || "Logo da Empresa"}
                  className="max-h-16 max-w-[220px] object-contain rounded-lg"
                />
              ) : (
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-black text-xl print:border-slate-400 print:text-black ${
                  isClean 
                    ? "bg-blue-50 border-blue-200 text-blue-600" 
                    : isWhatsApp 
                      ? "bg-[#00A884]/20 border-[#00A884]/40 text-[#00A884]" 
                      : "bg-gradient-to-tr from-blue-500/20 to-cyan-600/20 border-blue-500/30 text-blue-400"
                }`}>
                  {proposal.issuer?.name?.slice(0, 2).toUpperCase() || "VE"}
                </div>
              )}
              <div>
                <h1 className={`text-xl font-black tracking-tight print:text-black ${
                  isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
                }`}>
                  {proposal.issuer?.name || "Vallor Comercial"}
                </h1>
                <p className={`text-xs mt-0.5 print:text-slate-600 ${
                  isClean ? "text-slate-500 font-medium" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
                }`}>
                  {proposal.issuer?.document ? `CNPJ: ${proposal.issuer.document} • ` : ""}
                  Proposta Comercial Oficial
                </p>
              </div>
            </div>

            {/* Ações do Topo: Alternador de Tema, Imprimir e Fechar */}
            <div className="flex items-center gap-2 print:hidden flex-wrap">
              <ThemeToggle variant="pill" className="shrink-0" />

              <button
                onClick={handlePrintPdf}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer shadow-xs ${
                  isClean 
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200" 
                    : isWhatsApp 
                      ? "bg-[#202C33] hover:bg-[#2a3942] text-[#E9EDEF] border-[#222D34]" 
                      : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                }`}
                title="Imprimir ou Salvar como PDF"
              >
                <Printer className={`w-3.5 h-3.5 ${isWhatsApp ? "text-[#00A884]" : "text-blue-500"}`} />
                <span>PDF</span>
              </button>

              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      window.close();
                    }
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer shadow-xs ${
                  isClean 
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200" 
                    : isWhatsApp 
                      ? "bg-[#202C33] hover:bg-[#2a3942] text-[#8696A0] hover:text-[#E9EDEF] border-[#222D34]" 
                      : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
                title="Voltar para a página anterior ou fechar aba"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className={`text-xs font-mono font-bold tracking-wider uppercase ${
                isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-cyan-400"
              }`}>
                PROPOSTA #{proposal.code}
              </div>
              <h2 className={`text-xl sm:text-2xl font-black mt-1 ${
                isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
              }`}>
                {proposal.title}
              </h2>
            </div>

            <div>
              {isAccepted ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4" /> Proposta Aprovada
                </span>
              ) : (
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                  isClean 
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                    : isWhatsApp 
                      ? "bg-[#00A884]/15 text-[#00A884] border border-[#00A884]/30" 
                      : "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                }`}>
                  <Clock className="w-4 h-4" /> Aguardando Decisão
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cliente & Condições com Cores e Destaques Ricos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Destinatário */}
          <div className={`p-5 rounded-2xl border border-l-4 space-y-2 print:p-3 print:bg-transparent print:border-slate-300 print-avoid-break transition-colors ${
            isClean 
              ? "bg-blue-50/70 border-blue-200 border-l-blue-600" 
              : isWhatsApp 
                ? "bg-[#182229] border-[#222D34] border-l-[#00A884]" 
                : "bg-blue-950/25 border-blue-900/40 border-l-blue-500"
          }`}>
            <span className={`text-[11px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 print:text-slate-800 ${
              isClean ? "text-blue-700" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
            }`}>
              <User className="w-3.5 h-3.5 shrink-0" /> Destinatário (Cliente)
            </span>
            <div className={`font-black text-base print:text-black ${
              isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
            }`}>{proposal.clientName}</div>
            {proposal.clientCompany && (
              <div className={`text-xs font-bold ${
                isClean ? "text-blue-700" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"
              }`}>{proposal.clientCompany}</div>
            )}
            <div className={`text-xs space-y-0.5 print:text-slate-800 ${
              isClean ? "text-slate-700 font-medium" : isWhatsApp ? "text-[#8696A0]" : "text-slate-300"
            }`}>
              {proposal.clientEmail && <div><strong>E-mail:</strong> {proposal.clientEmail}</div>}
              {proposal.clientPhone && <div><strong>Tel/WhatsApp:</strong> {proposal.clientPhone}</div>}
              {proposal.clientCep && <div><strong>CEP:</strong> {proposal.clientCep}</div>}
              {proposal.clientAddress && <div><strong>Endereço:</strong> {proposal.clientAddress}</div>}
            </div>
          </div>

          {/* Card Condições */}
          <div className={`p-5 rounded-2xl border border-l-4 space-y-2 print:p-3 print:bg-transparent print:border-slate-300 print-avoid-break transition-colors ${
            isClean 
              ? "bg-emerald-50/70 border-emerald-200 border-l-emerald-600" 
              : isWhatsApp 
                ? "bg-[#182229] border-[#222D34] border-l-[#00A884]" 
                : "bg-emerald-950/25 border-emerald-900/40 border-l-emerald-500"
          }`}>
            <span className={`text-[11px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 print:text-slate-800 ${
              isClean ? "text-emerald-700" : isWhatsApp ? "text-[#00A884]" : "text-emerald-400"
            }`}>
              <Calendar className="w-3.5 h-3.5 shrink-0" /> Condições & Prazos
            </span>
            <div className={`text-xs print:text-black ${
              isClean ? "text-slate-700" : isWhatsApp ? "text-[#8696A0]" : "text-slate-300"
            }`}>
              <strong className={isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"}>Forma de Pagamento:</strong>{" "}
              <span className={`font-bold ${isClean ? "text-slate-900" : "text-white"}`}>
                {proposal.paymentMethod || "A combinar"}
              </span>
            </div>
            <div className={`text-xs print:text-black ${
              isClean ? "text-slate-700" : isWhatsApp ? "text-[#8696A0]" : "text-slate-300"
            }`}>
              <strong className={isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"}>Validade da Proposta:</strong>{" "}
              <span className={`font-bold ${isClean ? "text-slate-900" : "text-white"}`}>
                {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString("pt-BR") : "30 dias"}
              </span>
            </div>
            <div className={`text-xs print:text-black ${
              isClean ? "text-slate-700" : isWhatsApp ? "text-[#8696A0]" : "text-slate-300"
            }`}>
              <strong className={isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"}>Consultor Responsável:</strong>{" "}
              <span className={`font-bold ${isClean ? "text-slate-900" : "text-white"}`}>
                {proposal.sellerName || "Equipe Comercial"}
              </span>
            </div>
          </div>
        </div>

        {/* Itens da Proposta */}
        <div className={`p-6 rounded-3xl border space-y-4 print:p-4 print:bg-transparent print:border-slate-300 print:shadow-none print:rounded-xl print-avoid-break transition-colors ${
          isClean 
            ? "bg-white border-slate-200 shadow-xl shadow-slate-200/40" 
            : isWhatsApp 
              ? "bg-[#111B21] border-[#222D34]" 
              : "bg-[#0B1224] border-slate-800"
        }`}>
          <h3 className={`text-xs font-black uppercase tracking-wider border-b pb-3 print:text-black print:border-slate-300 ${
            isClean ? "text-slate-900 border-slate-200" : isWhatsApp ? "text-[#E9EDEF] border-[#222D34]" : "text-white border-slate-800"
          }`}>
            ITENS & ESPECIFICAÇÕES
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase font-bold border-b print:bg-slate-100 print:text-black print:border-slate-300 ${
                isClean 
                  ? "bg-slate-100 text-slate-700 border-slate-200" 
                  : isWhatsApp 
                    ? "bg-[#202C33] text-[#8696A0] border-[#222D34]" 
                    : "bg-slate-900/80 text-slate-400 border-slate-800"
              }`}>
                <tr>
                  <th className="p-3">Descrição do Serviço / Produto</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3 text-right">Valor Unitário</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className={`divide-y print:divide-slate-200 ${
                isClean ? "divide-slate-200" : isWhatsApp ? "divide-[#222D34]" : "divide-slate-800/60"
              }`}>
                {(proposal.items || []).map((item: any) => {
                  const thumb = item.imageUrl ? (getDriveThumbnailUrl(item.imageUrl, 200) || item.imageUrl) : null;
                  const highResThumb = item.imageUrl ? (getDriveThumbnailUrl(item.imageUrl, 1200) || item.imageUrl) : null;

                  return (
                    <tr key={item.id} className={`transition-colors print:text-black ${
                      isClean 
                        ? "hover:bg-slate-50 text-slate-800" 
                        : isWhatsApp 
                          ? "hover:bg-[#182229] text-[#E9EDEF]" 
                          : "hover:bg-slate-900/40 text-slate-200"
                    }`}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {thumb && (
                            <div
                              onClick={() => setZoomImageUrl(highResThumb)}
                              className={`w-12 h-12 rounded-xl border overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-xs print:w-10 print:h-10 print:rounded-md print:border-slate-300 ${
                                isClean ? "bg-slate-100 border-slate-200" : isWhatsApp ? "bg-[#202C33] border-[#222D34]" : "bg-slate-800 border-slate-700"
                              }`}
                              title="Clique para ampliar a foto do produto"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={thumb} alt={item.name || item.description} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className={`font-bold print:text-black ${
                              isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
                            }`}>{item.name || item.description}</div>
                            {item.description && item.description !== item.name && (
                              <div className={`text-[11px] line-clamp-2 mt-0.5 print:text-slate-600 ${
                                isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
                              }`}>{item.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold">{item.quantity}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        R$ {Number(item.unitPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 text-right font-mono font-black ${
                        isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-cyan-400"
                      }`}>
                        R$ {Number(item.total || item.totalPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={`flex justify-end pt-4 border-t print:border-slate-300 ${
            isClean ? "border-slate-200" : isWhatsApp ? "border-[#222D34]" : "border-slate-800"
          }`}>
            <div className="text-right">
              <span className={`text-xs uppercase font-extrabold print:text-slate-600 ${
                isClean ? "text-slate-500" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
              }`}>Valor Total da Proposta:</span>
              <div className={`text-2xl font-black font-mono mt-0.5 print:text-black ${
                isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-emerald-400"
              }`}>
                {formattedTotal}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Aceite */}
        {!isAccepted ? (
          <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden transition-colors ${
            isClean 
              ? "bg-gradient-to-r from-blue-50 via-white to-slate-50 border-blue-200 shadow-xl" 
              : isWhatsApp 
                ? "bg-[#182229] border-[#00A884]/40 shadow-2xl" 
                : "bg-gradient-to-r from-blue-900/30 via-slate-900/80 to-cyan-900/30 border-blue-500/30"
          }`}>
            <div>
              <h3 className={`text-base font-extrabold ${
                isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"
              }`}>
                Aprovar Proposta Comercial
              </h3>
              <p className={`text-xs mt-0.5 ${
                isClean ? "text-slate-500 font-medium" : isWhatsApp ? "text-[#8696A0]" : "text-slate-400"
              }`}>
                Ao clicar em aprovar, notificaremos o consultor responsável para formalizar a contratação
              </p>
            </div>

            <button
              onClick={handleAccept}
              disabled={accepting}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs transition-all disabled:opacity-50 cursor-pointer ${
                isClean 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25" 
                  : isWhatsApp 
                    ? "bg-[#00A884] hover:bg-[#008f6f] text-white shadow-lg shadow-[#00A884]/30" 
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
              }`}
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aprovando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Aprovar e Aceitar Proposta
                </>
              )}
            </button>
          </div>
        ) : (
          <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden transition-colors ${
            isClean 
              ? "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-md" 
              : isWhatsApp 
                ? "bg-[#182229] border-[#00A884]/50 text-[#E9EDEF] shadow-2xl" 
                : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isClean ? "bg-emerald-100 text-emerald-700" : isWhatsApp ? "bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-extrabold ${isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"}`}>
                  Proposta Comercial Aceita com Sucesso!
                </h3>
                <p className={`text-xs mt-0.5 ${isClean ? "text-slate-600" : isWhatsApp ? "text-[#8696A0]" : "text-slate-300"}`}>
                  O aceite eletrônico foi registrado sob conformidade MP 2.200-2/2001. Nossa equipe já foi notificada para os próximos passos.
                </p>
              </div>
            </div>

            <button
              onClick={handlePrintPdf}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isClean 
                  ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm" 
                  : isWhatsApp 
                    ? "bg-[#202C33] hover:bg-[#2a3942] text-[#E9EDEF] border-[#222D34]" 
                    : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Comprovante em PDF
            </button>
          </div>
        )}

        {/* Rodapé de Conformidade & Autenticação Digital */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs transition-colors print:border-slate-300 print:bg-white print:text-black ${
          isClean 
            ? "border-blue-100 bg-blue-50/50 text-slate-700" 
            : isWhatsApp 
              ? "border-[#222D34] bg-[#111B21] text-[#8696A0]" 
              : "border-slate-800 bg-[#0B1224] text-slate-400"
        }`}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className={`w-5 h-5 shrink-0 ${isClean ? "text-blue-600" : isWhatsApp ? "text-[#00A884]" : "text-blue-400"}`} />
            <div>
              <span className={`font-bold block ${isClean ? "text-slate-900" : isWhatsApp ? "text-[#E9EDEF]" : "text-white"}`}>
                Documento Comercial com Autenticação Digital
              </span>
              <span className="text-[11px]">
                Em conformidade jurídica com a Medida Provisória nº 2.200-2/2001 e Código Civil Brasileiro.
              </span>
            </div>
          </div>
          <div className="hidden sm:block text-right font-mono text-[11px] font-bold">
            Código: {proposal.code}
          </div>
        </div>
      </div>

      {/* Lightbox de ampliação da imagem do produto */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
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
    </div>
  );
}
