import { useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useNotion } from '@/context/NotionContext';

/**
 * A custom hook to make API requests to the Notion API endpoints
 */
export function useNotionApi() {
  const { isConnected } = useNotion();
  
  /**
   * Make a request to the Notion API endpoints
   */
  const notionRequest = useCallback(async (
    method: string, 
    endpoint: string, 
    data?: any
  ) => {
    if (!isConnected) {
      console.log("Not connected to Notion");
      return null;
    }
    
    try {
      console.log(`Making request to ${endpoint}`);
      
      // Make the request (auth handled server-side via environment variables)
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    } catch (error) {
      console.error("Error in notionRequest:", error);
      throw error;
    }
  }, [isConnected]);
  
  return { 
    notionRequest,
    isAuthenticated: isConnected
  };
}