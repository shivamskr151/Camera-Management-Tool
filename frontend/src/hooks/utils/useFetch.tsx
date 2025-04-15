import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/axios';
import { toast } from 'sonner';
import { ApiResponse, PaginatedResponse } from '@/lib/types';

// Hook for fetching data
export function useFetch<T>(
  queryKey: string | string[],
  url: string, 
  options = {}
) {
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  console.log(`[useFetch] Fetching data from ${url} with key ${queryKeyArray.join(', ')}`);
  
  return useQuery({
    queryKey: queryKeyArray,
    queryFn: async () => {
      try {
        console.log(`[useFetch] Executing GET request to ${url}`);
        const response = await get<ApiResponse<T>>(url);
        console.log(`[useFetch] Response from ${url}:`, response);
        return response;
      } catch (error: unknown) {
        console.error(`[useFetch] Error fetching from ${url}:`, error);
        throw error;
      }
    },
    ...options
  });
}

// Hook for fetching paginated data
export function usePaginatedFetch<T>(
  queryKey: string | string[],
  url: string,
  page = 1,
  limit = 10,
  options = {}
) {
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];
  const paginatedQueryKey = [...queryKeyArray, page, limit];
  
  console.log(`[usePaginatedFetch] Fetching paginated data from ${url} with key ${paginatedQueryKey.join(', ')}`);
  
  return useQuery({
    queryKey: paginatedQueryKey,
    queryFn: async () => {
      try {
        console.log(`[usePaginatedFetch] Executing GET request to ${url}?page=${page}&limit=${limit}`);
        const response = await get<PaginatedResponse<T>>(`${url}?page=${page}&limit=${limit}`);
        console.log(`[usePaginatedFetch] Response from ${url}:`, response);
        return response;
      } catch (error: unknown) {
        console.error(`[usePaginatedFetch] Error fetching from ${url}:`, error);
        throw error;
      }
    },
    ...options
  });
}

// Hook for creating data
export function useCreate<T, D>(url: string, options = {}) {
  const queryClient = useQueryClient();
  
  console.log(`[useCreate] Setting up create mutation for ${url}`);
  
  return useMutation({
    mutationFn: async (data: D) => {
      try {
        console.log(`[useCreate] Executing POST request to ${url} with data:`, data);
        const response = await post<T>(url, data);
        console.log(`[useCreate] Response from ${url}:`, response);
        return response;
      } catch (error: unknown) {
        console.error(`[useCreate] Error creating at ${url}:`, error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log(`[useCreate] Successfully created at ${url}:`, data);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [url.split('/')[1]] });
      toast.success('Created successfully');
    },
    onError: (error: unknown) => {
      console.error(`[useCreate] Error creating at ${url}:`, error);
      toast.error('Failed to create');
    },
    ...options
  });
}

// Hook for updating data
export function useUpdate<T, D>(url: string, queryKey: string | string[], options = {}) {
  const queryClient = useQueryClient();
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  console.log(`[useUpdate] Setting up update mutation for ${url}`);
  
  return useMutation({
    mutationFn: async (data: D) => {
      try {
        console.log(`[useUpdate] Executing PUT request to ${url} with data:`, data);
        const response = await put<T>(url, data);
        console.log(`[useUpdate] Response from ${url}:`, response);
        return response;
      } catch (error: unknown) {
        console.error(`[useUpdate] Error updating at ${url}:`, error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log(`[useUpdate] Successfully updated at ${url}:`, data);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeyArray });
      toast.success('Updated successfully');
    },
    onError: (error: unknown) => {
      console.error(`[useUpdate] Error updating at ${url}:`, error);
      toast.error('Failed to update');
    },
    ...options
  });
}

// Hook for deleting data
export function useDelete<T>(url: string, queryKey: string | string[], options = {}) {
  const queryClient = useQueryClient();
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  console.log(`[useDelete] Setting up delete mutation for ${url}`);
  
  return useMutation({
    mutationFn: async () => {
      try {
        console.log(`[useDelete] Executing DELETE request to ${url}`);
        const response = await del<T>(url);
        console.log(`[useDelete] Response from ${url}:`, response);
        return response;
      } catch (error: unknown) {
        console.error(`[useDelete] Error deleting at ${url}:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log(`[useDelete] Successfully deleted at ${url}:`, data);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeyArray });
      toast.success('Deleted successfully');
    },
    onError: (error: unknown) => {
      console.error(`[useDelete] Error deleting at ${url}:`, error);
      toast.error('Failed to delete');
    },
    ...options
  });
}
