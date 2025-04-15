import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/lib/types';

interface CameraMovementParams {
  pan: number;
  tilt: number;
  zoom: number;
  sensor_id: string;
}

interface CameraMovementResponse {
  success: boolean;
  message: string;
}

// Cache key for camera positions
const CAMERA_POSITION_CACHE_KEY = ['camera-position'] as const;

// Create a dedicated axios instance for camera movements
const cameraApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function useCameraMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CameraMovementParams) => {
      // Round values to reduce unnecessary API calls for tiny changes
      const roundedParams = {
        ...params,
        pan: Math.round(params.pan * 100) / 100,
        tilt: Math.round(params.tilt * 100) / 100,
        zoom: Math.round(params.zoom * 100) / 100
      };
      
      console.log('Preparing camera movement request:', {
        url: '/api/ptz/move',
        data: roundedParams,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      try {
        const response = await cameraApi.post<ApiResponse<CameraMovementResponse>>(
          '/api/ptz/move',
          roundedParams
        );
        
        console.log('Camera movement response:', response.data);
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to move camera');
        }
        
        // Cache the successful position
        queryClient.setQueryData(CAMERA_POSITION_CACHE_KEY, roundedParams);
        
        return response.data;
      } catch (error) {
        console.error('Camera movement error:', {
          error,
          params: roundedParams,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Camera moved successfully');
      // Invalidate the camera position cache to trigger a refresh
      queryClient.invalidateQueries({ queryKey: CAMERA_POSITION_CACHE_KEY });
      // Force a refetch of the camera position
      queryClient.refetchQueries({ queryKey: CAMERA_POSITION_CACHE_KEY });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move camera';
      toast.error(errorMessage);
    }
  });
} 