/**
 * Helper utilitário para geração de URLs públicas de contratos
 */

export function getPublicContractUrl(codeOrId?: string): string {
  const cleanCode = (codeOrId || "").toLowerCase();

  // Se estiver no navegador do usuário
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // O Next.js está configurado com basePath: '/vallor'
    return `${origin}/vallor/c/${cleanCode}`;
  }

  // Fallback no SSR / Servidor
  const rawBase = process.env.NEXT_PUBLIC_APP_URL || "https://avallmarketing.com.br/vallor";
  const cleanBase = rawBase.replace(/\/+$/, "");
  if (cleanBase.endsWith("/vallor")) {
    return `${cleanBase}/c/${cleanCode}`;
  }
  return `${cleanBase}/vallor/c/${cleanCode}`;
}

