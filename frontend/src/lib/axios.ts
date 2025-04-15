import axios, { AxiosRequestConfig, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import store from '@/store';

// Get the base URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

console.log('Axios API URL:', API_URL);

// Create axios instance
const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
axiosClient.interceptors.request.use(
  (config) => {
    console.log(`[Axios Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosClient.interceptors.response.use(
  (response) => {
    console.log(`[Axios Response] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('[Axios Response Error]', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Track if we're currently refreshing the token
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

// Track token initialization state
let isTokenInitialized = false;
// Queue for requests made before token is initialized
let tokenInitQueue: { config: InternalAxiosRequestConfig; resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

// Function to process queued requests
const processQueue = (error: unknown = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  
  failedQueue = [];
};

// Function to process token initialization queue
const processTokenInitQueue = () => {
  tokenInitQueue.forEach(request => {
    axiosClient(request.config)
      .then(response => request.resolve(response as unknown))
      .catch(error => request.reject(error));
  });
  
  tokenInitQueue = [];
};

// Function to set token initialization status
export const setTokenInitialized = (status: boolean) => {
  isTokenInitialized = status;
  if (status) {
    processTokenInitQueue();
  }
};

// Add a request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    // Log the request details
    console.log('🚀 Making API request:', {
      url: `${API_URL}${config.url}`,
      method: config.method,
      headers: config.headers,
      data: config.data,
      baseURL: API_URL,
      fullUrl: `${API_URL}${config.url}`
    });

    // Check if the server is reachable
    try {
      const response = await fetch(API_URL, { method: 'HEAD' });
      console.log('🌐 Server status check:', {
        status: response.status,
        ok: response.ok,
        url: API_URL
      });
      
      // Consider 404 as server reachable (it's just that the root path doesn't exist)
      if (response.status === 404) {
        console.log('✅ Server is reachable (404 on root path is expected)');
      }
    } catch (error) {
      console.error('❌ Server not reachable:', {
        error,
        url: API_URL,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // If token is not initialized and this is a secured endpoint (not login/register)
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                           config.url?.includes('/auth/register') ||
                           config.url?.includes('/auth/refresh-token');
    
    if (!isTokenInitialized && !isAuthEndpoint) {
      console.log('⏳ Request queued - token not initialized');
      // Return a promise that will be resolved when token is initialized
      return new Promise<InternalAxiosRequestConfig>((resolve, reject) => {
        tokenInitQueue.push({ 
          config: config as InternalAxiosRequestConfig, 
          resolve: (response: unknown) => resolve(response as InternalAxiosRequestConfig),
          reject: (error: unknown) => reject(error)
        });
      });
    }
    
    // Get token from local storage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const { response } = error;
    
    // Log detailed error information
    console.error('❌ API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: response?.status,
      statusText: response?.statusText,
      data: response?.data,
      message: error.message,
      isNetworkError: !response,
      isCorsError: error.message.includes('CORS') || error.message.includes('cross-origin'),
      error: error,
      stack: error.stack
    });
    
    // Handle token refresh for 401 errors (but not for the refresh token endpoint itself)
    if (response?.status === 401 && !originalRequest._retry && 
        originalRequest.url !== '/auth/refresh-token') {
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosClient(originalRequest))
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh token API
        const response = await axiosClient.post('/auth/refresh-token', {
          refreshToken
        });
        
        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        // Update tokens in store
        store.getActions().auth.setToken(token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update authorization header for original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Process queued requests
        processQueue();
        
        // Retry the original request
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, process queue with error
        processQueue(refreshError);
        
        // Force logout
        store.getActions().auth.logout();
        
        // Redirect to login
        if (window.location.pathname !== '/login') {
          toast.error('Your session has expired. Please log in again.');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    if (response) {
      const status = response.status;
      
      // Handle 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        localStorage.removeItem('token');
        // Dispatch logout action if using Redux/Context
        
        // Redirect to login
        if (window.location.pathname !== '/login') {
          toast.error('Your session has expired. Please log in again.');
          window.location.href = '/login';
        }
      }
      
      // Handle 403 Forbidden - Not enough permissions
      if (status === 403) {
        toast.error('You do not have permission to perform this action');
        
        // Optionally redirect to a "not authorized" page
        if (window.location.pathname !== '/not-authorized') {
          window.location.href = '/not-authorized';
        }
      }
      
      // Handle 404 Not Found
      if (status === 404) {
        toast.error('The requested resource was not found');
      }
      
      // Handle 500 Internal Server Error
      if (status >= 500) {
        toast.error('An unexpected error occurred. Please try again later');
      }
    } else {
      // Network error
      toast.error('Unable to connect to the server. Please check your internet connection');
    }
    
    return Promise.reject(error);
  }
);

// Generic get function with typing
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosClient.get<T>(url, config);
  return response.data;
};

// Generic post function with typing
export const post = async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
  console.log(`Making POST request to: ${API_URL}${url}`, data);
  
  // Ensure data is properly serialized
  const serializedData = data ? JSON.parse(JSON.stringify(data)) : undefined;
  
  const response = await axiosClient.post<T>(url, serializedData, {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers
    }
  });
  
  console.log(`POST response from ${url}:`, response.data);
  return response.data;
};

// Generic put function with typing
export const put = async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosClient.put<T>(url, data, config);
  return response.data;
};

// Generic patch function with typing
export const patch = async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosClient.patch<T>(url, data, config);
  return response.data;
};

// Generic delete function with typing
export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosClient.delete<T>(url, config);
  return response.data;
};

export default axiosClient;
