import { useQuery } from "@tanstack/react-query";

export interface RoomItem {
  id: string;
  name: string;
  description: string;
  image?: string;
}

/**
 * Hook for fetching items for a specific room
 */
export function useRoomItems(roomId: string | null) {
  const fetchRoomItems = async (): Promise<RoomItem[]> => {
    if (!roomId) {
      return [];
    }
    
    try {
      const response = await fetch(`/api/notion/room-items?roomId=${roomId}`);
      const data = await response.json();
      
      console.log(`Room ${roomId} items:`, data);
      
      if (data?.success && Array.isArray(data.items)) {
        return data.items;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching room items:', error);
      return [];
    }
  };
  
  return useQuery<RoomItem[]>({
    queryKey: ['/api/notion/room-items', roomId],
    queryFn: fetchRoomItems,
    enabled: !!roomId, // Only run the query if roomId is provided
    staleTime: 0, // No stale time - always fetch fresh data
  });
}