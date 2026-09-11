import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api-backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o Token JWT
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('versus_auth_token') || localStorage.getItem('token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
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
