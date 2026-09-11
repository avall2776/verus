import axios from 'axios';

const api = axios.create({
  baseURL: '/api-backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o Token JWT
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('versus_auth_token') || localStorage.getItem('token') : null;
  
  let tenantId = null;
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('versus_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        tenantId = user.tenantId;
      } catch (e) {}
    }
    if (!tenantId) {
      tenantId = localStorage.getItem('tenantId');
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }

  console.log('[API Request]', config.method?.toUpperCase(), config.url, {
    hasToken: !!token,
    tenantId: config.headers['x-tenant-id'] || 'not-sent'
  });

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
