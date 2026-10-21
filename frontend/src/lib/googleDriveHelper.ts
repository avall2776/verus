/**
 * Utilitário para integração e extração de metadados do Google Drive
 * Permite renderizar miniaturas de imagens e players de vídeo diretamente
 * na aplicação, mantendo o armazenamento 100% no Google Drive (5 TB)
 * sem sobrecarregar o banco de dados.
 */

export function extractGoogleDriveId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;

  // Se já for apenas o ID (letras, números, hífens e underlines com tamanho típico)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(urlOrId.trim())) {
    return urlOrId.trim();
  }

  // Regex para diversos formatos de URL do Google Drive
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // drive.google.com/file/d/ID/view
    /id=([a-zA-Z0-9_-]+)/,          // drive.google.com/open?id=ID ou uc?id=ID
    /\/folders\/([a-zA-Z0-9_-]+)/,  // drive.google.com/drive/folders/ID
    /\/d\/([a-zA-Z0-9_-]+)/,        // lh3.googleusercontent.com/d/ID
  ];

  for (const regex of patterns) {
    const match = urlOrId.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes("drive.google.com") ||
    url.includes("docs.google.com") ||
    url.includes("googleusercontent.com")
  );
}

export function getDriveThumbnailUrl(urlOrId?: string | null, size: number = 800): string | null {
  const fileId = extractGoogleDriveId(urlOrId);
  if (!fileId) {
    // Se for URL direta de imagem tradicional
    if (urlOrId && (urlOrId.startsWith("http://") || urlOrId.startsWith("https://"))) {
      return urlOrId;
    }
    return null;
  }
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

export function getDriveEmbedPlayerUrl(urlOrId?: string | null): string | null {
  const fileId = extractGoogleDriveId(urlOrId);
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function detectMediaType(filenameOrUrl?: string | null, format?: string | null): "video" | "image" | "document" {
  const str = (filenameOrUrl || "").toLowerCase();
  const fmt = (format || "").toUpperCase();

  if (fmt === "REELS" || fmt === "VIDEO") {
    return "video";
  }

  if (
    str.endsWith(".mp4") ||
    str.endsWith(".mov") ||
    str.endsWith(".mkv") ||
    str.endsWith(".webm") ||
    str.endsWith(".avi") ||
    str.includes("video") ||
    str.includes("reels")
  ) {
    return "video";
  }

  if (
    str.endsWith(".png") ||
    str.endsWith(".jpg") ||
    str.endsWith(".jpeg") ||
    str.endsWith(".webp") ||
    str.endsWith(".gif") ||
    str.endsWith(".svg") ||
    fmt === "POST" ||
    fmt === "CARROSSEL" ||
    fmt === "STORIES"
  ) {
    return "image";
  }

  return "document";
}
