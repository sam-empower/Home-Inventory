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
      throw new Error('Not connected to Notion. Please provide valid credentials.');
    }
    
    // Add credentials to the headers
    const headers = {
      'x-notion-token': credentials.integrationToken,
      'x-notion-database-id': credentials.databaseId
    };
    
    // Make the authenticated request
    const response = await apiRequest(method, endpoint, data, { headers });
    return response.json();
  }, [credentials, isConnected]);
  
  return { 
    notionRequest,
    isAuthenticated: isConnected && !!credentials 
  };
}