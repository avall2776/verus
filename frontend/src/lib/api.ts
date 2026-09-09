import axios from 'axios';

const api = axios.create({
  baseURL: '/api-backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o Token JWT
api.interceptors.request.use((config) => {
  // Pega o token real gerado pelo login
  const token = typeof window !== 'undefined' ? localStorage.getItem('versus_auth_token') : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
