import { useCallback } from 'react';
import { CameraPosition } from '@/types/ptz-camera';

export const useCameraControls = (
  setZoom: (zoom: number) => void,
  setPanTilt: (panTilt: { pan: number; tilt: number }) => void,
  setJoystickPosition: (position: { x: number; y: number }) => void,
  joystickContainerRef: React.RefObject<HTMLDivElement>
) => {
  const handleZoomChange = useCallback((value: number) => {
    setZoom(value);
  }, [setZoom]);

  const resetCamera = useCallback(() => {
    // Reset all camera values to initial state
    setZoom(1);
    setPanTilt({ pan: 0, tilt: 0 });
    setJoystickPosition({ x: 0, y: 0 });
  }, [setZoom, setPanTilt, setJoystickPosition]);

  const loadPreset = useCallback(async (position: CameraPosition) => {
    try {
      // Update camera position
      setZoom(position.zoom);
      setPanTilt(position.panTilt);
      
      // Calculate joystick position based on panTilt
      if (joystickContainerRef.current) {
        const maxRadius = joystickContainerRef.current.clientWidth / 2;
        setJoystickPosition({
          x: position.panTilt.pan * maxRadius,
          y: position.panTilt.tilt * maxRadius
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move camera';
      return { success: false, message: errorMessage };
    }
  }, [setZoom, setPanTilt, setJoystickPosition, joystickContainerRef]);

  return {
    handleZoomChange,
    resetCamera,
    loadPreset
  };
}; 