import { useNotion } from "@/context/NotionContext";
import { useTheme } from "@/context/ThemeContext";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Icons } from "@/lib/icons";
import { useEffect, useState } from "react";
import { isCoreSpotlightSupported } from "@/lib/iosSpotlight";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onShowConnectionSetup: () => void; // Keeping for compatibility, but not used anymore
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { isConnected, databaseInfo, refresh } = useNotion();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { isOfflineMode, toggleOfflineMode, clearCache } = useOfflineMode();
  const { settings, updateSettings, saveSettings } = useSettings();
  const [spotlightSupported, setSpotlightSupported] = useState(false);
  const [spotlightEnabled, setSpotlightEnabled] = useState(false);
  
  // Check if Spotlight search is supported
  useEffect(() => {
    // Check for iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setSpotlightSupported(isIOS);
    
    // In production, use the full check:
    const checkSpotlight = async () => {
      try {
        const isSupported = await isCoreSpotlightSupported();
        setSpotlightEnabled(isSupported);
      } catch (error) {
        console.error('Error checking Spotlight support:', error);
      }
    };
    
    checkSpotlight();
  }, []);

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
                <Icons.close className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 px-4 py-6 sm:px-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Connection</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isConnected ? "Connected to Notion" : "Not connected"}
                    </p>
                  </div>
                  <Button 
                    variant="link" 
                    onClick={refresh}
                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                  >
                    Refresh
                  </Button>
                </div>
                
                {isConnected && databaseInfo && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Database</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {databaseInfo.title || "Notion Database"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Last synced: {new Date(databaseInfo.lastSynced).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {/* Spotlight Status */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Spotlight Status</p>
                  <div className="flex items-center mt-1.5">
                    {spotlightSupported ? (
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 text-xs font-medium rounded-full">
                        {spotlightEnabled ? "Enabled" : "Available"} 
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 text-xs font-medium rounded-full">
                        Not Available
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {spotlightSupported 
                      ? "Your device supports iOS Spotlight search integration" 
                      : "Spotlight search is only available on iOS devices"}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Appearance</h3>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="themeMode">Theme Mode</Label>
                  <Select
                    value={themeMode}
                    onValueChange={(value) => setThemeMode(value as "light" | "dark" | "system")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select theme mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">
                        <div className="flex items-center">
                          <Icons.system className="mr-2 h-4 w-4" />
                          <span>System</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="light">
                        <div className="flex items-center">
                          <Icons.sun className="mr-2 h-4 w-4" />
                          <span>Light</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Icons.moon className="mr-2 h-4 w-4" />
                          <span>Dark</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current theme: {theme === 'dark' ? 'Dark' : 'Light'}
                    {themeMode === 'system' && ' (from system preference)'}
                  </p>
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
