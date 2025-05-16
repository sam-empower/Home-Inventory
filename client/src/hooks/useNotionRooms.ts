import { useQuery } from "@tanstack/react-query";
import { useNotionApi } from "@/hooks/useNotionApi";
import { useOfflineMode } from "@/hooks/useOfflineMode";

interface Room {
  id: string;
  name: string;
}

/**
 * Hook for fetching rooms data directly from Notion
 */
export function useNotionRooms() {
  const { notionRequest, isAuthenticated } = useNotionApi();
  const { isOfflineMode, getCachedData, setCachedData } = useOfflineMode();

  const fetchRooms = async (): Promise<Room[]> => {
    if (!isAuthenticated) {
      return [];
    }
    
    // When offline, use cached data
    if (isOfflineMode) {
      const cachedData = getCachedData('notion-rooms');
      if (cachedData) {
        return cachedData as Room[];
      }
      throw new Error("No cached data available while offline");
    }
    
    try {
      // Directly fetch rooms from API without going through notionRequest
      const response = await fetch('/api/notion/rooms');
      const data = await response.json();
      
      console.log('Room data from API:', data);
      
      if (data?.success && Array.isArray(data.rooms)) {
        // Cache the rooms data
        setCachedData('notion-rooms', data.rooms);
        return data.rooms;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  };
  
  return useQuery<Room[]>({
    queryKey: ['/api/notion/rooms'],
    queryFn: fetchRooms,
    enabled: true, // Always enabled regardless of authentication state
    staleTime: 0, // No stale time - always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
}