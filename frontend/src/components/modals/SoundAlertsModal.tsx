"use client";

import React, { useState, useEffect } from "react";
import { 
  Volume2, VolumeX, Bell, Smartphone, Instagram, 
  LifeBuoy, Settings2, Play, Check, X, Sparkles 
} from "lucide-react";
import toast from "react-hot-toast";

interface SoundChannelConfig {
  enabled: boolean;
  volume: number; // 0 to 100
}

export interface SoundSettings {
  masterMute: boolean;
  whatsapp: SoundChannelConfig;
  instagram: SoundChannelConfig;
  support: SoundChannelConfig;
  system: SoundChannelConfig;
}

const DEFAULT_SETTINGS: SoundSettings = {
  masterMute: false,
  whatsapp: { enabled: true, volume: 80 },
  instagram: { enabled: true, volume: 75 },
  support: { enabled: true, volume: 90 },
  system: { enabled: true, volume: 70 },
};

interface SoundAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SoundAlertsModal({ isOpen, onClose }: SoundAlertsModalProps) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [playingChannel, setPlayingChannel] = useState<string | null>(null);

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("versus_sound_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.warn("Erro ao carregar configurações de som:", e);
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
      toast("O áudio mestre está silenciado", { icon: "🔇" });
      return;
    }

    const cfg = settings[channel];
    if (!cfg.enabled) {
      toast("Este canal de notificação está desativado", { icon: "⚠️" });
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

  const handleToggleChannel = (channel: keyof Omit<SoundSettings, "masterMute">) => {
    setSettings((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        enabled: !prev[channel].enabled,
      },
    }));
  };

  const handleVolumeChange = (channel: keyof Omit<SoundSettings, "masterMute">, val: number) => {
    setSettings((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        volume: val,
      },
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem("versus_sound_settings", JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent("sound_settings_updated", { detail: settings }));
      toast.success("Preferências de som salvas!");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar configurações de som.");
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0B1224] border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 text-white"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Alertas Sonoros & Notificações</h3>
              <p className="text-[11px] text-slate-400">Controles independentes de áudio por canal de atendimento</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Mute Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#070D1B] border border-slate-800">
          <div className="flex items-center gap-2.5">
            {settings.masterMute ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Bell className="w-4 h-4 text-blue-400" />
            )}
            <div>
              <span className="text-xs font-bold text-white block">Silenciar Todos os Sons</span>
              <span className="text-[10px] text-slate-400">Desativa instantaneamente avisos sonoros de todas as fontes</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettings((p) => ({ ...p, masterMute: !p.masterMute }))}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.masterMute ? "bg-rose-500" : "bg-slate-700"
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              settings.masterMute ? "translate-x-5" : "translate-x-0"
            }`} />
          </button>
        </div>

        {/* Canais Independentes */}
        <div className="space-y-3.5">
          {/* WhatsApp */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            settings.whatsapp.enabled && !settings.masterMute
              ? "bg-[#070D1B] border-slate-700/80"
              : "bg-[#070D1B]/50 border-slate-800/60 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">WhatsApp (Mensagens Recebidas)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playPreviewTone("whatsapp")}
                  disabled={playingChannel === "whatsapp" || !settings.whatsapp.enabled || settings.masterMute}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-40"
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
              <span className="text-[10px] text-slate-400 w-12">Volume:</span>
              <input 
                type="range"
                min="0"
                max="100"
                disabled={!settings.whatsapp.enabled || settings.masterMute}
                value={settings.whatsapp.volume}
                onChange={(e) => handleVolumeChange("whatsapp", Number(e.target.value))}
                className="flex-1 accent-blue-600 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                {settings.whatsapp.volume}%
              </span>
            </div>
          </div>

          {/* Instagram */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            settings.instagram.enabled && !settings.masterMute
              ? "bg-[#070D1B] border-slate-700/80"
              : "bg-[#070D1B]/50 border-slate-800/60 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Instagram className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">Instagram Direct & Comentários</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playPreviewTone("instagram")}
                  disabled={playingChannel === "instagram" || !settings.instagram.enabled || settings.masterMute}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-40"
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
              <span className="text-[10px] text-slate-400 w-12">Volume:</span>
              <input 
                type="range"
                min="0"
                max="100"
                disabled={!settings.instagram.enabled || settings.masterMute}
                value={settings.instagram.volume}
                onChange={(e) => handleVolumeChange("instagram", Number(e.target.value))}
                className="flex-1 accent-blue-600 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                {settings.instagram.volume}%
              </span>
            </div>
          </div>

          {/* Suporte */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            settings.support.enabled && !settings.masterMute
              ? "bg-[#070D1B] border-slate-700/80"
              : "bg-[#070D1B]/50 border-slate-800/60 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <LifeBuoy className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">Central de Suporte (Chamados & Respostas)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playPreviewTone("support")}
                  disabled={playingChannel === "support" || !settings.support.enabled || settings.masterMute}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-40"
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
              <span className="text-[10px] text-slate-400 w-12">Volume:</span>
              <input 
                type="range"
                min="0"
                max="100"
                disabled={!settings.support.enabled || settings.masterMute}
                value={settings.support.volume}
                onChange={(e) => handleVolumeChange("support", Number(e.target.value))}
                className="flex-1 accent-blue-600 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                {settings.support.volume}%
              </span>
            </div>
          </div>

          {/* Sistema */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            settings.system.enabled && !settings.masterMute
              ? "bg-[#070D1B] border-slate-700/80"
              : "bg-[#070D1B]/50 border-slate-800/60 opacity-60"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Settings2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">Sistema (Alertas CRM & Metas)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playPreviewTone("system")}
                  disabled={playingChannel === "system" || !settings.system.enabled || settings.masterMute}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-40"
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
              <span className="text-[10px] text-slate-400 w-12">Volume:</span>
              <input 
                type="range"
                min="0"
                max="100"
                disabled={!settings.system.enabled || settings.masterMute}
                value={settings.system.volume}
                onChange={(e) => handleVolumeChange("system", Number(e.target.value))}
                className="flex-1 accent-blue-600 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                {settings.system.volume}%
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
}
