import axios from 'axios';
import { toast } from 'sonner';
import store from '@/store';

// Get API base URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

let isRefreshing = false;
interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If token refresh is in progress, queue the request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Attempt to refresh the token
      const response = await api.post('/auth/refresh-token', { refreshToken });
      const { token } = response.data;

      // Update token in localStorage
      localStorage.setItem('token', token);

      // Update auth state in store
      store.getActions().auth.setToken(token);

      // Process any queued requests
      processQueue();

      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      // If refresh fails, clear auth state and redirect to login
      processQueue(refreshError);
      store.getActions().auth.logout();
      
      if (window.location.pathname !== '/login') {
        toast.error('Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api; 