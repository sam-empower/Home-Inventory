import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Settings {
  refreshInterval: number;
  autoRefresh: boolean;
  offlineMode: boolean;
}

const defaultSettings: Settings = {
  refreshInterval: 300, // 5 minutes
  autoRefresh: true,
  offlineMode: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('notionDbSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('notionDbSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('notionDbSettings', JSON.stringify(settings));
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated",
    });
    
    setIsSettingsOpen(false);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('notionDbSettings', JSON.stringify(defaultSettings));
    
    toast({
      title: "Settings reset",
      description: "Settings have been reset to defaults",
    });
  };

  return {
    settings,
    updateSettings,
    saveSettings,
    resetSettings,
    isSettingsOpen,
    setIsSettingsOpen,
  };
}
