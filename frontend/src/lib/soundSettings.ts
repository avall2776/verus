export interface SoundChannelConfig {
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

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  masterMute: false,
  whatsapp: { enabled: true, volume: 80 },
  instagram: { enabled: true, volume: 75 },
  support: { enabled: true, volume: 90 },
  system: { enabled: true, volume: 70 },
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

/**
 * Verifica se um canal específico ou o áudio geral está silenciado
 */
export function isSoundChannelMuted(channel: keyof Omit<SoundSettings, "masterMute"> = "whatsapp"): boolean {
  const current = getSoundSettings();
  if (current.masterMute) return true;
  const cfg = current[channel];
  if (!cfg || !cfg.enabled || cfg.volume <= 0) return true;
  return false;
}

/**
 * Obtém o multiplicador de ganho de volume (0.0 a 1.0) para um canal
 */
export function getChannelVolumeMultiplier(channel: keyof Omit<SoundSettings, "masterMute"> = "whatsapp"): number {
  const current = getSoundSettings();
  if (current.masterMute) return 0;
  const cfg = current[channel];
  if (!cfg || !cfg.enabled) return 0;
  return Math.max(0, Math.min(1, cfg.volume / 100));
}
