import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o Token JWT
api.interceptors.request.use((config) => {
  // Mock JWT Token para desenvolvimento
  const mockToken = 'mock-jwt-token-tenant-1';
  
  if (mockToken) {
    config.headers.Authorization = `Bearer ${mockToken}`;
  }
  
  return config;
});

export default api;
