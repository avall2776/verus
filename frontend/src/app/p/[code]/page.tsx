"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  FileText, CheckCircle2, Clock, Printer, Download, 
  Building2, User, Calendar, DollarSign, Check, AlertCircle, Loader2
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function PublicProposalViewPage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

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
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 animate-pulse">
          <FileText className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          Carregando proposta comercial...
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white">Proposta Não Encontrada</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
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
    <div className="min-h-screen bg-[#050811] text-slate-200 py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-4">
              {proposal.issuer?.logoUrl ? (
                <img
                  src={proposal.issuer.logoUrl}
                  alt={proposal.issuer.name}
                  className="max-h-12 max-w-[140px] object-contain rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-cyan-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-lg">
                  {proposal.issuer?.name?.slice(0, 2).toUpperCase() || "VE"}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {proposal.issuer?.name || "VERSUS Comercial"}
                </h1>
                <p className="text-xs text-slate-400">
                  {proposal.issuer?.document ? `CNPJ: ${proposal.issuer.document} • ` : ""}
                  Proposta Comercial Oficial
                </p>
              </div>
            </div>

            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              Imprimir / PDF
            </button>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="text-xs font-mono text-cyan-400 font-semibold">
                PROPOSTA #{proposal.code}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {proposal.title}
              </h2>
            </div>

            <div>
              {isAccepted ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4" /> Proposta Aprovada
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1.5 shadow-lg shadow-blue-500/10">
                  <Clock className="w-4 h-4" /> Aguardando Decisão
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cliente & Condições */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> Destinatário (Cliente)
            </span>
            <div className="font-bold text-sm text-white">{proposal.clientName}</div>
            <div className="text-xs text-slate-400 space-y-0.5">
              {proposal.clientEmail && <div>E-mail: {proposal.clientEmail}</div>}
              {proposal.clientPhone && <div>Tel: {proposal.clientPhone}</div>}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Condições & Prazos
            </span>
            <div className="text-xs text-slate-300">
              <strong>Forma de Pagamento:</strong> {proposal.paymentMethod || "A combinar"}
            </div>
            <div className="text-xs text-slate-300">
              <strong>Validade:</strong> {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString("pt-BR") : "30 dias"}
            </div>
          </div>
        </div>

        {/* Itens da Proposta */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            ITENS & ESPECIFICAÇÕES
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Descrição do Serviço / Produto</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3 text-right">Valor Unitário</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(proposal.items || []).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="p-3">
                      <div className="font-semibold text-white">{item.name || item.description}</div>
                      {item.description && item.description !== item.name && (
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                      )}
                    </td>
                    <td className="p-3 text-center text-slate-300">{item.quantity}</td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      R$ {Number(item.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      R$ {Number(item.total || item.totalPrice || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold">Valor Total:</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {formattedTotal}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Aceite */}
        {!isAccepted && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900/80 to-cyan-900/30 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Aprovar Proposta Comercial
              </h3>
              <p className="text-xs text-slate-400">
                Ao clicar em aprovar, notificaremos o executivo comercial para gerar o contrato formal
              </p>
            </div>

            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
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
        )}
      </div>
    </div>
  );
}
