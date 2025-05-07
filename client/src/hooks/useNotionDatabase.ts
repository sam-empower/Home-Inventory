import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { useNotion } from "@/context/NotionContext";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { useNotionApi } from "@/hooks/useNotionApi";
import { NotionDatabaseItem } from "@shared/schema";

interface UseNotionDatabaseOptions {
  filters?: Record<string, any>;
  sort?: { property: string; direction: "ascending" | "descending" };
  search?: string;
}

export function useNotionDatabase(options: UseNotionDatabaseOptions = {}) {
  const { isConnected, databaseInfo } = useNotion();
  const { isOfflineMode, getCachedData, setCachedData } = useOfflineMode();
  const { notionRequest, isAuthenticated } = useNotionApi();
  
  const { filters, sort, search } = options;
  
  // Force reconnection when database info changes
  useEffect(() => {
    if (databaseInfo) {
      console.log("Database info updated, triggering data refresh");
      
      // Wait a brief moment for all contexts to update, then refresh
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['/api/notion/database'],
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [databaseInfo]);
  
  const fetchDatabase = async (): Promise<NotionDatabaseItem[]> => {
    if (!isAuthenticated) {
      return [];
    }
    
    // When offline, use cached data
    if (isOfflineMode) {
      const databaseId = databaseInfo?.id;
      if (databaseId) {
        const cachedData = getCachedData(`database-${databaseId}`);
        if (cachedData) {
          return cachedData as NotionDatabaseItem[];
        }
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
    const data = await notionRequest('GET', endpoint);
    
    // Cache the data for offline use
    if (data && Array.isArray(data) && databaseInfo?.id) {
      setCachedData(`database-${databaseInfo.id}`, data);
    }
    
    return data || [];
  };
  
  const query = useQuery<NotionDatabaseItem[]>({
    queryKey: ['/api/notion/database', filters, sort, search],
    queryFn: fetchDatabase,
    enabled: isAuthenticated,
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
  const { isConnected } = useNotion();
  const { isOfflineMode, getCachedData, setCachedData } = useOfflineMode();
  const { notionRequest, isAuthenticated } = useNotionApi();
  
  const fetchDatabaseItem = async (): Promise<NotionDatabaseItem | null> => {
    if (!isAuthenticated || !id) {
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
    
    const data = await notionRequest('GET', `/api/notion/database/${id}`);
    
    // Cache the item for offline use
    if (data) {
      setCachedData(`database-item-${id}`, data);
    }
    
    return data;
  };
  
  return useQuery<NotionDatabaseItem | null>({
    queryKey: ['/api/notion/database/item', id],
    queryFn: fetchDatabaseItem,
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
