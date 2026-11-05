import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'versus_auth_token';

// Rotas públicas que NUNCA exigem login
const PUBLIC_PREFIXES = [
  '/login',
  '/blocked',
  '/c/',
  '/p/',
  '/relatorio',
  '/checklist',
  '/api-backend',
  '/api/',
  '/socket.io',
  '/vendor',
  '/images',
  '/sounds',
  '/audio',
  '/manifest.json',
  '/favicon.ico',
];

/**
 * Decodifica e valida com alta performance o JWT no Edge Runtime
 * Retorna o payload decodificado se válido e dentro do prazo de validade (exp)
 */
function parseValidJwt(token: string | undefined): { sub?: string; role?: string; isSuperAdmin?: boolean } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const binaryStr = atob(padded);
    const payload = JSON.parse(binaryStr);

    // Valida expiração (exp em segundos)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    if (!payload.sub && !payload.id && !payload.userId) {
      return null;
    }

    return {
      sub: payload.sub || payload.id || payload.userId,
      role: payload.role,
      isSuperAdmin: Boolean(payload.isSuperAdmin || payload.role === 'SUPER_ADMIN'),
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Libera estáticos internos do Next.js e arquivos com extensão (.png, .js, etc.)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Extrai e valida o token do cookie corporativo
  const tokenCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const jwtPayload = parseValidJwt(tokenCookie);
  const isAuthenticated = Boolean(jwtPayload);

  // 3. Rota de Login ou Raiz (/)
  if (pathname === '/login' || pathname === '/') {
    if (isAuthenticated) {
      const destination = jwtPayload?.isSuperAdmin ? '/super-admin/companies' : '/dashboard';
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = destination;
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 4. Se a rota for pública, permite navegação direta
  const isPublicRoute = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix) || pathname === prefix);
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 5. ROTA PROTEGIDA SEM AUTENTICAÇÃO:
  // Bloqueio imediato no servidor (0ms de renderização de qualquer componente ou dado)
  if (!isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Adiciona o callbackUrl para redirecionar de volta após autenticar
    loginUrl.searchParams.set('callbackUrl', pathname);

    const response = NextResponse.redirect(loginUrl);
    // Remove o cookie inválido/expirado para manter o estado limpo
    if (tokenCookie) {
      response.cookies.delete(AUTH_COOKIE);
      response.cookies.delete('versus_user_role');
    }
    return response;
  }

  // 6. Rota Super Admin: protege contra acesso de usuários normais
  if (pathname.startsWith('/super-admin')) {
    if (!jwtPayload?.isSuperAdmin) {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = '/dashboard';
      return NextResponse.redirect(dashUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas da aplicação, exceto assets estáticos do build
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

