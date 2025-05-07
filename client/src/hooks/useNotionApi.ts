import { useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useNotion } from '@/context/NotionContext';

/**
 * A custom hook to make authenticated API requests to the Notion API
 */
export function useNotionApi() {
  const { credentials, isConnected } = useNotion();
  
  /**
   * Make an authenticated request to the Notion API
   */
  const notionRequest = useCallback(async (
    method: string, 
    endpoint: string, 
    data?: any
  ) => {
    if (!isConnected || !credentials) {
      console.log("Not connected to Notion or missing credentials");
      return null;
    }
    
    try {
      // Add credentials to the headers
      const headers = {
        'x-notion-token': credentials.integrationToken,
        'x-notion-database-id': credentials.databaseId
      };
      
      console.log("Making authenticated request with headers:", {
        token: credentials.integrationToken.substring(0, 4) + "...",
        dbId: credentials.databaseId.substring(0, 4) + "..."
      });
      
      // Make the authenticated request
      const response = await apiRequest(method, endpoint, data, { headers });
      return response.json();
    } catch (error) {
      console.error("Error in notionRequest:", error);
      throw error;
    }
  }, [credentials, isConnected]);
  
  return { 
    notionRequest,
    isAuthenticated: isConnected && !!credentials 
  };
}