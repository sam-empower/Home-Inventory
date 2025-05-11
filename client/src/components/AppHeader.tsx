import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";

interface AppHeaderProps {
  onRefreshData: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
  isSpotlightEnabled?: boolean;
}

export function AppHeader({ onRefreshData, onOpenSettings, isRefreshing }: AppHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 ios-nav">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            Hopkins Home
          </div>
        </div>
        <div className="flex items-center space-x-2">
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
