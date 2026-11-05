/**
 * Utilitário centralizado de Cookies de Autenticação para o Vallor
 * Garante sincronização bidirecional entre Cookies (Next.js SSR / Middleware) e localStorage (Client)
 */

export const AUTH_COOKIE_NAME = "versus_auth_token";
export const USER_ROLE_COOKIE_NAME = "versus_user_role";

export function setAuthCookie(token: string, role?: string) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const maxAge = 7 * 24 * 60 * 60; // 7 dias
  const secureFlag = isSecure ? "; Secure" : "";

  // Seta na raiz "/" para atender todas as rotas (com ou sem basePath /vallor)
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
  
  if (role) {
    document.cookie = `${USER_ROLE_COOKIE_NAME}=${encodeURIComponent(role)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
  }
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  const pastDate = "Thu, 01 Jan 1970 00:00:00 GMT";
  
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; expires=${pastDate}; SameSite=Lax`;
  document.cookie = `${USER_ROLE_COOKIE_NAME}=; Path=/; Max-Age=0; expires=${pastDate}; SameSite=Lax`;
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/vallor; Max-Age=0; expires=${pastDate}; SameSite=Lax`;
  document.cookie = `${USER_ROLE_COOKIE_NAME}=; Path=/vallor; Max-Age=0; expires=${pastDate}; SameSite=Lax`;
}

export function getAuthCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${AUTH_COOKIE_NAME})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
}

