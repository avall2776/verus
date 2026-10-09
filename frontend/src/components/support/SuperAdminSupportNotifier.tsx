"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Headphones, X, Building2, User, ChevronRight, Bell } from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";

export interface SupportAlertData {
  ticketId: string;
  ticketNumber: number;
  subject: string;
  tenantName: string;
  clientName: string;
  content: string;
  priority: string;
  createdAt: string;
}

export default function SuperAdminSupportNotifier() {
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();

  const [activeAlert, setActiveAlert] = useState<SupportAlertData | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const originalTitleRef = useRef<string>("");

  // Sintetizador Web Audio API de Fallback para garantir toque audível em qualquer ambiente
  const playChimeSound = useCallback(() => {
    try {
      if (typeof window === "undefined") return;

      // 1. Tenta reproduzir arquivo de áudio real
      const audio = new Audio("/sounds/notification-glass.wav");
      audio.volume = 0.75;
      const promise = audio.play();

      if (promise !== undefined) {
        promise.catch(() => {
          // 2. Se o navegador bloquear o arquivo, dispara sintetizador acústico via AudioContext
          playSynthesizedChime();
        });
      }
    } catch {
      playSynthesizedChime();
    }
  }, []);

  const playSynthesizedChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Tom 1: Ciano harmônico
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);

      // Tom 2: Acorde cristalino
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
          gain2.gain.setValueAtTime(0.35, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.6);
        } catch {}
      }, 100);
    } catch {}
  };

  // Piscar título da aba para chamar atenção se o administrador estiver em outra aba
  const triggerTabBlink = useCallback((text: string) => {
    if (typeof document === "undefined") return;
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title || "VALLOR";
    }

    let isAlert = true;
    let count = 0;
    const interval = setInterval(() => {
      document.title = isAlert ? text : originalTitleRef.current;
      isAlert = !isAlert;
      count++;
      if (count > 12) {
        clearInterval(interval);
        document.title = originalTitleRef.current;
      }
    }, 700);
  }, []);

  // Escuta WebSocket de atualizações de chamados de todos os tenants
  useEffect(() => {
    if (!socket) return;

    const handleAdminTicketUpdated = (data: any) => {
      if (!data) return;

      const ticketId = data.ticketId || data.id;
      if (!ticketId) return;

      const msg = data.message;
      const isClientMessage = 
        (msg && (msg.senderRole === "USER" || msg.senderRole === "CLIENT" || msg.senderRole === "CUSTOMER")) ||
        (!msg && data.status === "OPEN");

      // Ignora mensagens enviadas pelo próprio Super Admin ou robôs internos na tela
      if (msg && (msg.senderRole === "SUPER_ADMIN" || msg.senderRole === "ADMIN" || msg.senderRole === "AGENT")) {
        return;
      }

      // Se o Super Admin estiver com exatamente este chamado aberto na tela, não abre toast invasivo
      const isViewingThisTicket = 
        typeof window !== "undefined" && 
        window.location.pathname === "/super-admin/support" && 
        window.location.search.includes(ticketId);

      if (isViewingThisTicket && document.hasFocus()) {
        return;
      }

      // Prepara os dados do alerta
      const alertData: SupportAlertData = {
        ticketId,
        ticketNumber: data.ticketNumber || data.ticket?.ticketNumber || 1,
        subject: data.subject || data.ticket?.subject || "Atendimento Técnico",
        tenantName: data.tenant?.name || data.ticket?.tenant?.name || "Empresa Cliente",
        clientName: msg?.senderName || data.user?.name || data.ticket?.user?.name || "Cliente",
        content: msg?.content || data.description || data.ticket?.description || "Enviou uma nova mensagem no suporte.",
        priority: data.priority || data.ticket?.priority || "MEDIUM",
        createdAt: new Date().toISOString(),
      };

      // Dispara o alerta visual na tela
      setActiveAlert(alertData);

      // Toca o aviso sonoro
      playChimeSound();

      // Alerta na aba do navegador
      triggerTabBlink(`🚨 [SUPORTE] ${alertData.clientName} (${alertData.tenantName})`);

      // Despacha evento customizado para atualizar badge na sidebar do layout
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("super_admin_new_support_ticket", { detail: alertData }));
      }

      // Timer para auto-recolher o toast após 14 segundos
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setActiveAlert(null);
      }, 14000);
    };

    socket.on("adminTicketUpdated", handleAdminTicketUpdated);

    return () => {
      socket.off("adminTicketUpdated", handleAdminTicketUpdated);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [socket, playChimeSound, triggerTabBlink]);

  // Se o usuário navegar diretamente para a central e abrir o ticket, fecha o toast
  useEffect(() => {
    if (pathname === "/super-admin/support" && activeAlert) {
      if (typeof window !== "undefined" && window.location.search.includes(activeAlert.ticketId)) {
        setActiveAlert(null);
      }
    }
  }, [pathname, activeAlert]);

  if (!activeAlert) return null;

  return (
    <div 
      role="alert"
      className="fixed top-4 right-4 z-[9999] max-w-sm sm:max-w-md w-[calc(100vw-2rem)] bg-[#0B1224]/95 backdrop-blur-xl border border-blue-500/60 rounded-2xl shadow-2xl shadow-black/90 p-4 text-white animate-in slide-in-from-top-4 duration-300 ring-2 ring-blue-500/20"
    >
      {/* Topo do Card com Badge e Protocolo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-xs font-black text-blue-400 tracking-wider uppercase flex items-center gap-1.5">
            <Headphones size={14} className="text-cyan-400 animate-pulse" />
            <span>Novo Chamado de Cliente</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            #HD-{String(activeAlert.ticketNumber).padStart(4, "0")}
          </span>
          <button 
            type="button"
            onClick={() => setActiveAlert(null)} 
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar notificação"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Conteúdo Informativo */}
      <div className="mt-2.5 space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold truncate">
          <Building2 size={13} className="text-blue-400 shrink-0" />
          <span className="text-blue-300 truncate font-bold">{activeAlert.tenantName}</span>
          <span className="text-slate-500">•</span>
          <User size={13} className="text-cyan-400 shrink-0" />
          <span className="text-white truncate">{activeAlert.clientName}</span>
        </div>

        <div className="text-[11px] font-bold text-slate-200 truncate">
          Assunto: <span className="text-white">{activeAlert.subject}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#070D1B] border border-slate-800 text-slate-300 text-[11px] leading-relaxed line-clamp-2 italic">
          &ldquo;{activeAlert.content}&rdquo;
        </div>
      </div>

      {/* Rodapé com Ação Rápida */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <span className="text-[10px] text-slate-500 font-mono">
          {new Date(activeAlert.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>

        <button
          type="button"
          onClick={() => {
            setActiveAlert(null);
            router.push(`/super-admin/support?ticketId=${activeAlert.ticketId}`);
          }}
          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
        >
          <Headphones size={13} />
          <span>Atender Chamado ➔</span>
        </button>
      </div>
    </div>
  );
}
