"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { 
  MessageSquare, UserCheck, ArrowRight, X, 
  Sparkles, Eye, Mic, Image as ImageIcon, FileText, 
  Loader2, PhoneForwarded
} from "lucide-react";
import api, { getStoredToken } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

// Hook seguro para obter contexto de tema sem quebrar caso renderizado isoladamente
function useNotificationTheme() {
  try {
    const context = useTheme();
    return {
      isClean: context.isClean,
      isDark: context.isDark,
      isWhatsApp: context.isWhatsApp,
    };
  } catch {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const isWhatsApp = root.classList.contains("theme-whatsapp") || root.getAttribute("data-theme") === "whatsapp";
      const isClean = root.classList.contains("light") || root.getAttribute("data-theme") === "light";
      return {
        isClean,
        isDark: !isClean && !isWhatsApp,
        isWhatsApp,
      };
    }
    return { isClean: false, isDark: true, isWhatsApp: false };
  }
}

export interface LeadMessageToastProps {
  toastId: string | number;
  conversationId: string;
  contactName: string;
  contactAvatar?: string | null;
  contactPhone?: string | null;
  messageContent: string;
  messageType?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | string;
  messageCount?: number;
  onOpen: (conversationId: string) => void;
  onClose: () => void;
}

// Helper de isolamento estrito contra vazamento de dados em telas deslogadas ou públicas
export function isBlockedNotificationContext(): boolean {
  if (typeof window === 'undefined') return true;
  const path = (window.location.pathname || '').toLowerCase();
  const token = getStoredToken();
  
  // 1. Deslogado sem token
  if (!token) return true;

  // 2. Tela de login, recuperação, cadastro ou Super Admin
  if (
    path.includes('/login') ||
    path.includes('/auth') ||
    path.includes('/register') ||
    path.includes('/forgot') ||
    path.includes('/reset-password') ||
    path.includes('/super-admin')
  ) {
    return true;
  }

  return false;
}

export const LeadMessageToast: React.FC<LeadMessageToastProps> = ({
  toastId,
  conversationId,
  contactName,
  contactAvatar,
  contactPhone,
  messageContent,
  messageType = 'TEXT',
  messageCount = 1,
  onOpen,
  onClose
}) => {
  // Isolamento estrito: NUNCA renderizar notificações operacionais no console Super Admin ou em telas deslogadas/login
  if (isBlockedNotificationContext()) {
    return null;
  }

  const { isClean, isWhatsApp } = useNotificationTheme();

  const getInitials = (name: string) => {
    if (!name) return 'L';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const renderMessagePreview = () => {
    const isVoice = messageType === 'AUDIO' || messageContent?.startsWith('[Áudio') || messageContent?.includes('.ogg') || messageContent?.includes('.mp3');
    const isImage = messageType === 'IMAGE' || messageContent?.startsWith('[Imagem') || messageContent?.includes('.jpg') || messageContent?.includes('.png');
    const isDoc = messageType === 'DOCUMENT' || messageContent?.startsWith('[Documento') || messageContent?.includes('.pdf');

    const mediaTextClass = isClean
      ? (isWhatsApp ? "text-emerald-700" : "text-blue-700")
      : (isWhatsApp ? "text-emerald-400" : "text-blue-400");

    if (isVoice) {
      return (
        <span className={`flex items-center gap-1.5 font-semibold text-xs ${mediaTextClass}`}>
          <Mic size={14} className="shrink-0" />
          <span>Mensagem de voz (Áudio PTT)</span>
        </span>
      );
    }
    if (isImage) {
      return (
        <span className={`flex items-center gap-1.5 font-semibold text-xs ${mediaTextClass}`}>
          <ImageIcon size={14} className="shrink-0" />
          <span>Foto / Imagem</span>
        </span>
      );
    }
    if (isDoc) {
      return (
        <span className={`flex items-center gap-1.5 font-semibold text-xs ${mediaTextClass}`}>
          <FileText size={14} className="shrink-0" />
          <span>Documento em anexo</span>
        </span>
      );
    }

    return (
      <span className={`line-clamp-2 text-xs leading-relaxed break-words font-medium ${
        isClean ? "text-slate-800" : "text-slate-100"
      }`}>
        {messageContent || 'Nova mensagem recebida'}
      </span>
    );
  };

  return (
    <div className={`w-[360px] sm:w-[390px] rounded-2xl p-4 relative group overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300 border ${
      isClean
        ? "bg-white border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.12)] text-slate-900"
        : isWhatsApp
        ? "bg-[#0B141B] border-emerald-900/60 shadow-[0_16px_45px_rgba(0,0,0,0.85)] text-white"
        : "bg-[#0B1224] border-slate-800 shadow-[0_16px_45px_rgba(0,0,0,0.85)] text-white"
    }`}>
      {/* Header do Toast */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          {/* Avatar com badge online */}
          <div className="relative shrink-0">
            {contactAvatar ? (
              <img 
                src={contactAvatar} 
                alt={contactName} 
                referrerPolicy="no-referrer"
                className={`w-10 h-10 rounded-full object-cover border shadow-sm ${
                  isClean ? "border-slate-200" : "border-slate-700"
                }`}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.toast-avatar-fallback') as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm toast-avatar-fallback ${
              contactAvatar ? 'hidden' : ''
            } ${
              isWhatsApp ? "bg-emerald-600" : "bg-blue-600"
            }`}>
              {getInitials(contactName)}
            </div>

            <span className={`absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 rounded-full shadow-sm ${
              isClean ? "border-white" : isWhatsApp ? "border-[#0B141B]" : "border-[#0B1224]"
            }`} />
          </div>

          {/* Nome e Badge WhatsApp */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className={`font-bold text-sm truncate max-w-[170px] ${
                isClean ? "text-slate-900" : "text-white"
              }`} title={contactName}>
                {contactName}
              </h4>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                isClean
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"
              }`}>
                WhatsApp
              </span>
              {messageCount > 1 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                  isClean
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : isWhatsApp
                    ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"
                    : "bg-blue-950/70 border-blue-500/40 text-blue-300"
                }`}>
                  +{messageCount} novas
                </span>
              )}
            </div>
            {contactPhone && (
              <p className={`text-[11px] font-mono font-medium truncate mt-0.5 ${
                isClean ? "text-slate-500" : "text-slate-400"
              }`}>{contactPhone}</p>
            )}
          </div>
        </div>

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
            isClean
              ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              : "text-slate-400 hover:text-white hover:bg-slate-800/80"
          }`}
          title="Fechar notificação"
        >
          <X size={15} />
        </button>
      </div>

      {/* Conteúdo da Mensagem - Caixa nítida de alta legibilidade */}
      <div className={`rounded-xl p-3 mb-3 border ${
        isClean
          ? "bg-slate-100/90 border-slate-200/90"
          : isWhatsApp
          ? "bg-[#111B21] border-emerald-900/40"
          : "bg-slate-900/90 border-slate-800"
      }`}>
        {renderMessagePreview()}
      </div>

      {/* Rodapé e Ação */}
      <div className={`flex items-center justify-between gap-2 pt-2 border-t ${
        isClean ? "border-slate-200" : "border-slate-800/80"
      }`}>
        <span className={`text-[11px] font-medium flex items-center gap-1.5 ${
          isClean ? "text-slate-600" : "text-slate-400"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isWhatsApp ? "bg-emerald-500" : "bg-blue-600"
          }`} />
          {messageCount > 1 ? `${messageCount} mensagens recebidas` : 'Recebida agora'}
        </span>

        <button
          onClick={() => onOpen(conversationId)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isWhatsApp
              ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-900/20"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-900/20"
          }`}
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
  // Isolamento estrito: Nunca renderizar alertas operacionais no console Super Admin ou em telas deslogadas/login
  if (isBlockedNotificationContext()) {
    return null;
  }

  const { isClean, isWhatsApp } = useNotificationTheme();
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
    <div className={`w-[370px] sm:w-[410px] rounded-2xl p-4 relative group overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300 border-2 ${
      isClean
        ? "bg-white border-amber-400 shadow-[0_12px_36px_rgba(0,0,0,0.12)] text-slate-900"
        : isWhatsApp
        ? "bg-[#0B141B] border-amber-500/70 shadow-[0_16px_45px_rgba(0,0,0,0.85)] text-white"
        : "bg-[#0B1224] border-amber-500/70 shadow-[0_16px_45px_rgba(0,0,0,0.85)] text-white"
    }`}>
      {/* Barra de destaque sólida no topo - sem degrade */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

      {/* Header do Toast de Transferência */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          {/* Badge de Alerta de Transferência */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isClean
              ? "bg-amber-100 text-amber-700 border-amber-300"
              : "bg-amber-500/20 text-amber-400 border-amber-500/50"
          }`}>
            <PhoneForwarded size={17} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 border ${
                isClean
                  ? "text-amber-800 bg-amber-100 border-amber-300"
                  : "text-amber-300 bg-amber-950/80 border-amber-500/40"
              }`}>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Transferência de Lead
              </span>
            </div>
            <p className={`text-[11px] mt-1 font-medium ${isClean ? "text-slate-600" : "text-slate-300"}`}>
              Por <span className={`font-bold ${isClean ? "text-slate-900" : "text-white"}`}>{transferredBy}</span> para <span className={`font-bold ${isClean ? "text-amber-800" : "text-amber-300"}`}>{departmentName}</span>
            </p>
          </div>
        </div>

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
            isClean
              ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              : "text-slate-400 hover:text-white hover:bg-slate-800/80"
          }`}
          title="Fechar alerta"
        >
          <X size={15} />
        </button>
      </div>

      {/* Detalhes do Lead */}
      <div className={`rounded-xl p-3 border flex items-center justify-between mb-3.5 ${
        isClean
          ? "bg-slate-100/90 border-slate-200"
          : isWhatsApp
          ? "bg-[#111B21] border-emerald-900/40"
          : "bg-slate-900/90 border-slate-800"
      }`}>
        <div className="min-w-0">
          <h4 className={`font-bold text-sm truncate ${isClean ? "text-slate-900" : "text-white"}`}>{contactName}</h4>
          {contactPhone && (
            <p className={`text-[11px] font-mono font-medium mt-0.5 ${isClean ? "text-slate-500" : "text-slate-400"}`}>{contactPhone}</p>
          )}
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 border ${
          isClean
            ? "text-amber-800 bg-amber-100 border-amber-300"
            : "text-amber-300 bg-amber-950/60 border-amber-700/50"
        }`}>
          Aguardando Atendente
        </span>
      </div>

      {/* Ações Rápidas */}
      <div className={`flex items-center justify-end gap-2 pt-2 border-t ${
        isClean ? "border-slate-200" : "border-slate-800/80"
      }`}>
        <button
          onClick={() => onOpen(conversationId)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
            isClean
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          }`}
        >
          <Eye size={13} />
          <span>Ver Chat</span>
        </button>

        <button
          onClick={handleTakeover}
          disabled={isTakingOver}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
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

// Rastreio em memória da contagem de mensagens acumuladas por conversa ativa
const activeToastMessageCounts: Record<string, number> = {};

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
  // Isolamento estrito: Se o usuário estiver na tela de login, deslogado ou no console Super Admin, silencia imediatamente
  if (isBlockedNotificationContext()) {
    return;
  }

  // Chave única e estável por conversa/contato: mantém apenas 1 card flutuante ativo atualizando o conteúdo
  const stableKey = data.conversationId || (data.contactPhone ? data.contactPhone.replace(/\D/g, '') : 'default_lead');
  const toastId = `lead_toast_${stableKey}`;

  // Incrementa contagem de mensagens agrupadas deste contato
  activeToastMessageCounts[stableKey] = (activeToastMessageCounts[stableKey] || 0) + 1;
  const currentCount = activeToastMessageCounts[stableKey];

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
        messageCount={currentCount}
        onOpen={(cId) => {
          delete activeToastMessageCounts[stableKey];
          toast.dismiss(toastId);
          router.push(`/inbox?conversationId=${cId}`);
        }}
        onClose={() => {
          delete activeToastMessageCounts[stableKey];
          toast.dismiss(toastId);
        }}
      />
    ),
    {
      id: toastId,
      duration: 8000,
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
  // Isolamento estrito: Se o usuário estiver na tela de login, deslogado ou no console Super Admin, silencia imediatamente
  if (isBlockedNotificationContext()) {
    return;
  }

  const stableTransferKey = data.conversationId || (data.contactPhone ? data.contactPhone.replace(/\D/g, '') : 'default_transfer');
  const toastId = `transfer_toast_${stableTransferKey}`;

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
          toast.dismiss(toastId);
          if (onTakeoverSuccess) onTakeoverSuccess(cId);
          router.push(`/inbox?conversationId=${cId}`);
        }}
        onOpen={(cId) => {
          toast.dismiss(toastId);
          router.push(`/inbox?conversationId=${cId}`);
        }}
        onClose={() => toast.dismiss(toastId)}
      />
    ),
    {
      id: toastId,
      duration: 12000,
      position: 'top-right'
    }
  );
}

// Componente Executivo de Lead Qualificado pela IA (Transbordo Humano)
export interface LeadQualifiedToastProps {
  toastId: string | number;
  contactName: string;
  contactPhone?: string | null;
  product?: string | null;
  reason?: string | null;
  conversationId?: string | null;
  dealId?: string | null;
  onOpenChat: (convId?: string | null) => void;
  onOpenCrm: () => void;
  onClose: () => void;
}

export const LeadQualifiedToast: React.FC<LeadQualifiedToastProps> = ({
  toastId,
  contactName,
  contactPhone,
  product,
  reason,
  conversationId,
  dealId,
  onOpenChat,
  onOpenCrm,
  onClose,
}) => {
  if (isBlockedNotificationContext()) return null;

  const { isClean, isWhatsApp } = useNotificationTheme();

  return (
    <div className={`w-[380px] sm:w-[410px] rounded-2xl p-4 relative group overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300 border ${
      isClean
        ? "bg-white border-amber-400 shadow-[0_12px_36px_rgba(0,0,0,0.12)] text-slate-900"
        : isWhatsApp
        ? "bg-[#0B141B] border-amber-500/60 shadow-[0_16px_45px_rgba(0,0,0,0.85)] text-white"
        : "bg-[#0B1426] border-amber-500/60 shadow-[0_16px_45px_rgba(0,0,0,0.85)] text-white"
    }`}>
      {/* Header do Toast */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-black uppercase tracking-wider ${
                isClean ? "text-amber-800" : "text-amber-300"
              }`}>
                Lead Qualificado pela IA
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            </div>
            <p className={`text-[10px] font-medium ${
              isClean ? "text-slate-600" : "text-slate-400"
            }`}>
              Transbordo para Atendimento Humano
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
            isClean
              ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              : "text-slate-400 hover:text-white hover:bg-slate-800/80"
          }`}
          title="Fechar"
        >
          <X size={15} />
        </button>
      </div>

      {/* Card do Lead */}
      <div className={`rounded-xl p-3 border mb-3 space-y-2 ${
        isClean
          ? "bg-slate-100/90 border-slate-200"
          : isWhatsApp
          ? "bg-[#111B21] border-emerald-900/40"
          : "bg-slate-900/90 border-slate-800"
      }`}>
        <div className="flex items-center justify-between gap-2">
          <h4 className={`font-bold text-sm truncate ${isClean ? "text-slate-900" : "text-white"}`}>
            {contactName || 'Lead Interessado'}
          </h4>
          {contactPhone && (
            <span className={`text-[11px] font-mono font-bold shrink-0 ${
              isClean ? "text-amber-800" : "text-amber-400"
            }`}>
              {contactPhone}
            </span>
          )}
        </div>

        {product && product !== 'Não informado' && product !== 'Atendimento Comercial' && (
          <div className={`text-[11px] font-medium flex items-center gap-1.5 ${isClean ? "text-slate-700" : "text-slate-300"}`}>
            <span className={isClean ? "text-slate-500" : "text-slate-400"}>Interesse:</span>
            <span className={`font-bold truncate max-w-[220px] ${isClean ? "text-slate-900" : "text-white"}`}>{product}</span>
          </div>
        )}

        <p className={`text-[11px] leading-relaxed italic border-l-2 border-amber-500 pl-2 font-medium ${
          isClean ? "text-slate-700" : "text-slate-300"
        }`}>
          &ldquo;{reason || 'Lead solicitou especialista ou expressou necessidade de atendimento humano.'}&rdquo;
        </p>
      </div>

      {/* Botões de Ação */}
      <div className={`flex items-center justify-end gap-2 pt-2 border-t ${
        isClean ? "border-slate-200" : "border-slate-800/80"
      }`}>
        <button
          type="button"
          onClick={onOpenCrm}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
            isClean
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
          }`}
        >
          <span>Ver no CRM</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenChat(conversationId)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isWhatsApp
              ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
              : "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
          }`}
        >
          <MessageSquare size={13} />
          <span>Atender no Chat</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

export function showLeadQualifiedToast(
  data: {
    conversationId?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    product?: string | null;
    reason?: string | null;
    dealId?: string | null;
  },
  router: any
) {
  if (isBlockedNotificationContext()) return;

  const stableKey = data.conversationId || data.dealId || data.contactPhone || 'lead_qual';
  const toastId = `lead_qual_${stableKey}`;

  toast.custom(
    (t) => (
      <LeadQualifiedToast
        toastId={t}
        conversationId={data.conversationId}
        contactName={data.contactName || 'Lead Qualificado'}
        contactPhone={data.contactPhone}
        product={data.product}
        reason={data.reason}
        dealId={data.dealId}
        onOpenChat={(cId) => {
          toast.dismiss(toastId);
          if (cId) {
            router.push(`/inbox?conversationId=${cId}`);
          } else {
            router.push('/inbox');
          }
        }}
        onOpenCrm={() => {
          toast.dismiss(toastId);
          router.push('/crm');
        }}
        onClose={() => toast.dismiss(toastId)}
      />
    ),
    {
      id: toastId,
      duration: 12000,
      position: 'top-right',
    }
  );
}
