import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotionProvider } from "@/context/NotionContext";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import { useState, useEffect } from "react";

// Custom hook for determining the base path in any environment
function useBasePath() {
  const [basePath, setBasePath] = useState("/");
  
  useEffect(() => {
    // This helps with deployments that might serve the app from a sub-path
    const path = window.location.pathname;
    const isDeployed = !window.location.hostname.includes('replit.dev') && 
                      !window.location.hostname.includes('localhost');
                      
    if (isDeployed) {
      console.log("Running in deployed environment, path:", path);
    }
    
    // Force base path to be root for SPA
    setBasePath("/");
  }, []);
  
  return basePath;
}

function Router() {
  const basePath = useBasePath();
  
  return (
    <WouterRouter base={basePath}>
      <Switch>
        <Route path="/" component={HomePage} />
        {/* Add specific routes here if needed */}
        <Route path="/:path*" component={HomePage} />
        {/* This is a fallback that should never be reached due to the catch-all above */}
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </NotionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
