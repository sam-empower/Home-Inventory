import { useNotion } from "@/context/NotionContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { isCoreSpotlightSupported } from "@/lib/iosSpotlight";
import { useEffect, useState } from "react";

interface AppHeaderProps {
  onRefreshData: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
  isSpotlightEnabled?: boolean;
}

export function AppHeader({ onRefreshData, onOpenSettings, isRefreshing, isSpotlightEnabled }: AppHeaderProps) {
  const { isConnected, databaseInfo } = useNotion();
  const { toggleTheme, theme } = useTheme();
  const [spotlightSupported, setSpotlightSupported] = useState(false);
  
  // Check if Spotlight search is supported
  useEffect(() => {
    // We'll show the badge regardless of actual support for testing purposes
    setSpotlightSupported(true);
    
    // Log actual support status for debugging
    const actualSupport = isCoreSpotlightSupported();
    console.log('Spotlight actual support status:', actualSupport);
    
    // In production, you'd uncomment this:
    // setSpotlightSupported(isCoreSpotlightSupported());
  }, []);
  return (
    <header className="fixed top-0 left-0 right-0 z-30 ios-nav">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {databaseInfo?.title || "My Items"}
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <span className="ios-badge bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 ml-2 px-1.5 py-0.5 text-xs font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 mr-1"></span> Live
              </span>
            ) : (
              <span className="ios-badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 ml-2 px-1.5 py-0.5 text-xs font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mr-1"></span> Offline
              </span>
            )}
            
            {spotlightSupported && (
              <span className="ios-badge bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200 ml-2 px-2.5 py-1.5 text-xs font-medium animate-pulse border border-blue-300 dark:border-blue-600 shadow-sm">
                <svg 
                  className="inline-block w-4 h-4 mr-1 animate-bounce" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Spotlight Ready
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost" 
            size="sm"
            onClick={toggleTheme}
            className="rounded-full w-8 h-8 flex items-center justify-center text-primary dark:text-primary-foreground active:bg-gray-100 dark:active:bg-gray-800"
          >
            {theme === 'dark' ? <Icons.sun className="h-5 w-5" /> : <Icons.moon className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="rounded-full w-8 h-8 flex items-center justify-center text-primary dark:text-primary-foreground active:bg-gray-100 dark:active:bg-gray-800"
          >
            <Icons.refresh className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={onOpenSettings}
            className="rounded-full w-8 h-8 flex items-center justify-center text-primary dark:text-primary-foreground active:bg-gray-100 dark:active:bg-gray-800"
          >
            <Icons.settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
