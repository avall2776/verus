"use client";

import React, { useState } from "react";
import { 
  X, Download, ExternalLink, Printer, CheckCircle2, Clock, 
  ShieldCheck, Share2, Copy, AlertCircle, Building2, User, Calendar
} from "lucide-react";
import { Contract } from "@/types/commercial";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { isWhatsApp } = useTheme();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          isWhatsApp
            ? "bg-[#111B21] border-[#222D34] text-[#E9EDEF]"
            : "bg-white dark:bg-[#080D1A] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b backdrop-blur-sm ${
          isWhatsApp
            ? "bg-[#202C33] border-[#222D34]"
            : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
              isWhatsApp
                ? "bg-[#00A884]/15 border border-[#00A884]/30 text-[#00A884]"
                : "bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400"
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold tracking-tight ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-900 dark:text-white"}`}>
                  {contract.code}
                </h2>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold border ${
                  isSigned 
                    ? isWhatsApp
                      ? "bg-[#00A884]/15 text-[#00A884] border-[#00A884]/30"
                      : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30" 
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                }`}>
                  {isSigned ? "✓ Assinado Digitalmente" : "Aguardando Assinatura"}
                </span>
              </div>
              <p className={`text-xs ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>
                {contract.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenPdf}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors shadow-sm cursor-pointer ${
                isWhatsApp
                  ? "bg-[#202C33] hover:bg-[#2A3942] text-[#E9EDEF] border-[#222D34]"
                  : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white border-slate-200 dark:border-slate-700"
              }`}
              title="Abrir PDF Oficial para Impressão"
            >
              <Printer className={`w-4 h-4 ${isWhatsApp ? "text-[#00A884]" : "text-cyan-600 dark:text-cyan-400"}`} />
              Imprimir / PDF
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isWhatsApp
                  ? "bg-[#00A884]/15 hover:bg-[#00A884]/25 text-[#00A884] border-[#00A884]/30"
                  : "bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
              }`}
              title="Compartilhar via WhatsApp"
            >
              <Share2 className={`w-4 h-4 ${isWhatsApp ? "text-[#00A884]" : "text-emerald-600 dark:text-emerald-400"}`} />
              WhatsApp
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isWhatsApp
                  ? "text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942]"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content (Minuta & Dados) */}
        <div className={`flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar ${
          isWhatsApp ? "bg-[#0C1317]" : "bg-slate-50/50 dark:bg-[#060913]/70"
        }`}>
          {/* Box Emitente / Contratante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl border shadow-sm space-y-2 ${
              isWhatsApp
                ? "bg-[#111B21] border-[#222D34]"
                : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
            }`}>
              <span className={`text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"
              }`}>
                <Building2 className={`w-3.5 h-3.5 ${isWhatsApp ? "text-[#00A884]" : "text-cyan-600 dark:text-cyan-400"}`} /> Contratada (Emitente)
              </span>
              <div className={`font-bold text-sm ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-900 dark:text-white"}`}>
                {contract.issuer?.name || "Vallor Tecnologia & Inteligência Comercial"}
              </div>
              <div className={`text-xs space-y-0.5 ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>
                {contract.issuer?.document && <div>CNPJ: {contract.issuer.document}</div>}
                {contract.issuer?.email && <div>E-mail: {contract.issuer.email}</div>}
                {contract.issuer?.phone && <div>Tel: {contract.issuer.phone}</div>}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm space-y-2 ${
              isWhatsApp
                ? "bg-[#111B21] border-[#222D34]"
                : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
            }`}>
              <span className={`text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"
              }`}>
                <User className={`w-3.5 h-3.5 ${isWhatsApp ? "text-[#00A884]" : "text-emerald-600 dark:text-emerald-400"}`} /> Contratante (Cliente)
              </span>
              <div className={`font-bold text-sm ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-900 dark:text-white"}`}>
                {contract.clientName}
              </div>
              <div className={`text-xs space-y-0.5 ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>
                {contract.clientDocument && <div>CPF/CNPJ: {contract.clientDocument}</div>}
                {contract.clientEmail && <div>E-mail: {contract.clientEmail}</div>}
                {contract.clientPhone && <div>WhatsApp: {contract.clientPhone}</div>}
                {contract.clientAddress && <div>Endereço: {contract.clientAddress}</div>}
              </div>
            </div>
          </div>

          {/* Dados Financeiros e Prazos */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl border shadow-sm ${
            isWhatsApp
              ? "bg-[#111B21] border-[#222D34]"
              : "bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
          }`}>
            <div>
              <span className={`text-[11px] uppercase font-semibold ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>Valor Contratado</span>
              <div className={`text-xl font-extrabold font-mono mt-1 ${isWhatsApp ? "text-[#00A884]" : "text-emerald-600 dark:text-emerald-400"}`}>
                {formattedValue}
              </div>
            </div>
            <div>
              <span className={`text-[11px] uppercase font-semibold ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>Início da Vigência</span>
              <div className={`text-sm font-semibold mt-1 ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-900 dark:text-white"}`}>
                {contract.startDate ? new Date(contract.startDate).toLocaleDateString("pt-BR") : "Data de Assinatura"}
              </div>
            </div>
            <div>
              <span className={`text-[11px] uppercase font-semibold ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>Término da Vigência</span>
              <div className={`text-sm font-semibold mt-1 ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-900 dark:text-white"}`}>
                {contract.endDate ? new Date(contract.endDate).toLocaleDateString("pt-BR") : "Prazo Indeterminado"}
              </div>
            </div>
          </div>

          {/* Cláusulas Contratuais Padronizadas */}
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
            isWhatsApp
              ? "bg-[#111B21] border-[#222D34]"
              : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80"
          }`}>
            <h3 className={`text-sm font-bold border-b pb-2 ${
              isWhatsApp ? "text-[#E9EDEF] border-[#222D34]" : "text-slate-900 dark:text-white border-slate-200 dark:border-slate-800"
            }`}>
              CLÁUSULAS CONTRATUAIS & DISPOSIÇÕES GERAIS
            </h3>
            <div className={`text-xs leading-relaxed space-y-3 ${
              isWhatsApp ? "text-[#8696A0]" : "text-slate-600 dark:text-slate-300"
            }`}>
              <p>
                <strong className={isWhatsApp ? "text-[#E9EDEF]" : ""}>1. DO OBJETO:</strong> O presente instrumento tem como escopo a prestação de serviços profissionais e/ou fornecimento de soluções digitais discriminadas conforme proposta comercial e especificações acordadas entre as partes.
              </p>
              <p>
                <strong className={isWhatsApp ? "text-[#E9EDEF]" : ""}>2. DO PRAZO E VIGÊNCIA:</strong> O contrato entra em vigor a partir da data de assinatura eletrônica mútua e permanecerá válido pelo prazo estipulado, podendo ser renovado mediante termo aditivo ou comum acordo.
              </p>
              <p>
                <strong className={isWhatsApp ? "text-[#E9EDEF]" : ""}>3. DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS (LGPD):</strong> As partes obrigam-se a manter sob sigilo irrevogável todas as informações confidenciais compartilhadas, atendendo rigorosamente à Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              </p>
              <p>
                <strong className={isWhatsApp ? "text-[#E9EDEF]" : ""}>4. DA EFICÁCIA DA ASSINATURA ELETRÔNICA:</strong> As partes reconhecem expressamente a veracidade, autenticidade e plena eficácia jurídica das assinaturas eletrônicas aqui apostas, nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.
              </p>
            </div>
          </div>

          {/* Bloco de Assinatura & Auditoria */}
          <div className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
            isWhatsApp
              ? "bg-[#111B21] border-[#222D34]"
              : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
          }`}>
            <div className={`text-xs font-bold uppercase tracking-wider ${
              isWhatsApp ? "text-[#E9EDEF]" : "text-slate-700 dark:text-slate-300"
            }`}>
              Trilha de Auditoria e Assinatura Digital
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className={`p-3 rounded-xl border ${
                isWhatsApp
                  ? "bg-[#202C33] border-[#222D34]"
                  : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80"
              }`}>
                <div className={`font-semibold ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-800 dark:text-slate-200"}`}>Pela Contratada:</div>
                <div className={`mt-1 ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>{contract.issuer?.name || "Vallor Tecnologia"}</div>
                <div className={`font-mono text-[11px] mt-1 flex items-center gap-1 font-medium ${
                  isWhatsApp ? "text-[#00A884]" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Assinado pelo Emitente
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isWhatsApp
                  ? "bg-[#202C33] border-[#222D34]"
                  : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80"
              }`}>
                <div className={`font-semibold ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-800 dark:text-slate-200"}`}>Pelo Contratante:</div>
                <div className={`mt-1 ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>{contract.clientName}</div>
                {isSigned ? (
                  <div className={`font-mono text-[11px] mt-1 space-y-0.5 font-medium ${
                    isWhatsApp ? "text-[#00A884]" : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Assinado Digitalmente em {contract.signedAt || "Hoje"}
                    </div>
                    <div className={`text-[10px] ${isWhatsApp ? "text-[#8696A0]" : "text-slate-400 dark:text-slate-500"}`}>IP: {contract.signIp || "Auditado e Registrado"}</div>
                  </div>
                ) : (
                  <div className="text-amber-600 dark:text-amber-400 font-mono text-[11px] mt-1 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Aguardando assinatura eletrônica
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${
          isWhatsApp
            ? "bg-[#202C33] border-[#222D34]"
            : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80"
        }`}>
          <button
            onClick={handleOpenPdf}
            className={`flex items-center gap-2 text-xs transition-colors cursor-pointer ${
              isWhatsApp
                ? "text-[#8696A0] hover:text-[#E9EDEF]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Download className="w-4 h-4" /> Baixar Minuta Oficial
          </button>

          <div className="flex items-center gap-3">
            {!isSigned && (
              <button
                onClick={handleSignContract}
                disabled={updating}
                className={`flex items-center gap-2 px-4 py-2 text-xs rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer text-white ${
                  isWhatsApp
                    ? "bg-[#00A884] hover:bg-[#02906F]"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {updating ? "Assinando..." : "Marcar como Assinado"}
              </button>
            )}

            <button
              onClick={onClose}
              className={`px-4 py-2 text-xs rounded-xl font-medium transition-colors cursor-pointer ${
                isWhatsApp
                  ? "bg-[#2A3942] hover:bg-[#32444F] text-[#E9EDEF]"
                  : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
              }`}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
