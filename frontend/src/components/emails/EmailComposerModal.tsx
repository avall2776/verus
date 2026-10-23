"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, Send, Paperclip, FileText, CheckCircle2, 
  Sparkles, Loader2, ArrowRight, ShieldCheck, Link as LinkIcon, Trash2
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { EmailItem, EmailAttachment } from "@/types/email";
import { useTheme } from "@/contexts/ThemeContext";
import ModalPortal from "@/components/ui/ModalPortal";

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSent: (email: EmailItem) => void;
  initialRecipient?: string;
  initialSubject?: string;
  initialBody?: string;
  replyToId?: string;
}

export default function EmailComposerModal({
  isOpen,
  onClose,
  onEmailSent,
  initialRecipient = "",
  initialSubject = "",
  initialBody = "",
  replyToId,
}: EmailComposerModalProps) {
  const { isWhatsApp } = useTheme();
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [recipientEmail, setRecipientEmail] = useState(initialRecipient);
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [bodyText, setBodyText] = useState(initialBody);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

  // Links Rápidos de Propostas e Contratos
  const [proposals, setProposals] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [showProposalPicker, setShowProposalPicker] = useState(false);
  const [showContractPicker, setShowContractPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(initialRecipient);
      setSubject(initialSubject);
      setBodyText(initialBody);

      // Carregar propostas e contratos para atalho de anexos
      api.get("/proposals").then(res => {
        setProposals(Array.isArray(res.data) ? res.data : []);
      }).catch(() => {});

      api.get("/contracts").then(res => {
        setContracts(Array.isArray(res.data) ? res.data : []);
      }).catch(() => {});
    }
  }, [isOpen, initialRecipient, initialSubject, initialBody]);

  if (!isOpen) return null;

  const handleAttachProposalLink = (proposal: any) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://verus-alpha.vercel.app";
    const link = `${origin}/p/${proposal.code || proposal.id}`;
    const appendText = `\n\n📄 Proposta Comercial: ${proposal.title || "Orçamento"}\nAcesse para aprovação imediata: ${link}\n`;
    setBodyText(prev => prev + appendText);
    setShowProposalPicker(false);
    toast.success("Link da proposta comercial anexado ao e-mail!");
  };

  const handleAttachContractLink = (contract: any) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://verus-alpha.vercel.app";
    const link = `${origin}/c/${contract.code || contract.id}`;
    const appendText = `\n\n🔒 Contrato Digital de Prestação de Serviços\nAcesse para assinatura eletrônica: ${link}\n`;
    setBodyText(prev => prev + appendText);
    setShowContractPicker(false);
    toast.success("Link do contrato digital anexado ao e-mail!");
  };

  const handleAddSampleAttachment = () => {
    const newAttach: EmailAttachment = {
      name: `Apresentacao_Vallor_Enterprise_${Date.now().toString().slice(-4)}.pdf`,
      url: "https://verus-alpha.vercel.app/docs/apresentacao.pdf",
      size: 380000,
      type: "application/pdf",
    };
    setAttachments(prev => [...prev, newAttach]);
    toast.success("Documento anexo adicionado!");
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current || loading) return;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast.error("Informe um e-mail de destinatário válido.");
      return;
    }

    if (!subject.trim()) {
      toast.error("O assunto do e-mail não pode ficar vazio.");
      return;
    }

    if (!bodyText.trim()) {
      toast.error("O corpo da mensagem não pode ficar vazio.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const payload = {
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim() || undefined,
        subject: subject.trim(),
        bodyText: bodyText.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        threadId: replyToId || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const res = await api.post("/emails/send", payload);
      toast.success("E-mail enviado com sucesso!");
      onEmailSent(res.data);
      onClose();
    } catch (error: any) {
      console.error("[EMAIL_SEND_ERROR]", error);
      const msg = error.response?.data?.message || "Falha ao enviar e-mail.";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-3xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isWhatsApp
            ? "bg-[#111B21] border-[#222D34] text-[#E9EDEF]"
            : "bg-white dark:bg-[#0B1224] border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Composer */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isWhatsApp
            ? "bg-[#202C33] border-[#222D34]"
            : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              isWhatsApp
                ? "bg-[#00A884]/15 text-[#00A884] border-[#00A884]/30"
                : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
            }`}>
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-900 dark:text-white"}`}>Novo E-mail Comercial</h3>
              <p className={`text-[11px] ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>Envio de orçamentos, contratos e mensagens oficiais</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isWhatsApp
                ? "text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21]"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário de Envio */}
        <form onSubmit={handleSend} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Linha Para & CC toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-700 dark:text-slate-300"}`}>Para (Destinatário) *</label>
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className={`text-[11px] font-semibold hover:underline cursor-pointer ${
                  isWhatsApp ? "text-[#00A884]" : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {showCcBcc ? "Ocultar CC/CCO" : "+ Adicionar CC / CCO"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="cliente@empresa.com.br"
                className={`w-full px-3.5 py-2 text-xs rounded-xl focus:outline-none transition-colors ${
                  isWhatsApp
                    ? "bg-[#202C33] border border-[#222D34] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-[#00A884]"
                    : "bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500"
                }`}
              />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nome do contato (opcional)"
                className={`w-full px-3.5 py-2 text-xs rounded-xl focus:outline-none transition-colors ${
                  isWhatsApp
                    ? "bg-[#202C33] border border-[#222D34] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-[#00A884]"
                    : "bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500"
                }`}
              />
            </div>
          </div>

          {/* Campos CC e CCO se habilitados */}
          {showCcBcc && (
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border ${
              isWhatsApp
                ? "bg-[#202C33] border-[#222D34]"
                : "bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
            }`}>
              <div>
                <label className={`text-[11px] mb-1 block ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>Com Cópia (CC)</label>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="gerencia@empresa.com.br"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none transition-colors ${
                    isWhatsApp
                      ? "bg-[#111B21] border border-[#222D34] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-[#00A884]"
                      : "bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500"
                  }`}
                />
              </div>
              <div>
                <label className={`text-[11px] mb-1 block ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>Cópia Oculta (CCO)</label>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="auditoria@vallor.com.br"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none transition-colors ${
                    isWhatsApp
                      ? "bg-[#111B21] border border-[#222D34] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-[#00A884]"
                      : "bg-white dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>
          )}

          {/* Assunto */}
          <div>
            <label className={`text-xs font-semibold block mb-1 ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-700 dark:text-slate-300"}`}>Assunto *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Proposta Comercial PROP-2026 - Apresentação de Solução"
              className={`w-full px-3.5 py-2 text-xs rounded-xl focus:outline-none transition-colors ${
                isWhatsApp
                  ? "bg-[#202C33] border border-[#222D34] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-[#00A884]"
                  : "bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500"
              }`}
            />
          </div>

          {/* Barra de Ações Rápidas Comerciais (Anexar Proposta / Contrato) */}
          <div className={`flex flex-wrap items-center gap-2 p-2.5 rounded-xl border text-xs ${
            isWhatsApp
              ? "bg-[#202C33] border-[#222D34]"
              : "bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
          }`}>
            <span className={`text-[11px] font-semibold mr-1 flex items-center gap-1 ${
              isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"
            }`}>
              <Sparkles className={`w-3.5 h-3.5 ${isWhatsApp ? "text-[#00A884]" : "text-blue-600 dark:text-blue-400"}`} /> Inserir no E-mail:
            </span>

            {/* Inserir Proposta */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProposalPicker(!showProposalPicker);
                  setShowContractPicker(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer shadow-xs ${
                  isWhatsApp
                    ? "bg-[#111B21] hover:bg-[#2A3942] text-[#00A884] border-[#222D34]"
                    : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Anexar Proposta ({proposals.length})
              </button>

              {showProposalPicker && (
                <div className={`absolute left-0 top-full mt-1.5 w-72 max-h-48 overflow-y-auto rounded-xl border shadow-2xl z-50 p-2 space-y-1 ${
                  isWhatsApp
                    ? "bg-[#111B21] border-[#222D34]"
                    : "bg-white dark:bg-[#070D1B] border-slate-200 dark:border-slate-700"
                }`}>
                  {proposals.length === 0 ? (
                    <p className={`text-[11px] p-2 text-center ${isWhatsApp ? "text-[#8696A0]" : "text-slate-400"}`}>Nenhuma proposta encontrada.</p>
                  ) : (
                    proposals.slice(0, 10).map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAttachProposalLink(p)}
                        className={`w-full text-left p-2 rounded-lg text-[11px] flex flex-col border border-transparent transition-colors cursor-pointer ${
                          isWhatsApp
                            ? "hover:bg-[#202C33] hover:border-[#222D34] text-[#E9EDEF]"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-200 dark:hover:border-slate-700"
                        }`}
                      >
                        <span className={`font-bold truncate ${isWhatsApp ? "text-[#00A884]" : "text-blue-600 dark:text-blue-300"}`}>{p.title || p.code}</span>
                        <span className={`text-[10px] ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>{p.clientName} • R$ {Number(p.totalValue || 0).toLocaleString("pt-BR")}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Inserir Contrato */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowContractPicker(!showContractPicker);
                  setShowProposalPicker(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer shadow-xs ${
                  isWhatsApp
                    ? "bg-[#111B21] hover:bg-[#2A3942] text-[#E9EDEF] border-[#222D34]"
                    : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700"
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${isWhatsApp ? "text-[#00A884]" : "text-blue-600 dark:text-blue-400"}`} />
                Anexar Contrato ({contracts.length})
              </button>

              {showContractPicker && (
                <div className={`absolute left-0 top-full mt-1.5 w-72 max-h-48 overflow-y-auto rounded-xl border shadow-2xl z-50 p-2 space-y-1 ${
                  isWhatsApp
                    ? "bg-[#111B21] border-[#222D34]"
                    : "bg-white dark:bg-[#070D1B] border-slate-200 dark:border-slate-700"
                }`}>
                  {contracts.length === 0 ? (
                    <p className={`text-[11px] p-2 text-center ${isWhatsApp ? "text-[#8696A0]" : "text-slate-400"}`}>Nenhuma contrato encontrado.</p>
                  ) : (
                    contracts.slice(0, 10).map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleAttachContractLink(c)}
                        className={`w-full text-left p-2 rounded-lg text-[11px] flex flex-col border border-transparent transition-colors cursor-pointer ${
                          isWhatsApp
                            ? "hover:bg-[#202C33] hover:border-[#222D34] text-[#E9EDEF]"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white hover:border-slate-200 dark:hover:border-slate-700"
                        }`}
                      >
                        <span className={`font-bold truncate ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-900 dark:text-white"}`}>{c.title || c.code}</span>
                        <span className={`text-[10px] ${isWhatsApp ? "text-[#8696A0]" : "text-slate-500 dark:text-slate-400"}`}>{c.clientName} • R$ {Number(c.value || 0).toLocaleString("pt-BR")}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Anexar Arquivo */}
            <button
              type="button"
              onClick={handleAddSampleAttachment}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer shadow-xs ${
                isWhatsApp
                  ? "bg-[#111B21] hover:bg-[#2A3942] text-[#E9EDEF] border-[#222D34]"
                  : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700"
              }`}
            >
              <Paperclip className={`w-3.5 h-3.5 ${isWhatsApp ? "text-[#00A884]" : "text-blue-600 dark:text-blue-400"}`} />
              + Anexar Documento
            </button>
          </div>

          {/* Lista de Anexos adicionados */}
          {attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 p-2 rounded-xl border ${
              isWhatsApp
                ? "bg-[#202C33] border-[#222D34]"
                : "bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800"
            }`}>
              {attachments.map((att, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] shadow-xs ${
                    isWhatsApp
                      ? "bg-[#111B21] border-[#222D34] text-[#E9EDEF]"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <Paperclip className={`w-3 h-3 ${isWhatsApp ? "text-[#00A884]" : "text-blue-600 dark:text-blue-400"}`} />
                  <span className="truncate max-w-[200px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mensagem / Corpo */}
          <div>
            <label className={`text-xs font-semibold block mb-1 ${isWhatsApp ? "text-[#E9EDEF]" : "text-slate-700 dark:text-slate-300"}`}>Mensagem *</label>
            <textarea
              required
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Prezado cliente, segue em anexo a proposta para avaliação..."
              className={`w-full p-3 text-xs rounded-xl leading-relaxed font-sans resize-y focus:outline-none transition-colors ${
                isWhatsApp
                  ? "bg-[#202C33] border border-[#222D34] text-[#E9EDEF] placeholder:text-[#8696A0] focus:border-[#00A884]"
                  : "bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500"
              }`}
            />
          </div>

          {/* Modal Footer */}
          <div className={`pt-2 flex items-center justify-between border-t ${
            isWhatsApp ? "border-[#222D34]" : "border-slate-200 dark:border-slate-800"
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isWhatsApp
                  ? "bg-[#202C33] hover:bg-[#2A3942] text-[#8696A0] hover:text-[#E9EDEF] border-[#222D34]"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              Descartar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 cursor-pointer text-white ${
                isWhatsApp
                  ? "bg-[#00A884] hover:bg-[#02906F]"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando E-mail...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar E-mail Agora
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
