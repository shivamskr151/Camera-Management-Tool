import { useState, useRef, useEffect, useCallback } from 'react';
import { Preset, PatrolState, CameraPosition } from '@/types/ptz-camera';
import { convertToSeconds, convertFromSeconds } from '@/utils/time';
import { Camera } from '@/components/CameraSearch';
import { useCameraControls } from './useCameraControls';

export const usePTZCamera = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('control');

  // State for camera control
  const [showGridlines, setShowGridlines] = useState(true);
  const [panTilt, setPanTilt] = useState({ pan: 0, tilt: 0 });
  const [zoom, setZoom] = useState(1);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  // Refs for joystick
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const joystickHandleRef = useRef<HTMLDivElement>(null);

  // State for presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [duration, setDuration] = useState(5);
  const [durationUnit, setDurationUnit] = useState<'seconds' | 'minutes' | 'hours'>('seconds');

  // State for patrol
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [patrolState, setPatrolState] = useState<PatrolState>({
    currentPresetIndex: 0,
    startTime: '',
    endTime: '',
    isActive: false,
    isSinglePresetPatrol: false,
    singlePresetId: null,
    remainingTime: 0,
    activePresetId: null,
    selectedPresetIds: [],
    patrolMode: 'single',
    isPatrolling: false
  });
  const [patrolStartTime, setPatrolStartTime] = useState('');
  const [patrolEndTime, setPatrolEndTime] = useState('');

  // State for drag handling
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('cameraPresets');
    if (savedPresets) {
      try {
        const parsedPresets = JSON.parse(savedPresets);
        setPresets(parsedPresets);
      } catch (error) {
        console.error('Error loading presets from localStorage:', error);
      }
    }
  }, []);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('cameraPresets', JSON.stringify(presets));
  }, [presets]);

  // Function to load a preset
  const loadPreset = useCallback(async (position: CameraPosition) => {
    try {
      setIsMoving(true);
      setZoom(position.zoom);
      setPanTilt(position.panTilt);
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsMoving(false);
      return { success: true };
    } catch (error) {
      setIsMoving(false);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to load preset' };
    }
  }, [setZoom, setPanTilt]);

  // Effect for patrol timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPatrolling && patrolState.remainingTime > 0) {
      timer = setInterval(() => {
        setPatrolState(prev => {
          const newRemainingTime = prev.remainingTime - 1;
          
          // If time is up for current preset
          if (newRemainingTime <= 0) {
            // For single preset patrol, stop the patrol
            if (prev.isSinglePresetPatrol) {
              setIsPatrolling(false);
              return {
                ...prev,
                remainingTime: 0,
                isPatrolling: false
              };
            } 
            // For multiple preset patrol, move to next preset
            else if (prev.patrolMode === 'multiple' && prev.selectedPresetIds.length > 0) {
              const currentIndex = prev.selectedPresetIds.indexOf(prev.activePresetId || 0);
              const nextIndex = (currentIndex + 1) % prev.selectedPresetIds.length;
              const nextPresetId = prev.selectedPresetIds[nextIndex];
              const nextPreset = presets.find(p => p.id === nextPresetId);
              
              if (nextPreset) {
                // Load the next preset
                const position: CameraPosition = {
                  zoom: nextPreset.zoom,
                  panTilt: nextPreset.panTilt
                };
                
                loadPreset(position);
                
                return {
                  ...prev,
                  currentPresetIndex: nextIndex,
                  remainingTime: nextPreset.duration,
                  activePresetId: nextPreset.id
                };
              } else {
                // If next preset not found, stop patrol
                setIsPatrolling(false);
                return {
                  ...prev,
                  remainingTime: 0,
                  isPatrolling: false
                };
              }
            }
          }
          
          // Continue with the countdown
          return {
            ...prev,
            remainingTime: newRemainingTime
          };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPatrolling, patrolState, presets, loadPreset, setIsPatrolling]);

  // Joystick drag handlers
  const handleStartDrag = (event: React.MouseEvent | React.TouchEvent) => {
    if (!joystickContainerRef.current) return;
    
    setIsDragging(true);
    const container = joystickContainerRef.current.getBoundingClientRect();
    const centerX = container.width / 2;
    const centerY = container.height / 2;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const startX = clientX - container.left - centerX;
    const startY = clientY - container.top - centerY;
    
    setDragStart({ x: startX, y: startY });
  };

  const handleDrag = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || !joystickContainerRef.current) return;
    
    const container = joystickContainerRef.current.getBoundingClientRect();
    const centerX = container.width / 2;
    const centerY = container.height / 2;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    let newX = clientX - container.left - centerX;
    let newY = clientY - container.top - centerY;
    
    const distance = Math.sqrt(newX * newX + newY * newY);
    const maxRadius = container.width / 2 - 20;
    
    if (distance > maxRadius) {
      const scale = maxRadius / distance;
      newX *= scale;
      newY *= scale;
    }
    
    setJoystickPosition({ x: newX, y: newY });
    
    const pan = newX / maxRadius;
    const tilt = newY / maxRadius;
    setPanTilt({ pan, tilt });
  }, [isDragging]);

  const handleEndDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('mouseup', handleEndDrag);
      window.addEventListener('touchend', handleEndDrag);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('mouseup', handleEndDrag);
      window.removeEventListener('touchend', handleEndDrag);
    };
  }, [isDragging, handleDrag, handleEndDrag]);

  const {
    handleZoomChange,
    resetCamera,
    loadPreset: loadPresetFromControls
  } = useCameraControls(
    setZoom,
    setPanTilt,
    setJoystickPosition,
    joystickContainerRef
  );

  return {
    // State
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

    // Setters
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

    // Handlers
    handleStartDrag,
    handleDrag,
    handleEndDrag,
    loadPresetFromControls
  };
}; 