export interface Preset {
  id: number;
  name: string;
  panTilt: {
    pan: number;
    tilt: number;
  };
  zoom: number;
  duration: number;
  durationUnit: 'seconds' | 'minutes' | 'hours';
  isInPatrol: boolean;
  selectedForPatrol?: boolean;
  lastUsed?: number;
  createdAt?: number;
}

export interface PatrolState {
  currentPresetIndex: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isSinglePresetPatrol: boolean;
  singlePresetId: number | null;
  remainingTime: number;
  activePresetId: number | null;
  selectedPresetIds: number[];
  patrolMode: 'single' | 'multiple';
  isPatrolling: boolean;
}

export interface CameraPosition {
  zoom: number;
  panTilt: {
    pan: number;
    tilt: number;
  };
}

export interface ApiResponse {
  success: boolean;
  message?: string;
}

export interface CameraAPIResponse {
  success: boolean;
  message?: string;
}

export interface PTZCameraProps {
  className?: string;
}

export interface CameraPreviewProps {
  showGridlines: boolean;
  panTilt: { pan: number; tilt: number };
  zoom: number;
}

export interface PresetCardProps {
  preset: Preset;
  isSelected: boolean;
  isMoving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePatrol: () => void;
  onStartSinglePresetPatrol: () => void;
  isPatrolling: boolean;
} 