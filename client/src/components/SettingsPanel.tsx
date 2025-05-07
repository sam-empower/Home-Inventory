import { useNotion } from "@/context/NotionContext";
import { useTheme } from "@/context/ThemeContext";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Icons } from "@/lib/icons";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onShowConnectionSetup: () => void;
}

export function SettingsPanel({ isOpen, onClose, onShowConnectionSetup }: SettingsPanelProps) {
  const { isConnected, databaseInfo, disconnect } = useNotion();
  const { theme, toggleTheme } = useTheme();
  const { isOfflineMode, toggleOfflineMode, clearCache } = useOfflineMode();
  const { settings, updateSettings, saveSettings } = useSettings();

  const changeWorkspace = () => {
    onClose();
    onShowConnectionSetup();
  };

  return (
    <div className={`fixed inset-0 z-40 transform transition-transform ${isOpen ? '' : 'translate-x-full'}`}>
      <div 
        className="absolute inset-0 bg-gray-500 bg-opacity-75 dark:bg-opacity-90 transition-opacity" 
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform">
        <div className="h-full flex flex-col overflow-y-auto">
          <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <Icons.x className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 px-4 py-6 sm:px-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Connection</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Workspace</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isConnected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <Button 
                    variant="link" 
                    onClick={changeWorkspace}
                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                  >
                    {isConnected ? "Change" : "Connect"}
                  </Button>
                </div>
                
                {isConnected && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Database</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {databaseInfo?.title || "Unknown database"}
                      </p>
                    </div>
                    <Button 
                      variant="link" 
                      onClick={changeWorkspace}
                      className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Appearance</h3>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark/light mode</p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Offline Mode</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cache data for offline access</p>
                  </div>
                  <Switch
                    checked={isOfflineMode}
                    onCheckedChange={toggleOfflineMode}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Refresh</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fetch new data periodically</p>
                  </div>
                  <Switch
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => updateSettings({ autoRefresh: checked })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="refreshInterval">Refresh Interval</Label>
                  <Select
                    value={settings.refreshInterval.toString()}
                    onValueChange={(value) => updateSettings({ refreshInterval: parseInt(value) })}
                    disabled={!settings.autoRefresh}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">Every minute</SelectItem>
                      <SelectItem value="300">Every 5 minutes</SelectItem>
                      <SelectItem value="900">Every 15 minutes</SelectItem>
                      <SelectItem value="1800">Every 30 minutes</SelectItem>
                      <SelectItem value="3600">Every hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCache}
                    className="inline-flex items-center"
                  >
                    <Icons.trash className="mr-2 h-4 w-4" />
                    Clear Cached Data
                  </Button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">About</h3>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p>Version 1.0.0</p>
                <p className="mt-1">A Progressive Web App to access and interact with your Notion databases on mobile.</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 py-4 px-4 sm:px-6">
            <div className="flex space-x-3">
              {isConnected && (
                <Button 
                  variant="destructive"
                  onClick={disconnect}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              )}
              <Button 
                onClick={saveSettings}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
