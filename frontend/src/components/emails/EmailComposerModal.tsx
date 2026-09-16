"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Send, Paperclip, FileText, CheckCircle2, 
  Sparkles, Loader2, ArrowRight, ShieldCheck, Link as LinkIcon, Trash2
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { EmailItem, EmailAttachment } from "@/types/email";

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
  const [loading, setLoading] = useState(false);
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
      name: `Apresentacao_VERSUS_Enterprise_${Date.now().toString().slice(-4)}.pdf`,
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-[#0B1224] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Composer */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Novo E-mail Comercial</h3>
              <p className="text-[11px] text-slate-400">Envio de orçamentos, contratos e mensagens oficiais</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário de Envio */}
        <form onSubmit={handleSend} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Linha Para & CC toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Para (Destinatário) *</label>
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-[11px] font-semibold text-cyan-400 hover:underline"
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
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nome do contato (opcional)"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Campos CC e CCO se habilitados */}
          {showCcBcc && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Com Cópia (CC)</label>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="gerencia@empresa.com.br"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 mb-1 block">Cópia Oculta (CCO)</label>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="auditoria@versus.com.br"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Assunto */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Assunto *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Proposta Comercial PROP-2026 - Apresentação de Solução"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Barra de Ações Rápidas Comerciais (Anexar Proposta / Contrato) */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Inserir no E-mail:
            </span>

            {/* Inserir Proposta */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProposalPicker(!showProposalPicker);
                  setShowContractPicker(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-[11px] font-medium transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Anexar Proposta ({proposals.length})
              </button>

              {showProposalPicker && (
                <div className="absolute left-0 top-full mt-1.5 w-72 max-h-48 overflow-y-auto rounded-xl bg-[#070D1B] border border-slate-700 shadow-2xl z-50 p-2 space-y-1">
                  {proposals.length === 0 ? (
                    <p className="text-[11px] text-slate-500 p-2 text-center">Nenhuma proposta encontrada.</p>
                  ) : (
                    proposals.slice(0, 10).map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAttachProposalLink(p)}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-[11px] text-white flex flex-col border border-transparent hover:border-slate-700 transition-colors"
                      >
                        <span className="font-bold text-cyan-300 truncate">{p.title || p.code}</span>
                        <span className="text-[10px] text-slate-400">{p.clientName} • R$ {Number(p.totalValue || 0).toLocaleString("pt-BR")}</span>
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 text-[11px] font-medium transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Anexar Contrato ({contracts.length})
              </button>

              {showContractPicker && (
                <div className="absolute left-0 top-full mt-1.5 w-72 max-h-48 overflow-y-auto rounded-xl bg-[#070D1B] border border-slate-700 shadow-2xl z-50 p-2 space-y-1">
                  {contracts.length === 0 ? (
                    <p className="text-[11px] text-slate-500 p-2 text-center">Nenhum contrato encontrado.</p>
                  ) : (
                    contracts.slice(0, 10).map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleAttachContractLink(c)}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-[11px] text-white flex flex-col border border-transparent hover:border-slate-700 transition-colors"
                      >
                        <span className="font-bold text-purple-300 truncate">{c.title || c.code}</span>
                        <span className="text-[10px] text-slate-400">{c.clientName} • R$ {Number(c.value || 0).toLocaleString("pt-BR")}</span>
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[11px] font-medium transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              + Anexar Documento
            </button>
          </div>

          {/* Lista de Anexos adicionados */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800">
              {attachments.map((att, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200"
                >
                  <Paperclip className="w-3 h-3 text-cyan-400" />
                  <span className="truncate max-w-[200px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="text-slate-400 hover:text-red-400 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mensagem / Corpo */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Mensagem *</label>
            <textarea
              required
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Prezado cliente, segue em anexo a proposta para avaliação..."
              className="w-full p-3 text-xs rounded-xl bg-[#070D1B] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans resize-y"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Descartar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
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
  );
}
