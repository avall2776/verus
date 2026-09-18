"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { 
  MessageSquare, UserCheck, ArrowRight, X, Phone, 
  Sparkles, Eye, Mic, Image as ImageIcon, FileText, 
  CheckCircle2, Loader2, PhoneForwarded
} from "lucide-react";
import api from "@/lib/api";

export interface LeadMessageToastProps {
  toastId: string | number;
  conversationId: string;
  contactName: string;
  contactAvatar?: string | null;
  contactPhone?: string | null;
  messageContent: string;
  messageType?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | string;
  onOpen: (conversationId: string) => void;
  onClose: () => void;
}

export const LeadMessageToast: React.FC<LeadMessageToastProps> = ({
  toastId,
  conversationId,
  contactName,
  contactAvatar,
  contactPhone,
  messageContent,
  messageType = 'TEXT',
  onOpen,
  onClose
}) => {
  // Isolamento estrito: Nunca renderizar notificações operacionais no console Super Admin
  if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/super-admin')) {
    return null;
  }

  const getInitials = (name: string) => {
    if (!name) return 'L';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const renderMessagePreview = () => {
    if (messageType === 'AUDIO' || messageContent?.startsWith('[Áudio') || messageContent?.includes('.ogg') || messageContent?.includes('.mp3')) {
      return (
        <span className="flex items-center gap-1 text-cyan-300 font-medium">
          <Mic size={13} className="text-cyan-400" />
          <span>Mensagem de voz (Áudio PTT)</span>
        </span>
      );
    }
    if (messageType === 'IMAGE' || messageContent?.startsWith('[Imagem') || messageContent?.includes('.jpg') || messageContent?.includes('.png')) {
      return (
        <span className="flex items-center gap-1 text-cyan-300 font-medium">
          <ImageIcon size={13} className="text-cyan-400" />
          <span>Foto / Imagem</span>
        </span>
      );
    }
    if (messageType === 'DOCUMENT' || messageContent?.startsWith('[Documento') || messageContent?.includes('.pdf')) {
      return (
        <span className="flex items-center gap-1 text-cyan-300 font-medium">
          <FileText size={13} className="text-cyan-400" />
          <span>Documento em anexo</span>
        </span>
      );
    }

    return (
      <span className="line-clamp-2 text-slate-300 text-xs leading-relaxed break-words">
        {messageContent || 'Nova mensagem recebida'}
      </span>
    );
  };

  return (
    <div className="w-[360px] sm:w-[390px] rounded-2xl bg-[#0B1224]/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(6,182,212,0.15)] p-4 text-white relative group overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Luz ambiente no topo */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-12 bg-cyan-500/20 blur-2xl rounded-full pointer-events-none" />

      {/* Header do Toast */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Avatar com badge online */}
          <div className="relative shrink-0">
            {contactAvatar ? (
              <img 
                src={contactAvatar} 
                alt={contactName} 
                className="w-10 h-10 rounded-full object-cover border border-cyan-500/30 shadow-sm" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center font-bold text-xs text-white border border-cyan-400/30 shadow-sm">
                {getInitials(contactName)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0B1224] rounded-full shadow-[0_0_8px_#10b981]" />
          </div>

          {/* Nome e Badge WhatsApp */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-white truncate max-w-[180px]" title={contactName}>
                {contactName}
              </h4>
              <span className="text-[10px] font-semibold bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded-full shrink-0">
                WhatsApp
              </span>
            </div>
            {contactPhone && (
              <p className="text-[11px] text-slate-400 font-mono truncate">{contactPhone}</p>
            )}
          </div>
        </div>

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
          title="Fechar notificação"
        >
          <X size={16} />
        </button>
      </div>

      {/* Conteúdo da Mensagem */}
      <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/80 mb-3">
        {renderMessagePreview()}
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Recebida agora
        </span>

        <button
          onClick={() => onOpen(conversationId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
        >
          <span>Abrir Conversa</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

export interface TransferAlertToastProps {
  toastId: string | number;
  conversationId: string;
  contactName: string;
  contactPhone?: string | null;
  departmentName?: string | null;
  transferredBy?: string | null;
  onTakeoverSuccess?: (conversationId: string) => void;
  onOpen: (conversationId: string) => void;
  onClose: () => void;
}

export const TransferAlertToast: React.FC<TransferAlertToastProps> = ({
  toastId,
  conversationId,
  contactName,
  contactPhone,
  departmentName = 'Atendimento Geral',
  transferredBy = 'Um colega',
  onTakeoverSuccess,
  onOpen,
  onClose
}) => {
  // Isolamento estrito: Nunca renderizar alertas operacionais no console Super Admin
  if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/super-admin')) {
    return null;
  }

  const [isTakingOver, setIsTakingOver] = useState(false);

  const handleTakeover = async () => {
    setIsTakingOver(true);
    try {
      await api.patch(`/conversations/${conversationId}/takeover`);
      toast.success(`Conversa com ${contactName} assumida com sucesso!`, {
        duration: 3000,
        position: 'top-right'
      });
      onClose();
      if (onTakeoverSuccess) {
        onTakeoverSuccess(conversationId);
      } else {
        onOpen(conversationId);
      }
    } catch (err: any) {
      console.error('[Toast Takeover] Erro ao assumir conversa:', err);
      toast.error('Não foi possível assumir a conversa.');
    } finally {
      setIsTakingOver(false);
    }
  };

  return (
    <div className="w-[370px] sm:w-[410px] rounded-2xl bg-[#0B1224]/98 backdrop-blur-xl border-2 border-amber-500/70 shadow-[0_16px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.25)] p-4 text-white relative group overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Barra de brilho animada no topo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 animate-pulse" />

      {/* Header do Toast de Transferência */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Badge de Alerta de Transferência */}
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <PhoneForwarded size={18} className="animate-bounce" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Transferência de Lead
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Por <span className="font-semibold text-white">{transferredBy}</span> para <span className="font-bold text-amber-300">{departmentName}</span>
            </p>
          </div>
        </div>

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
          title="Fechar alerta"
        >
          <X size={16} />
        </button>
      </div>

      {/* Detalhes do Lead */}
      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between mb-3.5">
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-white truncate">{contactName}</h4>
          {contactPhone && (
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{contactPhone}</p>
          )}
        </div>
        <span className="text-[11px] text-amber-400 font-semibold bg-amber-950/50 border border-amber-800/50 px-2 py-1 rounded-lg shrink-0">
          Aguardando Atendente
        </span>
      </div>

      {/* Ações Rápidas */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
        <button
          onClick={() => onOpen(conversationId)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
        >
          <Eye size={13} />
          <span>Ver Chat</span>
        </button>

        <button
          onClick={handleTakeover}
          disabled={isTakingOver}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isTakingOver ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Assumindo...</span>
            </>
          ) : (
            <>
              <UserCheck size={14} />
              <span>Assumir Conversa</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Funções utilitárias de disparo
export function showLeadMessageToast(
  data: {
    conversationId: string;
    contactName: string;
    contactAvatar?: string | null;
    contactPhone?: string | null;
    messageContent: string;
    messageType?: string;
  },
  router: any
) {
  // Isolamento estrito: Se o usuário estiver no console Super Admin, silencia imediatamente
  if (typeof window !== 'undefined') {
    const currentPath = (window.location.pathname || '').toLowerCase();
    if (currentPath.includes('/super-admin')) {
      return;
    }
  }

  const toastId = `msg_${data.conversationId}_${Date.now()}`;
  toast.custom(
    (t) => (
      <LeadMessageToast
        toastId={t}
        conversationId={data.conversationId}
        contactName={data.contactName}
        contactAvatar={data.contactAvatar}
        contactPhone={data.contactPhone}
        messageContent={data.messageContent}
        messageType={data.messageType}
        onOpen={(cId) => {
          toast.dismiss(t);
          router.push(`/inbox?conversationId=${cId}`);
        }}
        onClose={() => toast.dismiss(t)}
      />
    ),
    {
      id: toastId,
      duration: 7000,
      position: 'top-right'
    }
  );
}

export function showTransferAlertToast(
  data: {
    conversationId: string;
    contactName: string;
    contactPhone?: string | null;
    departmentName?: string | null;
    transferredBy?: string | null;
  },
  router: any,
  onTakeoverSuccess?: (conversationId: string) => void
) {
  // Isolamento estrito: Se o usuário estiver no console Super Admin, silencia imediatamente
  if (typeof window !== 'undefined') {
    const currentPath = (window.location.pathname || '').toLowerCase();
    if (currentPath.includes('/super-admin')) {
      return;
    }
  }

  const toastId = `transfer_${data.conversationId}_${Date.now()}`;
  toast.custom(
    (t) => (
      <TransferAlertToast
        toastId={t}
        conversationId={data.conversationId}
        contactName={data.contactName}
        contactPhone={data.contactPhone}
        departmentName={data.departmentName}
        transferredBy={data.transferredBy}
        onTakeoverSuccess={(cId) => {
          toast.dismiss(t);
          if (onTakeoverSuccess) onTakeoverSuccess(cId);
          router.push(`/inbox?conversationId=${cId}`);
        }}
        onOpen={(cId) => {
          toast.dismiss(t);
          router.push(`/inbox?conversationId=${cId}`);
        }}
        onClose={() => toast.dismiss(t)}
      />
    ),
    {
      id: toastId,
      duration: 12000,
      position: 'top-right'
    }
  );
}
