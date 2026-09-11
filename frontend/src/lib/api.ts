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
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }
  return config;
});

export default api;
