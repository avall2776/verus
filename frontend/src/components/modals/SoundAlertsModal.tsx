"use client";

import React, { useState, useEffect } from "react";
import { 
  Volume2, VolumeX, Bell, Smartphone, Instagram, 
  LifeBuoy, Settings2, Play, Check, X, Eye, EyeOff, Sparkles, MessageSquare 
} from "lucide-react";
import toast from "react-hot-toast";
import { 
  getSoundSettings, 
  saveSoundSettings, 
  SoundSettings, 
  DEFAULT_SOUND_SETTINGS 
} from "@/lib/soundSettings";
import { showLeadMessageToast } from "@/components/notifications/NotificationToast";

interface SoundAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SoundAlertsModal({ isOpen, onClose }: SoundAlertsModalProps) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SOUND_SETTINGS);
  const [playingChannel, setPlayingChannel] = useState<string | null>(null);

  // Carregar configurações sincronizadas
  useEffect(() => {
    if (isOpen) {
      setSettings(getSoundSettings());
    }
  }, [isOpen]);

  // Listener para fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Gerador de áudio sintético via Web Audio API para preview real no navegador
  const playPreviewTone = (channel: "whatsapp" | "instagram" | "support" | "system") => {
    if (settings.masterMute) {
      toast("O áudio mestre está silenciado");
      return;
    }

    const cfg = settings[channel];
    if (!cfg.enabled) {
      toast("Este canal de áudio está desativado");
      return;
    }

    setPlayingChannel(channel);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const gain = ctx.createGain();
      const volumeLevel = (cfg.volume / 100) * 0.3; // Normalização de ganho
      gain.gain.setValueAtTime(volumeLevel, ctx.currentTime);
      gain.connect(ctx.destination);

      if (channel === "whatsapp") {
        // Notificação pop duplo (800Hz e 1200Hz)
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(800, ctx.currentTime);
        osc1.connect(gain);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.08);

        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
        osc2.connect(gain);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.22);
      } else if (channel === "instagram") {
        // Toque suave em ascensão (523Hz para 659Hz)
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.25);
        osc.connect(gain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.28);
      } else if (channel === "support") {
        // Sino de chamado de atendimento (600Hz com harmônico de 900Hz)
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(600, ctx.currentTime);
        osc1.connect(gain);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.35);

        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(900, ctx.currentTime + 0.08);
        osc2.connect(gain);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.45);
      } else {
        // Notificação de sistema (880Hz suave)
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.connect(gain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }

      setTimeout(() => {
        setPlayingChannel(null);
        ctx.close();
      }, 500);
    } catch (e) {
      console.error("Web Audio API error:", e);
      setPlayingChannel(null);
    }
  };

  const handleToggleMasterMute = () => {
    const updated: SoundSettings = { ...settings, masterMute: !settings.masterMute };
    setSettings(updated);
    saveSoundSettings(updated); // Persiste imediatamente em tempo real
    if (updated.masterMute) {
      toast("Todos os avisos sonoros foram silenciados instantaneamente.");
    } else {
      toast.success("Avisos sonoros reativados.");
    }
  };

  const handleToggleChannel = (channel: "whatsapp" | "instagram" | "support" | "system") => {
    setSettings((prev) => {
      const updated: SoundSettings = {
        ...prev,
        [channel]: {
          ...prev[channel],
          enabled: !prev[channel].enabled,
        },
      };
      saveSoundSettings(updated);
      return updated;
    });
  };

  const handleVolumeChange = (channel: "whatsapp" | "instagram" | "support" | "system", val: number) => {
    setSettings((prev) => {
      const updated: SoundSettings = {
        ...prev,
        [channel]: {
          ...prev[channel],
          volume: val,
        },
      };
      saveSoundSettings(updated);
      return updated;
    });
  };

  const handleToggleVisualNotification = (type: "whatsapp" | "transfers" | "leadQualified") => {
    setSettings((prev) => {
      const currentVal = prev.visualNotifications?.[type] ?? true;
      const updated: SoundSettings = {
        ...prev,
        visualNotifications: {
          whatsapp: prev.visualNotifications?.whatsapp ?? DEFAULT_SOUND_SETTINGS.visualNotifications.whatsapp,
          transfers: prev.visualNotifications?.transfers ?? DEFAULT_SOUND_SETTINGS.visualNotifications.transfers,
          leadQualified: prev.visualNotifications?.leadQualified ?? DEFAULT_SOUND_SETTINGS.visualNotifications.leadQualified,
          [type]: !currentVal,
        },
      };
      saveSoundSettings(updated);
      if (!currentVal) {
        toast.success("Popups visuais ativados na tela.");
      } else {
        toast("Popups visuais desativados. Modo foco ativado para não interromper seu trabalho.");
      }
      return updated;
    });
  };

  const handleTestVisualNotification = () => {
    const isEnabled = settings.visualNotifications?.whatsapp ?? true;
    if (!isEnabled) {
      toast("Os popups visuais estão desativados. Ative a chave acima para exibir na tela.");
      return;
    }
    showLeadMessageToast({
      conversationId: "demo_test_preview",
      contactName: "Leticia Barichello (Teste)",
      contactPhone: "+55 (54) 98135-9444",
      messageContent: "Olá! Demonstração do balão flutuante na tela.",
      messageType: "TEXT",
    }, { push: () => {} });
  };

  const handleSave = () => {
    try {
      saveSoundSettings(settings);
      toast.success("Preferências salvas com sucesso!");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar configurações.");
    }
  };

  const isVisualWhatsappEnabled = settings.visualNotifications?.whatsapp ?? true;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0B1224] border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 text-slate-900 dark:text-white overflow-hidden"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alertas Sonoros & Notificações</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Controles de som e avisos visuais na tela por usuário</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo com rolagem suave */}
        <div className="overflow-y-auto pr-1 space-y-3.5 flex-1">
          {/* Card Principal: Notificação Visual na Tela (Popups Flutuantes do WhatsApp) */}
          <div className={`p-4 rounded-xl border transition-all ${
            isVisualWhatsappEnabled
              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 shadow-xs"
              : "bg-slate-50 dark:bg-[#070D1B] border-slate-200 dark:border-slate-800 opacity-90"
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                  isVisualWhatsappEnabled
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                }`}>
                  {isVisualWhatsappEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Popups Visuais do WhatsApp</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isVisualWhatsappEnabled
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                    }`}>
                      {isVisualWhatsappEnabled ? "Popups Ativos na Tela" : "Modo Foco (Popups Ocultos)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Exibe o card flutuante no canto superior ao chegar novas mensagens. Desative caso trabalhe em outras áreas (como cadastro de produtos, CRM, financeiro) para não ser interrompido visualmente na tela.
                  </p>
                </div>
              </div>

              {/* Switch Toggle */}
              <button
                type="button"
                onClick={() => handleToggleVisualNotification("whatsapp")}
                aria-label="Alternar exibição de popups visuais do WhatsApp"
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 mt-0.5 ${
                  isVisualWhatsappEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  isVisualWhatsappEnabled ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Ação de Demonstração */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                {isVisualWhatsappEnabled
                  ? "As mensagens abrirão o balão interativo."
                  : "Avisos na tela suprimidos. Sem interrupções de popup."}
              </span>
              <button
                type="button"
                onClick={handleTestVisualNotification}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Play className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                Testar Notificação na Tela
              </button>
            </div>
          </div>

          {/* Master Mute Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#070D1B] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {settings.masterMute ? (
                <VolumeX className="w-5 h-5 text-rose-500" />
              ) : (
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Silenciar Todos os Sons</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Desativa instantaneamente avisos sonoros de todas as fontes</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleMasterMute}
              aria-label="Silenciar todos os sons"
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                settings.masterMute ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                settings.masterMute ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* Canais Independentes de Áudio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Canais de Áudio & Volume
              </span>
            </div>

            {/* WhatsApp Áudio */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              settings.whatsapp.enabled && !settings.masterMute
                ? "bg-white dark:bg-[#070D1B] border-slate-200 dark:border-slate-700/80 shadow-xs"
                : "bg-slate-50/70 dark:bg-[#070D1B]/50 border-slate-200 dark:border-slate-800/60 opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Som do WhatsApp (Mensagens Recebidas)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playPreviewTone("whatsapp")}
                    disabled={playingChannel === "whatsapp" || !settings.whatsapp.enabled || settings.masterMute}
                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5" /> Testar
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.whatsapp.enabled}
                    onChange={() => handleToggleChannel("whatsapp")}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 w-12">Volume:</span>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  disabled={!settings.whatsapp.enabled || settings.masterMute}
                  value={settings.whatsapp.volume}
                  onChange={(e) => handleVolumeChange("whatsapp", Number(e.target.value))}
                  className="flex-1 accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono w-8 text-right font-medium">
                  {settings.whatsapp.volume}%
                </span>
              </div>
            </div>

            {/* Instagram */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              settings.instagram.enabled && !settings.masterMute
                ? "bg-white dark:bg-[#070D1B] border-slate-200 dark:border-slate-700/80 shadow-xs"
                : "bg-slate-50/70 dark:bg-[#070D1B]/50 border-slate-200 dark:border-slate-800/60 opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Instagram Direct & Comentários</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playPreviewTone("instagram")}
                    disabled={playingChannel === "instagram" || !settings.instagram.enabled || settings.masterMute}
                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5" /> Testar
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.instagram.enabled}
                    onChange={() => handleToggleChannel("instagram")}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 w-12">Volume:</span>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  disabled={!settings.instagram.enabled || settings.masterMute}
                  value={settings.instagram.volume}
                  onChange={(e) => handleVolumeChange("instagram", Number(e.target.value))}
                  className="flex-1 accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono w-8 text-right font-medium">
                  {settings.instagram.volume}%
                </span>
              </div>
            </div>

            {/* Suporte */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              settings.support.enabled && !settings.masterMute
                ? "bg-white dark:bg-[#070D1B] border-slate-200 dark:border-slate-700/80 shadow-xs"
                : "bg-slate-50/70 dark:bg-[#070D1B]/50 border-slate-200 dark:border-slate-800/60 opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <LifeBuoy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Central de Suporte (Chamados & Respostas)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playPreviewTone("support")}
                    disabled={playingChannel === "support" || !settings.support.enabled || settings.masterMute}
                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5" /> Testar
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.support.enabled}
                    onChange={() => handleToggleChannel("support")}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 w-12">Volume:</span>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  disabled={!settings.support.enabled || settings.masterMute}
                  value={settings.support.volume}
                  onChange={(e) => handleVolumeChange("support", Number(e.target.value))}
                  className="flex-1 accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono w-8 text-right font-medium">
                  {settings.support.volume}%
                </span>
              </div>
            </div>

            {/* Sistema */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              settings.system.enabled && !settings.masterMute
                ? "bg-white dark:bg-[#070D1B] border-slate-200 dark:border-slate-700/80 shadow-xs"
                : "bg-slate-50/70 dark:bg-[#070D1B]/50 border-slate-200 dark:border-slate-800/60 opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Settings2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Sistema (Alertas CRM & Metas)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playPreviewTone("system")}
                    disabled={playingChannel === "system" || !settings.system.enabled || settings.masterMute}
                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5" /> Testar
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.system.enabled}
                    onChange={() => handleToggleChannel("system")}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 w-12">Volume:</span>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  disabled={!settings.system.enabled || settings.masterMute}
                  value={settings.system.volume}
                  onChange={(e) => handleVolumeChange("system", Number(e.target.value))}
                  className="flex-1 accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono w-8 text-right font-medium">
                  {settings.system.volume}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
}
