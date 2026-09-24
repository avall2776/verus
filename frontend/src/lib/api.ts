import axios from 'axios';

const api = axios.create({
  baseURL: '/api-backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper para recuperar o token limpo
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  let token = 
    localStorage.getItem('versus_auth_token') ||
    localStorage.getItem('versus_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('versus_auth_token') ||
    sessionStorage.getItem('versus_token');

  if (token && typeof token === 'string') {
    token = token.trim();
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1).trim();
    }
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }
  }
  return token || null;
};

// Helper para recuperar o contexto de tenant atual (priorizando Modo Suporte)
export const getEffectiveTenantContext = (): { tenantId: string | null; targetTenantId: string | null } => {
  if (typeof window === 'undefined') return { tenantId: null, targetTenantId: null };

  const targetTenantId = localStorage.getItem('versus_target_tenant_id') || null;
  let userTenantId: string | null = null;

  const userStr = localStorage.getItem('versus_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userTenantId = user.tenantId || null;
    } catch (e) {}
  }
  if (!userTenantId) {
    userTenantId = localStorage.getItem('tenantId');
  }

  return {
    tenantId: targetTenantId || userTenantId,
    targetTenantId: targetTenantId || null,
  };
};

// Interceptor para injetar o Token JWT e Headers Corporativos em TODAS as requisições Axios
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  const { tenantId, targetTenantId } = getEffectiveTenantContext();

  config.headers = config.headers || {};

  if (token) {
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Injeta consistentemente x-tenant-id com o tenant efetivo (agência alvo ou agência própria)
  if (tenantId) {
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('x-tenant-id', tenantId);
    } else {
      config.headers['x-tenant-id'] = tenantId;
    }
  }

  // Injeta explicitamente x-target-tenant-id se o Modo Suporte estiver ativo
  if (targetTenantId) {
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('x-target-tenant-id', targetTenantId);
    } else {
      config.headers['x-target-tenant-id'] = targetTenantId;
    }
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Interceptor para tratamento de 401/403 com governança em tempo real
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        const isBlocked = 
          data?.code === 'TENANT_BLOCKED' ||
          data?.code === 'USER_INACTIVE' ||
          (typeof data?.message === 'string' && (
            data.message.toLowerCase().includes('bloqueada') ||
            data.message.toLowerCase().includes('bloqueado') ||
            data.message.toLowerCase().includes('suspenso') ||
            data.message.toLowerCase().includes('desativada')
          ));

        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const targetTenantId = localStorage.getItem('versus_target_tenant_id');

          // Se estiver navegando em Modo Suporte, um 401 numa agência JAMAIS deve deslogar o Super Admin
          if (targetTenantId) {
            console.warn('[VERSUS API] 401 recebido durante Modo Suporte. Sessão de Super Admin preservada.', data);
            return Promise.reject(error);
          }

          if (isBlocked) {
            // Invalidação imediata de tokens apenas para o tenant bloqueado
            localStorage.removeItem('versus_auth_token');
            localStorage.removeItem('versus_token');
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('versus_user');
            sessionStorage.setItem(
              'versus_blocked_reason',
              typeof data?.message === 'string' ? data.message : 'Acesso suspenso: sua empresa foi bloqueada pela administração.'
            );
            
            if (currentPath !== '/blocked') {
              window.location.href = '/blocked';
            }
          } else if (
            currentPath !== '/login' && 
            currentPath !== '/blocked' && 
            !currentPath.startsWith('/public') && 
            !currentPath.startsWith('/c/') && 
            !currentPath.startsWith('/p/')
          ) {
            // Sessão normal expirada
            localStorage.removeItem('versus_auth_token');
            localStorage.removeItem('versus_token');
            localStorage.removeItem('versus_user');
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// Wrapper global transparente para fetch nativo no browser (garante mesmos headers de autenticação e Modo Suporte)
if (typeof window !== 'undefined' && !(window as any).__versus_fetch_patched) {
  (window as any).__versus_fetch_patched = true;
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    const urlStr = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
    
    // Injeta headers corporativos em requisições locais ou para a API
    if (urlStr.startsWith('/') || urlStr.includes('/api') || urlStr.includes('/conversations') || urlStr.includes('/users') || urlStr.includes('/tenants')) {
      config = config || {};
      const headers = new Headers(config.headers || (resource instanceof Request ? resource.headers : {}));
      
      const token = getStoredToken();
      const { tenantId, targetTenantId } = getEffectiveTenantContext();

      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (tenantId && !headers.has('x-tenant-id')) {
        headers.set('x-tenant-id', tenantId);
      }
      if (targetTenantId && !headers.has('x-target-tenant-id')) {
        headers.set('x-target-tenant-id', targetTenantId);
      }
      config.headers = headers;
    }
    return originalFetch(resource, config);
  };
}

export default api;
