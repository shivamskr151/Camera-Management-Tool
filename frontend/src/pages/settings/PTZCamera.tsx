import React, { useCallback } from 'react';
import { Camera as CameraIcon } from 'lucide-react';
import CameraSearch, { Camera } from '@/components/CameraSearch';
import { usePTZCamera } from '@/hooks/camera/usePTZCamera';
import { useCameraControls } from '@/hooks/camera/useCameraControls';
import { usePresetManagement } from '@/hooks/camera/usePresetManagement';
import { usePatrolManagement } from '@/hooks/camera/usePatrolManagement';
import CameraControlTab from '@/components/PTZCamera/CameraControlTab';
import PresetsTab from '@/components/PTZCamera/PresetsTab';
import PatrolTab from '@/components/PTZCamera/PatrolTab';
import TabsNavigation from '@/components/PTZCamera/TabsNavigation';
import PresetDialog from '@/components/PTZCamera/PresetDialog';
import { convertToSeconds } from '@/utils/time';

const PTZCamera: React.FC<{ className?: string }> = ({ className }) => {
  const {
    activeTab,
    showGridlines,
    panTilt,
    zoom,
    joystickPosition,
    selectedCamera,
    presets,
    selectedPreset,
    isMoving,
    moveError,
    editingPreset,
    newPresetName,
    duration,
    durationUnit,
    isPatrolling,
    patrolState,
    patrolStartTime,
    patrolEndTime,
    joystickContainerRef,
    joystickHandleRef,
    setActiveTab,
    setShowGridlines,
    setPanTilt,
    setZoom,
    setJoystickPosition,
    setSelectedCamera,
    setPresets,
    setSelectedPreset,
    setIsMoving,
    setMoveError,
    setEditingPreset,
    setNewPresetName,
    setDuration,
    setDurationUnit,
    setIsPatrolling,
    setPatrolState,
    setPatrolStartTime,
    setPatrolEndTime,
    handleStartDrag
  } = usePTZCamera();

  const {
    handleZoomChange,
    resetCamera,
    loadPreset
  } = useCameraControls(
    setZoom,
    setPanTilt,
    setJoystickPosition,
    joystickContainerRef
  );

  const {
    savePreset,
    editPreset,
    deletePreset,
    togglePatrol,
    savePresetToAPI,
    isCreatingPreset
  } = usePresetManagement(
    setPresets,
    setSelectedPreset,
    setEditingPreset,
    setNewPresetName,
    setDuration,
    setDurationUnit,
    panTilt,
    zoom,
    duration,
    durationUnit,
    loadPreset,
    newPresetName,
    selectedPreset,
    selectedCamera?.id || 'default'
  );

  const {
    startSinglePresetPatrol,
    startMultiplePresetPatrol,
    startPatrol,
    stopPatrol,
    handlePatrolStartTimeChange,
    handlePatrolEndTimeChange
  } = usePatrolManagement(
    setIsPatrolling,
    setPatrolState,
    setPatrolStartTime,
    setPatrolEndTime,
    presets,
    patrolStartTime,
    patrolEndTime,
    loadPreset
  );

  // Add refresh handler
  const handleRefresh = useCallback(() => {
    // Reset all camera control states
    setPanTilt({ pan: 0, tilt: 0 });
    setZoom(1);
    setJoystickPosition({ x: 0, y: 0 });
    setShowGridlines(true);
  }, [setPanTilt, setZoom, setJoystickPosition, setShowGridlines]);

  const handleCameraSelect = (camera: Camera) => {
    setSelectedCamera(camera);
    resetCamera();
    console.log(`Initializing PTZ control for camera: ${camera.name}`);
  };

  return (
    <div className={className}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <TabsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <CameraSearch 
            mode="ptz" 
            onCameraSelect={handleCameraSelect} 
            className="w-[300px]"
          />
        </div>

        {!selectedCamera ? (
          <div className="flex flex-col items-center justify-center p-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border rounded-xl shadow-sm">
            <div className="rounded-full p-6 bg-white dark:bg-gray-800 shadow-md mb-6">
              <CameraIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xl text-muted-foreground font-medium">Select a Camera</p>
            <p className="text-sm text-muted-foreground mt-2">Choose a camera to configure PTZ controls</p>
          </div>
        ) : (
          <>
            {activeTab === 'control' && (
              <CameraControlTab
                showGridlines={showGridlines}
                setShowGridlines={setShowGridlines}
                panTilt={panTilt}
                zoom={zoom}
                joystickPosition={joystickPosition}
                joystickContainerRef={joystickContainerRef}
                joystickHandleRef={joystickHandleRef}
                startDrag={handleStartDrag}
                handleZoomChange={handleZoomChange}
                resetCamera={resetCamera}
                savePreset={savePreset}
                selectedCameraId={selectedCamera?.id || 'default'}
                isSavingPreset={isCreatingPreset}
                onRefresh={handleRefresh}
              />
            )}

            {activeTab === 'presets' && (
              <PresetsTab
                presets={presets}
                selectedPreset={selectedPreset}
                isMoving={isMoving}
                onLoadPreset={loadPreset}
                onEditPreset={editPreset}
                onDeletePreset={deletePreset}
                onTogglePatrol={togglePatrol}
                onStartSinglePresetPatrol={startSinglePresetPatrol}
                onStartMultiplePresetPatrol={startMultiplePresetPatrol}
                isPatrolling={isPatrolling}
              />
            )}

            {activeTab === 'patrol' && (
              <PatrolTab
                presets={presets}
                isPatrolling={isPatrolling}
                patrolState={{
                  ...patrolState,
                  isPatrolling
                }}
                patrolStartTime={patrolStartTime}
                patrolEndTime={patrolEndTime}
                onStartPatrol={startPatrol}
                onStopPatrol={stopPatrol}
                onStartTimeChange={handlePatrolStartTimeChange}
                onEndTimeChange={handlePatrolEndTimeChange}
              />
            )}
          </>
        )}

        {editingPreset && (
          <PresetDialog
            editingPreset={editingPreset}
            newPresetName={newPresetName}
            duration={duration}
            durationUnit={durationUnit}
            onClose={() => {
              setEditingPreset(null);
              setNewPresetName('');
              setDuration(5);
              setDurationUnit('seconds');
            }}
            onSave={(preset) => {
              const finalPreset = {
                ...preset,
                name: newPresetName || `Preset ${presets.length + 1}`,
                duration: convertToSeconds(duration, durationUnit),
                durationUnit,
                panTilt: preset.panTilt,
                zoom: preset.zoom
              };

              // Save to API
              savePresetToAPI(finalPreset);

              if (preset.id !== 0) {
                // Update existing preset
                setPresets(prevPresets => 
                  prevPresets.map(p => p.id === preset.id ? {
                    ...finalPreset,
                    id: preset.id
                  } : p)
                );
              } else {
                // Create new preset
                setPresets(prevPresets => [...prevPresets, {
                  ...finalPreset,
                  id: Date.now(),
                  createdAt: Date.now()
                }]);
              }

              // Reset form and switch to presets tab
              setEditingPreset(null);
              setNewPresetName('');
              setDuration(5);
              setDurationUnit('seconds');
              
              // Switch to presets tab
              setActiveTab('presets');
            }}
            onNameChange={setNewPresetName}
            onDurationChange={setDuration}
            onDurationUnitChange={setDurationUnit}
          />
        )}
      </div>
    </div>
  );
};

export default PTZCamera; 