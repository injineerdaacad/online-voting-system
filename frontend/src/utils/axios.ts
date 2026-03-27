import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.warn('⚠️ VITE_API_URL is not set in environment variables');
}

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config && error.config.url && error.config.url.includes('/api/auth/admin/login');
    const isOnSignInPage = window.location.pathname === '/signin';
    
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.error || error.response.data?.message || '';
      const isInvalidToken = errorMessage.includes('Invalid token') || errorMessage.includes('Invalid token');
      
      if ((status === 401 || (status === 403 && isInvalidToken)) && !isLoginRequest && !isOnSignInPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/signin';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;