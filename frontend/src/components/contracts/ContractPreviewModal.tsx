"use client";

import React, { useState } from "react";
import { 
  X, Download, ExternalLink, Printer, CheckCircle2, Clock, 
  ShieldCheck, Share2, Copy, AlertCircle, Building2, User, Calendar
} from "lucide-react";
import { Contract } from "@/types/commercial";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onStatusUpdated?: (updatedContract: Contract) => void;
}

export function ContractPreviewModal({ 
  isOpen, 
  onClose, 
  contract, 
  onStatusUpdated 
}: ContractPreviewModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !contract) return null;

  const isSigned = contract.status === "signed";
  const formattedValue = Number(contract.value || 0).toLocaleString("pt-BR", { 
    style: "currency", 
    currency: "BRL" 
  });

  const handleOpenPdf = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("versus_auth_token") || localStorage.getItem("token") : "";
    const url = `/api-backend/contracts/${contract.id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    window.open(url, "_blank");
    toast.success(`Abrindo minuta oficial do contrato ${contract.code}`);
  };

  const handleCopyWhatsApp = async () => {
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
        toast.success("WhatsApp aberto e mensagem copiada para envio!");
      } else {
        toast.success("Mensagem copiada para a área de transferência!");
      }
    } catch (err) {
      console.error("Erro ao obter link de WhatsApp:", err);
      const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "https://verus-alpha.vercel.app");
      const fallbackUrl = `${origin}/c/${contract.code.toLowerCase()}`;
      const fallbackText = `Olá, *${contract.clientName}*! Segue o link oficial para assinatura digital do seu contrato: *${contract.title}* (${contract.code}).\n\nVocê pode revisar os termos e efetuar a assinatura eletrônica com validade jurídica pelo link: ${fallbackUrl}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fallbackText);
      }
      const encoded = encodeURIComponent(fallbackText);
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
      toast.success("WhatsApp aberto e mensagem copiada!");
    }
  };

  const handleSignContract = async () => {
    if (!confirm("Deseja confirmar a assinatura digital deste contrato com carimbo de tempo e IP?")) {
      return;
    }

    setUpdating(true);
    try {
      const res = await api.patch(`/contracts/${contract.id}/status`, {
        status: "SIGNED"
      });
      toast.success("Contrato assinado e registrado na auditoria com sucesso!");
      if (onStatusUpdated) onStatusUpdated(res.data);
    } catch (err: any) {
      console.error("Erro ao assinar contrato:", err);
      toast.error("Erro ao atualizar status do contrato.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#080D1A] border border-slate-800 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {contract.code}
                </h2>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                  isSigned 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}>
                  {isSigned ? "✓ Assinado Digitalmente" : "Aguardando Assinatura"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {contract.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
              title="Abrir PDF Oficial para Impressão"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              Imprimir / PDF
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-300 border border-emerald-500/30 transition-colors"
              title="Compartilhar via WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              WhatsApp
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content (Minuta & Dados) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar bg-[#060913]/70">
          {/* Box Emitente / Contratante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Contratada (Emitente)
              </span>
              <div className="font-bold text-sm text-white">
                {contract.issuer?.name || "VERSUS Tecnologia & Inteligência Comercial"}
              </div>
              <div className="text-xs text-slate-400 space-y-0.5">
                {contract.issuer?.document && <div>CNPJ: {contract.issuer.document}</div>}
                {contract.issuer?.email && <div>E-mail: {contract.issuer.email}</div>}
                {contract.issuer?.phone && <div>Tel: {contract.issuer.phone}</div>}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Contratante (Cliente)
              </span>
              <div className="font-bold text-sm text-white">
                {contract.clientName}
              </div>
              <div className="text-xs text-slate-400 space-y-0.5">
                {contract.clientDocument && <div>CPF/CNPJ: {contract.clientDocument}</div>}
                {contract.clientEmail && <div>E-mail: {contract.clientEmail}</div>}
                {contract.clientPhone && <div>WhatsApp: {contract.clientPhone}</div>}
                {contract.clientAddress && <div>Endereço: {contract.clientAddress}</div>}
              </div>
            </div>
          </div>

          {/* Dados Financeiros e Prazos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Valor Contratado</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                {formattedValue}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Início da Vigência</span>
              <div className="text-sm font-semibold text-white mt-1">
                {contract.startDate ? new Date(contract.startDate).toLocaleDateString("pt-BR") : "Data de Assinatura"}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Término da Vigência</span>
              <div className="text-sm font-semibold text-white mt-1">
                {contract.endDate ? new Date(contract.endDate).toLocaleDateString("pt-BR") : "Prazo Indeterminado"}
              </div>
            </div>
          </div>

          {/* Cláusulas Contratuais Padronizadas */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              CLÁUSULAS CONTRATUAIS & DISPOSIÇÕES GERAIS
            </h3>
            <div className="text-xs text-slate-300 leading-relaxed space-y-3">
              <p>
                <strong>1. DO OBJETO:</strong> O presente instrumento tem como escopo a prestação de serviços profissionais e/ou fornecimento de soluções digitais discriminadas conforme proposta comercial e especificações acordadas entre as partes.
              </p>
              <p>
                <strong>2. DO PRAZO E VIGÊNCIA:</strong> O contrato entra em vigor a partir da data de assinatura eletrônica mútua e permanecerá válido pelo prazo estipulado, podendo ser renovado mediante termo aditivo ou comum acordo.
              </p>
              <p>
                <strong>3. DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS (LGPD):</strong> As partes obrigam-se a manter sob sigilo irrevogável todas as informações confidenciais compartilhadas, atendendo rigorosamente à Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              </p>
              <p>
                <strong>4. DA EFICÁCIA DA ASSINATURA ELETRÔNICA:</strong> As partes reconhecem expressamente a veracidade, autenticidade e plena eficácia jurídica das assinaturas eletrônicas aqui apostas, nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.
              </p>
            </div>
          </div>

          {/* Bloco de Assinatura & Auditoria */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Trilha de Auditoria e Assinatura Digital
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="font-semibold text-slate-200">Pela Contratada:</div>
                <div className="text-slate-400 mt-1">{contract.issuer?.name || "VERSUS Tecnologia"}</div>
                <div className="text-emerald-400 font-mono text-[11px] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Assinado pelo Emitente
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="font-semibold text-slate-200">Pelo Contratante:</div>
                <div className="text-slate-400 mt-1">{contract.clientName}</div>
                {isSigned ? (
                  <div className="text-emerald-400 font-mono text-[11px] mt-1 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Assinado Digitalmente em {contract.signedAt || "Hoje"}
                    </div>
                    <div className="text-[10px] text-slate-500">IP: {contract.signIp || "Auditado e Registrado"}</div>
                  </div>
                ) : (
                  <div className="text-amber-400 font-mono text-[11px] mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Aguardando assinatura eletrônica
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/60">
          <button
            onClick={handleOpenPdf}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" /> Baixar Minuta Oficial
          </button>

          <div className="flex items-center gap-3">
            {!isSigned && (
              <button
                onClick={handleSignContract}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {updating ? "Assinando..." : "Marcar como Assinado"}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
