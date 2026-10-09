"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Headphones, X, Building2, User } from "lucide-react";
import { useSocket } from "@/components/ui/SocketProvider";

export interface SupportAlertData {
  id: string; // ID único do alerta para a fila visual
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

  const [alerts, setAlerts] = useState<SupportAlertData[]>([]);
  const originalTitleRef = useRef<string>("");
  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Desbloqueia AudioContext na primeira interação para contornar políticas de autoplay dos navegadores
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const dummy = new AudioCtx();
          if (dummy.state === "suspended") {
            dummy.resume();
          }
        }
      } catch {}
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };

    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Sintetizador acústico harmônico via Web Audio API (Fallback de extrema confiabilidade)
  const playSynthesizedChime = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      // Tom 1: Cristalino E5 (659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.35, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);

      // Tom 2: Acorde harmônico A5 (880Hz)
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(880, ctx.currentTime);
          gain2.gain.setValueAtTime(0.4, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.65);
        } catch {}
      }, 90);
    } catch {}
  }, []);

  // Disparo de aviso sonoro cristalino
  const playChimeSound = useCallback(() => {
    try {
      if (typeof window === "undefined") return;

      const audio = new Audio("/vallor/sounds/notification-glass.wav");
      audio.volume = 0.85;
      const promise = audio.play();

      if (promise !== undefined) {
        promise.catch(() => {
          playSynthesizedChime();
        });
      }
    } catch {
      playSynthesizedChime();
    }
  }, [playSynthesizedChime]);

  // Alerta piscante no título da aba do navegador para chamar atenção imediata
  const triggerTabBlink = useCallback((text: string) => {
    if (typeof document === "undefined") return;
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title || "VALLOR";
    }

    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
    }

    let isAlert = true;
    let count = 0;
    titleIntervalRef.current = setInterval(() => {
      document.title = isAlert ? text : originalTitleRef.current;
      isAlert = !isAlert;
      count++;
      if (count > 14) {
        if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
        document.title = originalTitleRef.current;
      }
    }, 700);
  }, []);

  // Remove um alerta específico da fila
  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Escuta WebSocket de atualizações de chamados de todos os tenants
  useEffect(() => {
    if (!socket) return;

    const handleAdminTicketUpdated = (data: any) => {
      if (!data) return;

      const ticketId = data.ticketId || data.id;
      if (!ticketId) return;

      const msg = data.message || (Array.isArray(data.messages) && data.messages.length > 0 ? data.messages[0] : null);

      // Ignora mensagens enviadas pelo próprio Super Admin, pelo bot Sofia (IA) ou notas internas da equipe
      if (msg && (msg.senderRole === "SUPER_ADMIN" || msg.senderRole === "AI_AGENT" || msg.isInternal)) {
        return;
      }

      // Se o Super Admin estiver com este chamado exatamente aberto na tela e com foco, toca áudio e não empilha toast
      const isViewingThisTicket =
        typeof window !== "undefined" &&
        window.location.pathname === "/super-admin/support" &&
        window.location.search.includes(ticketId);

      if (isViewingThisTicket && document.hasFocus()) {
        playChimeSound();
        return;
      }

      const alertId = `${ticketId}-${Date.now()}`;
      const alertData: SupportAlertData = {
        id: alertId,
        ticketId,
        ticketNumber: data.ticketNumber || data.ticket?.ticketNumber || 1,
        subject: data.subject || data.ticket?.subject || "Atendimento Técnico",
        tenantName: data.tenant?.name || data.ticket?.tenant?.name || "Empresa Cliente",
        clientName: msg?.senderName || data.user?.name || data.ticket?.user?.name || "Cliente",
        content: msg?.content || data.description || data.ticket?.description || "Enviou uma nova mensagem no suporte.",
        priority: data.priority || data.ticket?.priority || "MEDIUM",
        createdAt: new Date().toISOString(),
      };

      // Adiciona o alerta na lista (máximo 3 visíveis simultaneamente)
      setAlerts((prev) => {
        const filtered = prev.filter((a) => a.ticketId !== ticketId);
        return [alertData, ...filtered].slice(0, 3);
      });

      // Toca o aviso sonoro com prioridade
      playChimeSound();

      // Alerta visual na aba do navegador
      triggerTabBlink(`🚨 [SUPORTE] ${alertData.clientName} (${alertData.tenantName})`);

      // Despacha evento customizado para atualizar badge na sidebar do layout
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("super_admin_new_support_ticket", { detail: alertData }));
      }

      // Agenda auto-dismiss deste alerta após 15 segundos
      setTimeout(() => {
        removeAlert(alertId);
      }, 15000);
    };

    socket.on("adminTicketUpdated", handleAdminTicketUpdated);

    return () => {
      socket.off("adminTicketUpdated", handleAdminTicketUpdated);
    };
  }, [socket, playChimeSound, triggerTabBlink, removeAlert]);

  // Se o usuário navegar para o chamado ativo, remove alertas daquele ticket
  useEffect(() => {
    if (pathname === "/super-admin/support" && typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("ticketId=")) {
        const match = search.match(/ticketId=([^&]+)/);
        if (match && match[1]) {
          const currentId = match[1];
          setAlerts((prev) => prev.filter((a) => a.ticketId !== currentId));
        }
      }
    }
  }, [pathname]);

  if (alerts.length === 0) return null;

  return (
    <div 
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role="alert"
          className="pointer-events-auto bg-[#0B1224]/95 backdrop-blur-xl border border-blue-500/70 rounded-2xl shadow-2xl shadow-black/90 p-4 text-white animate-in slide-in-from-top-4 duration-300 ring-2 ring-blue-500/20"
        >
          {/* Topo do Card com Badge e Protocolo */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <span className="text-xs font-black text-blue-400 tracking-wider uppercase flex items-center gap-1.5">
                <Headphones size={14} className="text-cyan-400 animate-pulse" />
                <span>Novo Chamado de Suporte</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                #HD-{String(alert.ticketNumber).padStart(4, "0")}
              </span>
              <button
                type="button"
                onClick={() => removeAlert(alert.id)}
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
              <span className="text-blue-300 truncate font-bold">{alert.tenantName}</span>
              <span className="text-slate-500">•</span>
              <User size={13} className="text-cyan-400 shrink-0" />
              <span className="text-white truncate">{alert.clientName}</span>
            </div>

            <div className="text-[11px] font-bold text-slate-200 truncate">
              Assunto: <span className="text-white">{alert.subject}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#070D1B] border border-slate-800 text-slate-300 text-[11px] leading-relaxed line-clamp-2 italic">
              &ldquo;{alert.content}&rdquo;
            </div>
          </div>

          {/* Rodapé com Ação Rápida */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-500 font-mono">
              {new Date(alert.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>

            <button
              type="button"
              onClick={() => {
                removeAlert(alert.id);
                router.push(`/super-admin/support?ticketId=${alert.ticketId}`);
              }}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Headphones size={13} />
              <span>Atender Chamado ➔</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
