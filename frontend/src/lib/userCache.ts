import api from "./api";

let cachedUser: any = null;
let lastFetchTime = 0;
let inFlightPromise: Promise<any> | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos de cache em memória

export async function getCachedUser(forceRefresh = false): Promise<any> {
  const now = Date.now();

  // 1. Se temos cache em memória válido e não forçado, retorna instantaneamente (0ms)
  if (!forceRefresh && cachedUser && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedUser;
  }

  // 2. Se já há uma requisição em voo, reaproveita a mesma promessa (deduplicação)
  if (inFlightPromise) {
    return inFlightPromise;
  }

  // 3. Busca do localStorage primeiro para ter dados imediatos
  if (!cachedUser && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("versus_user");
      if (stored) {
        cachedUser = JSON.parse(stored);
      }
    } catch {}
  }

  // 4. Dispara a chamada de rede uma única vez
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
      // Se falhou na rede mas temos dados locais, continua usando os locais
      if (cachedUser) return cachedUser;
      throw err;
    })
    .finally(() => {
      inFlightPromise = null;
    });

  return inFlightPromise;
}

export function clearUserCache() {
  cachedUser = null;
  lastFetchTime = 0;
  inFlightPromise = null;
}
