import axios from 'axios';

const api = axios.create({
  baseURL: '/api-backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o Token JWT e Headers Corporativos
api.interceptors.request.use((config) => {
  let token: string | null = null;
  let tenantId: string | null = null;

  if (typeof window !== 'undefined') {
    // Busca abrangente de token para evitar 401 Unauthorized
    token = 
      localStorage.getItem('versus_auth_token') ||
      localStorage.getItem('versus_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('versus_auth_token') ||
      sessionStorage.getItem('versus_token');

    // Limpeza de aspas ou formatações espúrias
    if (token && typeof token === 'string') {
      token = token.trim();
      if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1).trim();
      }
      if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
      }
    }

    // Contexto de tenant
    const userStr = localStorage.getItem('versus_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        tenantId = user.tenantId || null;
      } catch (e) {}
    }
    if (!tenantId) {
      tenantId = localStorage.getItem('tenantId');
    }
  }

  // Garante que config.headers exista
  config.headers = config.headers || {};

  if (token) {
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (tenantId && !config.headers['x-tenant-id']) {
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('x-tenant-id', tenantId);
    } else {
      config.headers['x-tenant-id'] = tenantId;
    }
  }

  // Se houver um tenant alvo definido (Super Admin acessando agência cliente para suporte)
  const targetTenantId = typeof window !== 'undefined' ? localStorage.getItem('versus_target_tenant_id') : null;
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

          if (isBlocked) {
            // Invalidação imediata de tokens
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

export default api;
