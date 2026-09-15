"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, CheckCircle2, Clock, Printer, Download, 
  Building2, User, Calendar, DollarSign, FileText, Check, AlertCircle, Loader2, ExternalLink
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function PublicContractSignPage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Signing form state
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerDocument, setSignerDocument] = useState("");
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!code) return;

    let isMounted = true;
    async function loadContract() {
      setLoading(true);
      try {
        const res = await api.get(`/contracts/public/${code}`);
        if (isMounted && res.data) {
          setContract(res.data);
          setSignerName(res.data.clientName || "");
          setSignerDocument(res.data.clientDocument || "");
        }
      } catch (err: any) {
        console.error("Erro ao carregar contrato público:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Contrato não localizado ou link expirado.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadContract();
  }, [code]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error("Por favor, marque a caixa de concordância com os termos contratuais.");
      return;
    }

    if (!signerName.trim()) {
      toast.error("Por favor, confirme o nome completo do signatário.");
      return;
    }

    setSigning(true);
    try {
      const res = await api.post(`/contracts/public/${code}/sign`, {
        signerName: signerName.trim(),
        signerDocument: signerDocument.trim(),
      });

      toast.success("Contrato assinado eletronicamente com sucesso!");
      setContract(res.data);
    } catch (err: any) {
      console.error("Erro ao assinar contrato:", err);
      toast.error(err.response?.data?.message || "Erro ao registrar assinatura eletrônica.");
    } finally {
      setSigning(false);
    }
  };

  const handlePrintPdf = () => {
    if (!contract?.id) return;
    window.open(`/api-backend/contracts/${contract.id}/pdf`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          Carregando minuta oficial e certificação digital...
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white">Contrato Não Encontrado</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || "O documento solicitado não foi localizado em nossa base de assinaturas ou o link expirou."}
          </p>
        </div>
      </div>
    );
  }

  const isSigned = contract.status === "signed";
  const formattedValue = Number(contract.value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="min-h-screen bg-[#050811] text-slate-200 py-10 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-4">
              {contract.issuer?.logoUrl ? (
                <img
                  src={contract.issuer.logoUrl}
                  alt={contract.issuer.name}
                  className="max-h-12 max-w-[140px] object-contain rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-lg">
                  {contract.issuer?.name?.slice(0, 2).toUpperCase() || "VE"}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {contract.issuer?.name || "VERSUS Tecnologia"}
                </h1>
                <p className="text-xs text-slate-400">
                  {contract.issuer?.document ? `CNPJ: ${contract.issuer.document} • ` : ""}
                  Portal de Assinatura Eletrônica Segura
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintPdf}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                Imprimir / Salvar PDF
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="text-xs font-mono text-cyan-400 font-semibold">
                DOCUMENTO #{contract.code}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {contract.title}
              </h2>
            </div>

            <div>
              {isSigned ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4" /> Assinado Digitalmente
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
                  <Clock className="w-4 h-4" /> Aguardando Assinatura
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Partes Contratantes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
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
              {contract.issuer?.address && <div>Endereço: {contract.issuer.address}</div>}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
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

        {/* Resumo Financeiro & Prazos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Valor Contratual</span>
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

        {/* Cláusulas do Contrato */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            TERMOS, ESPECIFICAÇÕES & CLÁUSULAS CONTRATUAIS
          </h3>

          <div className="text-xs text-slate-300 leading-relaxed space-y-4 font-sans">
            <p>
              <strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O presente instrumento tem por objeto a prestação dos serviços técnicos e/ou licenciamento de tecnologia discriminados na proposta comercial acordada, executados com zelo e padrões de mercado.
            </p>
            <p>
              <strong>CLÁUSULA SEGUNDA - DA VIGÊNCIA E RESCISÃO:</strong> Este contrato entra em vigor na data da sua assinatura eletrônica por ambas as partes e vigorará pelo período ajustado, podendo ser rescindido mediante comunicação formal prévia.
            </p>
            <p>
              <strong>CLÁUSULA TERCEIRA - DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS (LGPD):</strong> Em observância à Lei nº 13.709/2018 (Lei Geral de Proteção de Dados), as partes obrigam-se a tratar dados pessoais estritamente para a finalidade pactuada neste contrato, com padrões adequados de segurança da informação.
            </p>
            <p>
              <strong>CLÁUSULA QUARTA - DA VALIDADE JURÍDICA DA ASSINATURA ELETRÔNICA:</strong> As partes reconhecem como válida, vinculante e dotada de plena eficácia jurídica a assinatura eletrônica deste documento, nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.
            </p>
          </div>
        </div>

        {/* Seção de Assinatura Digital / Trilha de Auditoria */}
        {isSigned ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-300">
                  Contrato Homologado e Assinado Digitalmente
                </h3>
                <p className="text-xs text-emerald-400/80">
                  Documento certificado eletronicamente com carimbo de tempo e trilha auditável
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="font-semibold text-slate-300">Assinatura do Contratante:</div>
                <div className="text-white font-bold mt-1">{contract.clientName}</div>
                {contract.clientDocument && <div className="text-slate-400 text-[11px]">Doc: {contract.clientDocument}</div>}
                <div className="text-emerald-400 font-mono text-[11px] mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Assinado em {contract.signedAt ? new Date(contract.signedAt).toLocaleString("pt-BR") : "Data registrada"}
                </div>
                <div className="text-slate-500 text-[10px] mt-0.5">IP Auditado: {contract.signIp || "Auditado"}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="font-semibold text-slate-300">Assinatura da Contratada:</div>
                <div className="text-white font-bold mt-1">{contract.issuer?.name || "VERSUS Tecnologia"}</div>
                {contract.issuer?.document && <div className="text-slate-400 text-[11px]">CNPJ: {contract.issuer.document}</div>}
                <div className="text-emerald-400 font-mono text-[11px] mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Autenticado pelo Emitente
                </div>
                <div className="text-slate-500 text-[10px] mt-0.5">Registro: {contract.id}</div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSign} className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/30 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Formalizar Assinatura Eletrônica
                </h3>
                <p className="text-xs text-slate-400">
                  Preencha seus dados para efetuar a assinatura com validade jurídica imediata
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Nome Completo do Signatário *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#060913] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  CPF ou CNPJ do Signatário
                </label>
                <input
                  type="text"
                  value={signerDocument}
                  onChange={(e) => setSignerDocument(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#060913] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl bg-[#060913]/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
              />
              <span className="text-xs text-slate-300 leading-relaxed select-none">
                Declaro que li, compreendi e concordo integralmente com todas as cláusulas e condições deste contrato, concordando em apor minha assinatura eletrônica com valor legal.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Certificação eletrônica em conformidade com a MP nº 2.200-2/2001
              </div>

              <button
                type="submit"
                disabled={signing || !agreeTerms}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando Assinatura...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar e Assinar Eletronicamente
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Legal */}
        <div className="text-center py-6 text-[11px] text-slate-500 border-t border-slate-800/80">
          Documento gerado e autenticado pela infraestrutura segura do VERSUS • Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
