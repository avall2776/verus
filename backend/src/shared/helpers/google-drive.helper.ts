import axios from 'axios';
import { getValidGoogleAccessToken } from './google-oauth.helper';

/**
 * Utilitário backend para integração, resolução e streaming de mídias do Google Drive
 * Evita armazenamento de gigabytes no banco/VPS fazendo streaming/proxy sob demanda.
 */

export function extractGoogleDriveId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Se já for apenas o ID (20+ caracteres alfanuméricos com hífens ou underlines)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // Padrões de links comuns do Google Drive
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('docs.google.com') ||
    url.includes('googleusercontent.com')
  );
}

export function detectMediaType(
  filenameOrUrl?: string | null,
  explicitType?: string | null,
): 'document' | 'image' | 'video' {
  if (explicitType === 'image' || explicitType === 'video' || explicitType === 'document') {
    return explicitType;
  }

  const str = (filenameOrUrl || '').toLowerCase();
  if (
    str.endsWith('.mp4') ||
    str.endsWith('.mov') ||
    str.endsWith('.mkv') ||
    str.endsWith('.webm') ||
    str.endsWith('.avi') ||
    str.includes('video')
  ) {
    return 'video';
  }

  if (
    str.endsWith('.png') ||
    str.endsWith('.jpg') ||
    str.endsWith('.jpeg') ||
    str.endsWith('.webp') ||
    str.endsWith('.gif') ||
    str.endsWith('.svg')
  ) {
    return 'image';
  }

  return 'document';
}

export function getMimeType(filenameOrExt: string, fallbackType: 'document' | 'image' | 'video' = 'document'): string {
  const lower = filenameOrExt.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (fallbackType === 'image') return 'image/jpeg';
  if (fallbackType === 'video') return 'video/mp4';
  return 'application/pdf';
}

/**
 * Baixa o binário do Google Drive diretamente em memória para conversão em Base64 Data URI
 * Suporta fallback inteligente com API Key ou URL de export direto confirmada.
 */
export async function downloadDriveFileBuffer(
  driveFileId: string,
  apiKey?: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const effectiveKey = apiKey || process.env.GOOGLE_DRIVE_API_KEY;

  // Tentativa 0: OAuth Access Token se a conta estiver conectada
  try {
    const oauthToken = await getValidGoogleAccessToken();
    if (oauthToken) {
      const apiUrl = `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`;
      const res = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${oauthToken}` },
        responseType: 'arraybuffer',
        timeout: 25000,
      });

      const mimeType = (res.headers['content-type'] as string) || 'application/octet-stream';
      return {
        buffer: Buffer.from(res.data),
        mimeType,
      };
    }
  } catch (oauthErr: any) {
    // segue para as demais tentativas caso o token falhe
  }

  // Tentativa 1: Google Drive API v3 oficial com API Key
  if (effectiveKey) {
    try {
      const apiUrl = `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media&key=${effectiveKey}`;
      const res = await axios.get(apiUrl, {
        responseType: 'arraybuffer',
        timeout: 25000,
      });

      const mimeType = (res.headers['content-type'] as string) || 'application/octet-stream';
      return {
        buffer: Buffer.from(res.data),
        mimeType,
      };
    } catch (apiErr: any) {
      console.warn(`[DRIVE_HELPER] Falha ao baixar via Google Drive API Key (${apiErr.message}). Tentando fallback UC...`);
    }
  }

  // Tentativa 2: Direct UC Download (para arquivos públicos / com link de compartilhamento)
  try {
    const ucUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}&confirm=t`;
    const res = await axios.get(ucUrl, {
      responseType: 'arraybuffer',
      timeout: 25000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const contentType = (res.headers['content-type'] as string) || '';
    // Se retornou página HTML de login ou confirmação, o arquivo não pôde ser baixado diretamente pelo UC
    if (!contentType.includes('text/html')) {
      return {
        buffer: Buffer.from(res.data),
        mimeType: contentType || 'application/octet-stream',
      };
    }
  } catch (ucErr: any) {
    console.warn(`[DRIVE_HELPER] Falha no fallback UC: ${ucErr.message}`);
  }

  // Tentativa 3: lh3 para fotos e imagens
  try {
    const lh3Url = `https://lh3.googleusercontent.com/d/${driveFileId}`;
    const res = await axios.get(lh3Url, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });
    const contentType = (res.headers['content-type'] as string) || '';
    if (contentType.startsWith('image/')) {
      return {
        buffer: Buffer.from(res.data),
        mimeType: contentType,
      };
    }
  } catch {
    // ignore
  }

  return null;
}
