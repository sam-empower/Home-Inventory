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
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {databaseInfo?.title || "Notion DB"}
          </div>
          <div className="flex items-center">
            {isConnected ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">Connected</span>
              </>
            ) : (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                </span>
                <span className="ml-2 text-xs text-gray-600 dark:text-gray-400 font-medium">Not connected</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
          >
            {theme === 'dark' ? <Icons.sun className="h-5 w-5" /> : <Icons.moon className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost" 
            size="icon"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
          >
            <Icons.refresh className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="ghost" 
            size="icon"
            onClick={onOpenSettings}
            className="text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
          >
            <Icons.settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
