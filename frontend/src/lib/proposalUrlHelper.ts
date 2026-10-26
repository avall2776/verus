/**
 * Helper utilitário para geração de URLs públicas de propostas e consulta de CEP
 */

export function getPublicProposalUrl(codeOrId?: string, storedPublicLink?: string): string {
  const cleanCode = (codeOrId || "").toLowerCase();

  // Se estiver no navegador do usuário
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // O Next.js está configurado com basePath: '/vallor'
    return `${origin}/vallor/p/${cleanCode}`;
  }

  // Fallback no SSR / Servidor
  const rawBase = process.env.NEXT_PUBLIC_APP_URL || "https://avalmarketing.com.br/vallor";
  const cleanBase = rawBase.replace(/\/+$/, "");
  return `${cleanBase}/p/${cleanCode}`;
}

export interface ViaCepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

export interface ParsedAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  fullAddress: string;
}

/**
 * Consulta CEP na API pública ViaCEP com timeout e tratamento de erros
 */
export async function fetchAddressByCep(rawCep: string): Promise<ParsedAddress | null> {
  const clean = (rawCep || "").replace(/\D/g, "");
  if (clean.length !== 8) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data: ViaCepResult = await res.json();

    if (data.erro) {
      return null;
    }

    const formattedCep = `${clean.slice(0, 5)}-${clean.slice(5)}`;
    const street = data.logradouro || "";
    const neighborhood = data.bairro || "";
    const city = data.localidade || "";
    const state = data.uf || "";

    const parts = [street, neighborhood, `${city} - ${state}`].filter(Boolean);
    const fullAddress = parts.join(", ");

    return {
      cep: formattedCep,
      street,
      neighborhood,
      city,
      state,
      fullAddress,
    };
  } catch (err) {
    console.warn("[ViaCEP] Falha ao consultar CEP:", err);
    return null;
  }
}
