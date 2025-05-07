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
    
    const response = await notionRequest('GET', '/api/notion/rooms');
    
    if (response?.success && Array.isArray(response.rooms)) {
      // Cache the rooms data
      setCachedData('notion-rooms', response.rooms);
      return response.rooms;
    }
    
    return [];
  };
  
  return useQuery<Room[]>({
    queryKey: ['/api/notion/rooms'],
    queryFn: fetchRooms,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}