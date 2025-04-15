import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StoreProvider } from 'easy-peasy';
import { ThemeProvider } from '@/context/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import store from '@/store';

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const router = createBrowserRouter(routes);
  
  return (
    <StoreProvider store={store}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}

export default App;
