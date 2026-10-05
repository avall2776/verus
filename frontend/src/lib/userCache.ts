import api from "./api";

let cachedUser: any = null;
let lastFetchTime = 0;
let inFlightPromise: Promise<any> | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache em memória

/**
 * Recuperação síncrona instantânea (0ms) do usuário logado na memória ou localStorage.
 */
export function getStoredUserSync(): any {
  if (cachedUser) return cachedUser;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("versus_user");
      if (stored) {
        cachedUser = JSON.parse(stored);
        return cachedUser;
      }
    } catch {}
  }
  return null;
}

/**
 * Recupera o usuário atual com suporte a Stale-While-Revalidate:
 * - Se já possui dados em memória ou localStorage, devolve instantaneamente (0ms).
 * - Revalida silenciosamente em background se o TTL expirou.
 */
export async function getCachedUser(forceRefresh = false): Promise<any> {
  const now = Date.now();

  // 1. Se temos cache em memória válido e recente (dentro do TTL) e não é forçado, retorna instantaneamente (0ms)
  if (!forceRefresh && cachedUser && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedUser;
  }

  // 2. Se já há uma requisição em voo, reaproveita
  if (inFlightPromise) {
    const immediate = getStoredUserSync();
    return immediate || inFlightPromise;
  }

  // 3. Obtém dados locais imediatos para não travar a UI
  const immediateUser = getStoredUserSync();

  // 4. Se não há dados locais ou forçou refresh, espera a rede
  if (!immediateUser || forceRefresh) {
    inFlightPromise = api.get("/users/me")
      .then((res) => {
        if (res.data) {
          cachedUser = res.data;
          lastFetchTime = Date.now();
          if (typeof window !== "undefined") {
            localStorage.setItem("versus_user", JSON.stringify(res.data));
          }
        }
        return cachedUser;
      })
      .catch((err) => {
        if (cachedUser) return cachedUser;
        throw err;
      })
      .finally(() => {
        inFlightPromise = null;
      });

    return inFlightPromise;
  }

  // 5. STALE-WHILE-REVALIDATE: Temos dados imediatos! Dispara revalidação silenciosa em background
  inFlightPromise = api.get("/users/me")
    .then((res) => {
      if (res.data) {
        cachedUser = res.data;
        lastFetchTime = Date.now();
        if (typeof window !== "undefined") {
          localStorage.setItem("versus_user", JSON.stringify(res.data));
          window.dispatchEvent(new CustomEvent("user_updated", { detail: res.data }));
        }
      }
      return cachedUser;
    })
    .catch((err) => {
      // Se a conta for bloqueada, propaga evento para tratamento de bloqueio
      if (err.response?.status === 401 || err.response?.status === 403) {
        window.dispatchEvent(new CustomEvent("tenant_blocked_event", { detail: err.response?.data }));
      }
      return cachedUser;
    })
    .finally(() => {
      inFlightPromise = null;
    });

  // Retorna imediatamente os dados sem travar a navegação
  return immediateUser;
}

export function clearUserCache() {
  cachedUser = null;
  lastFetchTime = 0;
  inFlightPromise = null;
}
