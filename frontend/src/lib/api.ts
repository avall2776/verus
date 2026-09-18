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

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Interceptor para tratamento de 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('Sessão expirada ou acesso negado. (401/403)', error.response.data);
      // Aqui podemos redirecionar para /login no futuro: 
      // if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
