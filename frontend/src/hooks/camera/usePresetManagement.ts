import { useCallback } from 'react';
import { Preset, CameraPosition } from '@/types/ptz-camera';
import { convertToSeconds, convertFromSeconds } from '@/utils/time';
import { useCreatePreset } from './useCreatePreset';

export const usePresetManagement = (
  setPresets: (presets: Preset[] | ((prev: Preset[]) => Preset[])) => void,
  setSelectedPreset: (id: number | null) => void,
  setEditingPreset: (preset: Preset | null) => void,
  setNewPresetName: (name: string) => void,
  setDuration: (duration: number) => void,
  setDurationUnit: (unit: 'seconds' | 'minutes' | 'hours') => void,
  panTilt: { pan: number; tilt: number },
  zoom: number,
  duration: number,
  durationUnit: 'seconds' | 'minutes' | 'hours',
  loadPreset: (position: CameraPosition) => Promise<{ success: boolean; message?: string }>,
  newPresetName: string,
  selectedPreset: number | null,
  selectedCameraId: string = 'default'
) => {
  const { mutate: createPreset, isPending: isCreatingPreset } = useCreatePreset();
  
  const savePreset = useCallback(() => {
    // Create a new preset with current position values
    const newPreset: Preset = {
      id: 0, // Temporary ID, will be set when actually saving
      name: '',
      panTilt: { ...panTilt }, // Create a new object to avoid reference issues
      zoom: zoom,
      duration: 5, // Default duration
      durationUnit: 'seconds', // Default unit
      isInPatrol: false,
      createdAt: Date.now()
    };
    
    // Open the preset dialog with the new preset
    setEditingPreset(newPreset);
    setNewPresetName('');
    setDuration(5);
    setDurationUnit('seconds');
  }, [panTilt, zoom, setEditingPreset, setNewPresetName, setDuration, setDurationUnit]);

  const editPreset = useCallback((preset: Preset) => {
    setEditingPreset(preset); // Keep the original preset values when editing
    setNewPresetName(preset.name);
    setDuration(convertFromSeconds(preset.duration, preset.durationUnit));
    setDurationUnit(preset.durationUnit);
  }, [setEditingPreset, setNewPresetName, setDuration, setDurationUnit]);

  const deletePreset = useCallback((presetId: number) => {
    setPresets((prev: Preset[]) => prev.filter(p => p.id !== presetId));
    if (selectedPreset === presetId) {
      setSelectedPreset(null);
    }
  }, [setPresets, setSelectedPreset, selectedPreset]);

  const togglePatrol = useCallback((presetId: number) => {
    setPresets((prev: Preset[]) => prev.map(p => 
      p.id === presetId ? { ...p, isInPatrol: !p.isInPatrol, selectedForPatrol: !p.selectedForPatrol } : p
    ));
  }, [setPresets]);
  
  const savePresetToAPI = useCallback((preset: Preset) => {
    // Call the create preset API
    createPreset({
      preset_name: preset.name,
      sensor_id: selectedCameraId,
      pan: preset.panTilt.pan,
      tilt: preset.panTilt.tilt,
      zoom: preset.zoom
    });
  }, [createPreset, selectedCameraId]);

  return {
    savePreset,
    editPreset,
    deletePreset,
    togglePatrol,
    savePresetToAPI,
    isCreatingPreset
  };
};

// Cache key for presets
export const PRESETS_CACHE_KEY = ['presets'] as const; 