// Auth hooks
export { useAuth, useAuthCheck, useRole } from './auth/useAuth';
export { useLoginMutation } from './auth/useAuthMutation';

// Camera hooks
export {
  useCameraMovement,
  usePTZCamera,
  useCameraControls,
  useCameraSearch,
  useCreatePreset,
  usePresetManagement,
  usePatrolManagement
} from './camera';

// UI hooks
export {
  useTheme,
  useThemeConfig,
  useToast,
  useIsMobile,
  useDrawingState,
  useActivityState
} from './ui';

// Utility hooks
export {
  useFetch,
  usePaginatedFetch,
  useCreate,
  useUpdate,
  useDelete
} from './utils/useFetch';

export {
  useDataFetching,
  useCrud,
  useAnalytics
} from './utils/useDashboard';

// Types
export type { ThemeConfig } from './ui/useThemeConfig'; 