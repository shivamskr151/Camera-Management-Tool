import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { PRESETS_CACHE_KEY } from './usePresetManagement';

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface CreatePresetParams {
  preset_name: string;
  sensor_id: string;
  pan: number;
  tilt: number;
  zoom: number;
}

interface CreatePresetResponse {
  success: boolean;
  message: string;
  data?: {
    command: string;
    preset_name: string;
    pan: number;
    tilt: number;
    zoom: number;
  };
}

export const useCreatePreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreatePresetParams): Promise<CreatePresetResponse> => {
      console.log('Creating preset with params:', params);
      const response = await fetch(`${API_BASE_URL}/api/ptz/create-preset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create preset');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Preset created successfully:', data);
      toast.success('Preset created successfully');
      queryClient.invalidateQueries({ queryKey: PRESETS_CACHE_KEY });
    },
    onError: (error: Error) => {
      console.error('Error creating preset:', error);
      toast.error(error.message || 'Failed to create preset');
    },
  });
}; 