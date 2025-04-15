import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
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

// Generic GET request hook
export function useGet<T>(
  key: string[],
  url: string,
  options?: UseQueryOptions<T>
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data } = await api.get<T>(url);
      return data;
    },
    ...options,
  });
}

// Generic POST request hook
export function usePost<T, V>(
  url: string,
  options?: UseMutationOptions<T, Error, V>
) {
  return useMutation({
    mutationFn: async (variables: V) => {
      const { data } = await api.post<T>(url, variables);
      return data;
    },
    ...options,
  });
}

// Generic PUT request hook
export function usePut<T, V>(
  url: string,
  options?: UseMutationOptions<T, Error, V>
) {
  return useMutation({
    mutationFn: async (variables: V) => {
      const { data } = await api.put<T>(url, variables);
      return data;
    },
    ...options,
  });
}

// Generic DELETE request hook
export function useDelete<T>(
  url: string,
  options?: UseMutationOptions<T, Error, void>
) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<T>(url);
      return data;
    },
    ...options,
  });
} 