import { ReactNode, useEffect } from "react";
import store from "@/store";
import { setTokenInitialized } from "@/lib/axios";

interface AppInitializerProps {
  children: ReactNode;
}

export const AppInitializer = ({ children }: AppInitializerProps) => {
  useEffect(() => {
    const initializeApp = async () => {
      // Set initial loading state
      store.getActions().auth.setIsLoading(true);

      try {
        // Always try to restore auth state
        await store.getActions().auth.restoreAuth();
        
        // Set token as initialized after auth restoration
        setTokenInitialized(true);
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        // Clear auth state on error
        store.getActions().auth.setUser(null);
        store.getActions().auth.setToken(null);
        store.getActions().auth.setIsAuthenticated(false);
        
        // Still set token as initialized even if auth restoration failed
        setTokenInitialized(true);
      } finally {
        // Always set loading to false when done
        store.getActions().auth.setIsLoading(false);
      }
      
      // Initialize theme
      store.getActions().theme.initTheme();
    };

    initializeApp();
  }, []);
  
  return <>{children}</>;
}; 