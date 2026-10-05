/**
 * Utilitários para validação e sanitização de URLs de mídias e avatares.
 * Previne requisições com URLs expiradas da Meta/WhatsApp (pps.whatsapp.net / fbcdn.net),
 * que geram erros vermelhos "403 (Forbidden)" no console do navegador e atrasam renderizações.
 */

export function isAvatarUrlValid(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === 'false' ||
    trimmed.includes('unsplash.com')
  ) {
    return false;
  }

  // URLs assinadas da Meta CDN (WhatsApp / Facebook) contêm o parâmetro `oe`
  // que representa a expiração Unix em timestamp hexadecimal (ex: oe=6ABE6B11)
  if (trimmed.includes('pps.whatsapp.net') || trimmed.includes('fbcdn.net')) {
    try {
      const urlObj = new URL(trimmed);
      const oe = urlObj.searchParams.get('oe');
      if (oe) {
        const expireTimestampSec = parseInt(oe, 16);
        const nowSec = Math.floor(Date.now() / 1000);
        // Se a URL já expirou ou vai expirar nos próximos 30 segundos, não tentar carregar
        if (!isNaN(expireTimestampSec) && expireTimestampSec <= nowSec + 30) {
          return false;
        }
      }
    } catch {
      return false;
    }
  }

  return true;
}

export function sanitizeAvatarUrl(url?: string | null): string | null {
  return isAvatarUrlValid(url) ? url!.trim() : null;
}
