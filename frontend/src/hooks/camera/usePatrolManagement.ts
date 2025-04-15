import { useCallback, useEffect, useState } from 'react';
import { Preset, PatrolState, CameraPosition } from '@/types/ptz-camera';

export const usePatrolManagement = (
  setIsPatrolling: (isPatrolling: boolean) => void,
  setPatrolState: (state: PatrolState) => void,
  setPatrolStartTime: (time: string) => void,
  setPatrolEndTime: (time: string) => void,
  presets: Preset[],
  patrolStartTime: string,
  patrolEndTime: string,
  loadPreset: (position: CameraPosition) => Promise<{ success: boolean; message?: string }>
) => {
  // Create a default patrol state to reduce duplication
  const createDefaultPatrolState = (overrides: Partial<PatrolState> = {}): PatrolState => ({
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
    isPatrolling: false,
    ...overrides
  });

  const [patrolState, setLocalPatrolState] = useState<PatrolState>(createDefaultPatrolState());

  // Effect to handle patrol timer and transitions
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const handlePatrolTimer = () => {
      setLocalPatrolState(prev => {
        // Only run timer if patrolling and there's remaining time
        if (!prev.isPatrolling || prev.remainingTime <= 0) {
          return prev;
        }
        
        const newRemainingTime = prev.remainingTime - 1;
        
        // If time is up for current preset
        if (newRemainingTime <= 0) {
          // For single preset patrol, stop the patrol
          if (prev.isSinglePresetPatrol) {
            setIsPatrolling(false);
            const newState = createDefaultPatrolState({
              ...prev,
              remainingTime: 0,
              isPatrolling: false
            });
            setPatrolState(newState);
            return newState;
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
              
              const newState = createDefaultPatrolState({
                ...prev,
                currentPresetIndex: nextIndex,
                remainingTime: nextPreset.duration,
                activePresetId: nextPreset.id
              });
              setPatrolState(newState);
              return newState;
            } else {
              // If next preset not found, stop patrol
              setIsPatrolling(false);
              const newState = createDefaultPatrolState({
                ...prev,
                remainingTime: 0,
                isPatrolling: false
              });
              setPatrolState(newState);
              return newState;
            }
          }
        }
        
        // Continue with the countdown
        const newState = createDefaultPatrolState({
          ...prev,
          remainingTime: newRemainingTime
        });
        setPatrolState(newState);
        return newState;
      });
    };
    
    // Start the timer if patrolling
    if (patrolState.isPatrolling && patrolState.remainingTime > 0) {
      timer = setInterval(handlePatrolTimer, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [patrolState, presets, loadPreset, setIsPatrolling, setPatrolState]);

  const startSinglePresetPatrol = useCallback((presetId: number) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setIsPatrolling(true);
      const newState = createDefaultPatrolState({
        currentPresetIndex: 0,
        startTime: patrolStartTime,
        endTime: patrolEndTime,
        isActive: true,
        isSinglePresetPatrol: true,
        singlePresetId: presetId,
        remainingTime: preset.duration,
        activePresetId: presetId,
        selectedPresetIds: [presetId],
        patrolMode: 'single',
        isPatrolling: true
      });
      setPatrolState(newState);
      setLocalPatrolState(newState);
      loadPreset(preset);
    }
  }, [presets, patrolStartTime, patrolEndTime, setIsPatrolling, setPatrolState]);

  const startMultiplePresetPatrol = useCallback((presetIds: number[]) => {
    if (presetIds.length > 0) {
      const firstPreset = presets.find(p => p.id === presetIds[0]);
      if (firstPreset) {
        setIsPatrolling(true);
        const newState = createDefaultPatrolState({
          currentPresetIndex: 0,
          startTime: patrolStartTime,
          endTime: patrolEndTime,
          isActive: true,
          isSinglePresetPatrol: false,
          singlePresetId: null,
          remainingTime: firstPreset.duration,
          activePresetId: firstPreset.id,
          selectedPresetIds: presetIds,
          patrolMode: 'multiple',
          isPatrolling: true
        });
        setPatrolState(newState);
        setLocalPatrolState(newState);
        loadPreset(firstPreset);
      }
    }
  }, [presets, patrolStartTime, patrolEndTime, setIsPatrolling, setPatrolState]);

  const startPatrol = useCallback(() => {
    const activePresets = presets.filter(p => p.isInPatrol);
    if (activePresets.length > 0) {
      setIsPatrolling(true);
      const newState = createDefaultPatrolState({
        currentPresetIndex: 0,
        startTime: patrolStartTime,
        endTime: patrolEndTime,
        isActive: true,
        isSinglePresetPatrol: false,
        singlePresetId: null,
        remainingTime: activePresets[0].duration,
        activePresetId: activePresets[0].id,
        selectedPresetIds: activePresets.map(p => p.id),
        patrolMode: 'multiple',
        isPatrolling: true
      });
      setPatrolState(newState);
      setLocalPatrolState(newState);
      loadPreset(activePresets[0]);
    }
  }, [presets, patrolStartTime, patrolEndTime, setIsPatrolling, setPatrolState]);

  const stopPatrol = useCallback(() => {
    setIsPatrolling(false);
    const newState = createDefaultPatrolState({
      isActive: false
    });
    setPatrolState(newState);
    setLocalPatrolState(newState);
  }, [setIsPatrolling, setPatrolState]);

  const handlePatrolStartTimeChange = useCallback((time: string) => {
    setPatrolStartTime(time);
  }, [setPatrolStartTime]);

  const handlePatrolEndTimeChange = useCallback((time: string) => {
    setPatrolEndTime(time);
  }, [setPatrolEndTime]);

  return {
    startSinglePresetPatrol,
    startMultiplePresetPatrol,
    startPatrol,
    stopPatrol,
    handlePatrolStartTimeChange,
    handlePatrolEndTimeChange
  };
}; 