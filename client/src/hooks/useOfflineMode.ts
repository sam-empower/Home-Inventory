import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem('offlineMode') === 'true';
  });
  const { toast } = useToast();

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      if (!isOfflineMode) {
        toast({
          title: "You're offline",
          description: "Switched to offline mode automatically",
          variant: "default",
        });
        setIsOfflineMode(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOfflineMode, toast]);

  // Save offline mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('offlineMode', isOfflineMode.toString());
  }, [isOfflineMode]);

  // Cache management functions
  const setCachedData = (key: string, data: any) => {
    try {
      const serializedData = JSON.stringify({
        timestamp: Date.now(),
        data
      });
      localStorage.setItem(`cache_${key}`, serializedData);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  };

  const getCachedData = (key: string, maxAge?: number): any | null => {
    try {
      const cachedItem = localStorage.getItem(`cache_${key}`);
      if (!cachedItem) return null;

      const { timestamp, data } = JSON.parse(cachedItem);
      
      // Check cache age if maxAge is provided
      if (maxAge && Date.now() - timestamp > maxAge) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
      return null;
    }
  };

  const clearCache = () => {
    const cacheKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        cacheKeys.push(key);
      }
    }
    
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    toast({
      title: "Cache cleared",
      description: "All cached data has been cleared",
    });
  };

  const toggleOfflineMode = () => {
    setIsOfflineMode(prev => !prev);

    toast({
      title: isOfflineMode ? "Offline mode disabled" : "Offline mode enabled",
      description: isOfflineMode 
        ? "App will fetch fresh data when online" 
        : "App will use cached data when offline",
    });
  };

  return {
    isOnline,
    isOfflineMode,
    toggleOfflineMode,
    setCachedData,
    getCachedData,
    clearCache
  };
}
