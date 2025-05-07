import { useNotion } from "@/context/NotionContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";

interface AppHeaderProps {
  onRefreshData: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
}

export function AppHeader({ onRefreshData, onOpenSettings, isRefreshing }: AppHeaderProps) {
  const { isConnected, databaseInfo } = useNotion();
  const { toggleTheme, theme } = useTheme();
  
  return (
    <header className="sticky top-0 z-30 ios-nav">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {databaseInfo?.title || "My Items"}
          </div>
          <div className="flex items-center">
            {isConnected ? (
              <span className="ios-badge bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 ml-2 px-1.5 py-0.5 text-xs font-medium">
                <span className="mr-1">●</span> Live
              </span>
            ) : (
              <span className="ios-badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 ml-2 px-1.5 py-0.5 text-xs font-medium">
                Offline
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost" 
            size="sm"
            onClick={toggleTheme}
            className="rounded-full w-8 h-8 flex items-center justify-center text-primary dark:text-primary-foreground hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            {theme === 'dark' ? <Icons.sun className="h-5 w-5" /> : <Icons.moon className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="rounded-full w-8 h-8 flex items-center justify-center text-primary dark:text-primary-foreground hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            <Icons.refresh className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={onOpenSettings}
            className="rounded-full w-8 h-8 flex items-center justify-center text-primary dark:text-primary-foreground hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            <Icons.settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
