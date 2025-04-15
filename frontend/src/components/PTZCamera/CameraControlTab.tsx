import React, { useCallback, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CameraPreview from './CameraPreview';
import JoystickControl from './JoystickControl';
import ZoomControl from './ZoomControl';
import PositionDisplay from './PositionDisplay';
import { useCameraMovement } from '@/hooks/camera/useCameraMovement';
import { useQueryClient } from '@tanstack/react-query';

interface CameraControlTabProps {
  showGridlines: boolean;
  setShowGridlines: (show: boolean) => void;
  panTilt: { pan: number; tilt: number };
  zoom: number;
  joystickPosition: { x: number; y: number };
  joystickContainerRef: React.RefObject<HTMLDivElement>;
  joystickHandleRef: React.RefObject<HTMLDivElement>;
  handleZoomChange: (value: number) => void;
  resetCamera: () => void;
  savePreset: () => void;
  startDrag: (event: React.MouseEvent | React.TouchEvent) => void;
  selectedCameraId?: string;
  isSavingPreset?: boolean;
  onRefresh?: () => void;
}

const CameraControlTab: React.FC<CameraControlTabProps> = ({
  showGridlines,
  setShowGridlines,
  panTilt,
  zoom,
  joystickPosition,
  joystickContainerRef,
  joystickHandleRef,
  handleZoomChange,
  resetCamera,
  savePreset,
  startDrag,
  selectedCameraId = 'default',
  isSavingPreset = false,
  onRefresh
}) => {
  const queryClient = useQueryClient();
  const { mutate: moveCamera, isPending } = useCameraMovement();
  
  // Memoize the move handler to prevent unnecessary re-renders
  const handleMoveCamera = useCallback(() => {
    console.log('Move button clicked');
    console.log('Current camera position:', { pan: panTilt.pan, tilt: panTilt.tilt, zoom, sensor_id: selectedCameraId });
    
    // Only call the API if we have valid values
    if (typeof panTilt.pan === 'number' && typeof panTilt.tilt === 'number' && typeof zoom === 'number') {
      moveCamera({
        pan: panTilt.pan,
        tilt: panTilt.tilt,
        zoom,
        sensor_id: selectedCameraId
      }, {
        onSuccess: () => {
          // Force a refresh of the camera control page
          queryClient.invalidateQueries();
          queryClient.refetchQueries();
          
          // Reset the camera position display
          resetCamera();
          
          // Call the parent's refresh handler if provided
          if (onRefresh) {
            onRefresh();
          }
        }
      });
    } else {
      console.error('Invalid camera position values:', { pan: panTilt.pan, tilt: panTilt.tilt, zoom });
    }
  }, [moveCamera, panTilt, zoom, selectedCameraId, queryClient, resetCamera, onRefresh]);
  
  // Memoize the grid toggle handler
  const handleGridToggle = useCallback(() => {
    setShowGridlines(!showGridlines);
  }, [showGridlines, setShowGridlines]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Camera Preview</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGridToggle}
            className="text-xs"
          >
            {showGridlines ? 'Hide Grid' : 'Show Grid'}
          </Button>
        </div>
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-inner">
          <CameraPreview
            showGridlines={showGridlines}
            panTilt={panTilt}
            zoom={zoom}
          />
        </div>
        
        <PositionDisplay
          panTilt={panTilt}
          zoom={zoom}
          onReset={resetCamera}
        />
      </Card>

      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Camera Control</h3>
        
        <div className="flex flex-col items-center space-y-6">
          <JoystickControl
            joystickPosition={joystickPosition}
            joystickContainerRef={joystickContainerRef}
            joystickHandleRef={joystickHandleRef}
            onStartDrag={startDrag}
          />

          <div className="w-full space-y-4">
            <ZoomControl
              zoom={zoom}
              onZoomChange={handleZoomChange}
            />

            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={savePreset}
              disabled={isSavingPreset}
            >
              {isSavingPreset ? 'Saving...' : 'Add To Preset'}
            </Button>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleMoveCamera}
              disabled={isPending}
            >
              {isPending ? 'Moving...' : 'Move'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CameraControlTab; 