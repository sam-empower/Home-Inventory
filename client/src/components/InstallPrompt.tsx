import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallPrompt() {
  const { isInstallable, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  
  if (!isInstallable || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleInstall = async () => {
    try {
      await promptInstall();
    } catch (error) {
      console.error("Failed to install PWA:", error);
    }
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 inset-x-0 px-4 pb-4 sm:px-6 sm:pb-6 md:pb-6 z-40">
      <div className="rounded-lg bg-white dark:bg-gray-800 px-4 py-3 shadow-lg ring-1 ring-black ring-opacity-5 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <div className="flex items-center flex-1">
            <div className="flex-shrink-0">
              <Icons.download className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Install App</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Add to your home screen for offline access
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex">
            <Button
              variant="outline"
              size="sm"
              className="mr-2 bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-800 focus:ring-primary-600 dark:focus:ring-primary-400 border-primary-200 dark:border-primary-800"
              onClick={handleInstall}
            >
              Install
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              onClick={handleDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <Icons.x className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
