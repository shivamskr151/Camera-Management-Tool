// This file is for backward compatibility
// It re-exports hooks from their new locations

// Auth hooks
export { useAuth, useAuthCheck, useRole } from './auth/useAuth';
export { useLoginMutation } from './auth/useAuthMutation';

// Theme hooks
export { useTheme } from './ui/useTheme';

// Camera hooks
export { usePTZCamera } from './camera/usePTZCamera';
export { useCameraControls } from './camera/useCameraControls';
export { usePresetManagement } from './camera/usePresetManagement';
export { usePatrolManagement } from './camera/usePatrolManagement';
export { useCameraMovement } from './camera/useCameraMovement';
export { useCameraSearch } from './camera/useCameraSearch';
export { useCreatePreset } from './camera/useCreatePreset';

// UI hooks
export { useDrawingState } from './ui/useDrawingState';
export { useActivityState } from './ui/useActivityState';
export { useToast } from './ui/use-toast';
export { useIsMobile } from './ui/use-mobile';
export { useThemeConfig } from './ui/useThemeConfig';

// Utility hooks
export { useFetch, usePaginatedFetch, useCreate, useUpdate, useDelete } from './utils/useFetch';
export { useDataFetching, useCrud, useAnalytics } from './utils/useDashboard'; 