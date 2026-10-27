export interface SoundChannelConfig {
  enabled: boolean;
  volume: number; // 0 to 100
}

export interface VisualNotificationConfig {
  whatsapp: boolean; // Popups flutuantes na tela para mensagens recebidas do WhatsApp
  transfers: boolean; // Popups flutuantes para transferências de chamados
  leadQualified: boolean; // Popups flutuantes para leads qualificados pela IA
}

export interface SoundSettings {
  masterMute: boolean;
  whatsapp: SoundChannelConfig;
  instagram: SoundChannelConfig;
  support: SoundChannelConfig;
  system: SoundChannelConfig;
  visualNotifications: VisualNotificationConfig;
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  masterMute: false,
  whatsapp: { enabled: true, volume: 80 },
  instagram: { enabled: true, volume: 75 },
  support: { enabled: true, volume: 90 },
  system: { enabled: true, volume: 70 },
  visualNotifications: {
    whatsapp: true,
    transfers: true,
    leadQualified: true,
  },
};

export const SOUND_SETTINGS_STORAGE_KEY = "versus_sound_settings";
export const SOUND_SETTINGS_EVENT = "sound_settings_updated";

/**
 * Lê de forma reativa e segura as preferências de áudio gravadas no localStorage
 */
export function getSoundSettings(): SoundSettings {
  if (typeof window === "undefined") return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = localStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        masterMute: Boolean(parsed.masterMute),
        whatsapp: {
          enabled: parsed.whatsapp?.enabled ?? DEFAULT_SOUND_SETTINGS.whatsapp.enabled,
          volume: Number.isFinite(parsed.whatsapp?.volume) ? parsed.whatsapp.volume : DEFAULT_SOUND_SETTINGS.whatsapp.volume,
        },
        instagram: {
          enabled: parsed.instagram?.enabled ?? DEFAULT_SOUND_SETTINGS.instagram.enabled,
          volume: Number.isFinite(parsed.instagram?.volume) ? parsed.instagram.volume : DEFAULT_SOUND_SETTINGS.instagram.volume,
        },
        support: {
          enabled: parsed.support?.enabled ?? DEFAULT_SOUND_SETTINGS.support.enabled,
          volume: Number.isFinite(parsed.support?.volume) ? parsed.support.volume : DEFAULT_SOUND_SETTINGS.support.volume,
        },
        system: {
          enabled: parsed.system?.enabled ?? DEFAULT_SOUND_SETTINGS.system.enabled,
          volume: Number.isFinite(parsed.system?.volume) ? parsed.system.volume : DEFAULT_SOUND_SETTINGS.system.volume,
        },
        visualNotifications: {
          whatsapp: parsed.visualNotifications?.whatsapp ?? DEFAULT_SOUND_SETTINGS.visualNotifications.whatsapp,
          transfers: parsed.visualNotifications?.transfers ?? DEFAULT_SOUND_SETTINGS.visualNotifications.transfers,
          leadQualified: parsed.visualNotifications?.leadQualified ?? DEFAULT_SOUND_SETTINGS.visualNotifications.leadQualified,
        },
      };
    }
  } catch (err) {
    console.warn("[SoundSettings] Erro ao carregar configurações de som:", err);
  }
  return DEFAULT_SOUND_SETTINGS;
}

/**
 * Salva as preferências de áudio e despacha evento global para atualização imediata
 */
export function saveSoundSettings(settings: SoundSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SOUND_SETTINGS_EVENT, { detail: settings }));
  } catch (err) {
    console.error("[SoundSettings] Erro ao salvar configurações de som:", err);
  }
}

export type AudioChannel = "whatsapp" | "instagram" | "support" | "system";
export type VisualChannel = "whatsapp" | "transfers" | "leadQualified";

/**
 * Verifica se um canal específico ou o áudio geral está silenciado
 */
export function isSoundChannelMuted(channel: AudioChannel = "whatsapp"): boolean {
  const current = getSoundSettings();
  if (current.masterMute) return true;
  const cfg = current[channel];
  if (!cfg || !cfg.enabled || cfg.volume <= 0) return true;
  return false;
}

/**
 * Obtém o multiplicador de ganho de volume (0.0 a 1.0) para um canal
 */
export function getChannelVolumeMultiplier(channel: AudioChannel = "whatsapp"): number {
  const current = getSoundSettings();
  if (current.masterMute) return 0;
  const cfg = current[channel];
  if (!cfg || !cfg.enabled) return 0;
  return Math.max(0, Math.min(1, cfg.volume / 100));
}

/**
 * Verifica se as notificações visuais (popups flutuantes na tela) estão ativadas para o canal
 */
export function isVisualNotificationEnabled(type: VisualChannel = "whatsapp"): boolean {
  const current = getSoundSettings();
  if (!current.visualNotifications) return true;
  return current.visualNotifications[type] ?? true;
}

/**
 * Atualiza o status de notificação visual com persistência imediata e disparo de evento reativo
 */
export function setVisualNotification(type: "whatsapp" | "transfers" | "leadQualified", enabled: boolean): void {
  const current = getSoundSettings();
  const updated: SoundSettings = {
    ...current,
    visualNotifications: {
      whatsapp: current.visualNotifications?.whatsapp ?? DEFAULT_SOUND_SETTINGS.visualNotifications.whatsapp,
      transfers: current.visualNotifications?.transfers ?? DEFAULT_SOUND_SETTINGS.visualNotifications.transfers,
      leadQualified: current.visualNotifications?.leadQualified ?? DEFAULT_SOUND_SETTINGS.visualNotifications.leadQualified,
      [type]: enabled,
    },
  };
  saveSoundSettings(updated);
}

