import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

let tokenMemory = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.setTokenMemory = (token) => {
  tokenMemory = token;
};

api.getTokenMemory = () => {
  return tokenMemory;
};

// Request interceptor to append JWT Access Token
api.interceptors.request.use(
  (config) => {
    if (tokenMemory) {
      config.headers.Authorization = `Bearer ${tokenMemory}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to intercept 401s and attempt Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh token request fails itself
    if (error.response?.status === 401 && originalRequest.url === '/auth/refresh') {
      tokenMemory = null;
      localStorage.removeItem('user');
      window.location.href = '/#/login';
      return Promise.reject(error);
    }

    const isAuthRoute = originalRequest.url.includes('/login') || 
                        originalRequest.url.includes('/register') || 
                        originalRequest.url.includes('/request-') || 
                        originalRequest.url.includes('/forgot-') ||
                        originalRequest.url.includes('/auth/google');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.data?.success) {
          return api(originalRequest);
        }
      } catch (refreshError) {
        tokenMemory = null;
        localStorage.removeItem('user');
        window.location.href = '/#/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
