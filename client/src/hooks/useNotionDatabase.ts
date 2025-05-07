import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useNotion } from "@/context/NotionContext";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { NotionDatabaseItem } from "@shared/schema";

interface UseNotionDatabaseOptions {
  filters?: Record<string, any>;
  sort?: { property: string; direction: "ascending" | "descending" };
  search?: string;
}

export function useNotionDatabase(options: UseNotionDatabaseOptions = {}) {
  const { isConnected, credentials } = useNotion();
  const { isOfflineMode, getCachedData, setCachedData } = useOfflineMode();
  
  const { filters, sort, search } = options;
  
  const fetchDatabase = async (): Promise<NotionDatabaseItem[]> => {
    if (!isConnected || !credentials) {
      return [];
    }
    
    // When offline, use cached data
    if (isOfflineMode) {
      const cachedData = getCachedData(`database-${credentials.databaseId}`);
      if (cachedData) {
        return cachedData as NotionDatabaseItem[];
      }
      throw new Error("No cached data available while offline");
    }
    
    // Build query params
    const queryParams = new URLSearchParams();
    
    if (filters && Object.keys(filters).length > 0) {
      queryParams.append('filters', JSON.stringify(filters));
    }
    
    if (sort) {
      queryParams.append('sort', JSON.stringify(sort));
    }
    
    if (search) {
      queryParams.append('search', search);
    }
    
    const endpoint = `/api/notion/database?${queryParams.toString()}`;
    const response = await apiRequest('GET', endpoint);
    const data = await response.json();
    
    // Cache the data for offline use
    setCachedData(`database-${credentials.databaseId}`, data);
    
    return data;
  };
  
  const query = useQuery<NotionDatabaseItem[]>({
    queryKey: ['/api/notion/database', filters, sort, search],
    queryFn: fetchDatabase,
    enabled: isConnected && !!credentials,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const refreshMutation = useMutation({
    mutationFn: fetchDatabase,
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/notion/database', filters, sort, search], data);
    },
  });

  return {
    ...query,
    isConnected,
    refreshData: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}

export function useNotionDatabaseItem(id: string | null) {
  const { isConnected, credentials } = useNotion();
  const { isOfflineMode, getCachedData, setCachedData } = useOfflineMode();
  
  const fetchDatabaseItem = async (): Promise<NotionDatabaseItem | null> => {
    if (!isConnected || !credentials || !id) {
      return null;
    }
    
    // When offline, use cached data
    if (isOfflineMode) {
      const cachedData = getCachedData(`database-item-${id}`);
      if (cachedData) {
        return cachedData as NotionDatabaseItem;
      }
      throw new Error("No cached data available while offline");
    }
    
    const response = await apiRequest('GET', `/api/notion/database/${id}`);
    const data = await response.json();
    
    // Cache the item for offline use
    setCachedData(`database-item-${id}`, data);
    
    return data;
  };
  
  return useQuery<NotionDatabaseItem | null>({
    queryKey: ['/api/notion/database/item', id],
    queryFn: fetchDatabaseItem,
    enabled: isConnected && !!credentials && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
