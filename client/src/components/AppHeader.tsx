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
    setSpotlightSupported(isCoreSpotlightSupported());
  }, []);
  return (
    <header className="sticky top-0 z-30 ios-nav">
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
              <span className="ios-badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 ml-2 px-1.5 py-0.5 text-xs font-medium">
                <svg 
                  className="inline-block w-3 h-3 mr-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Spotlight
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
