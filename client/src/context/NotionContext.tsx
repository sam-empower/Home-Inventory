import React, { createContext, useState, useEffect, useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface NotionDatabase {
  id: string;
  title: string;
  lastSynced: string;
}

interface NotionContextType {
  isConnected: boolean;
  isLoading: boolean;
  databaseInfo: NotionDatabase | null;
  refresh: () => Promise<void>;
}

const NotionContext = createContext<NotionContextType | undefined>(undefined);

export const NotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [databaseInfo, setDatabaseInfo] = useState<NotionDatabase | null>(null);
  const { toast } = useToast();

  // Query the database info
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/notion/database-info'],
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Set connection status and database info when data changes
  useEffect(() => {
    if (data && data.success) {
      setIsConnected(true);
      setDatabaseInfo(data.database);
    } else if (isError || (data && !data.success)) {
      setIsConnected(false);
      setDatabaseInfo(null);
      
      // Only show error toast if it's not the initial load
      if (!isLoading) {
        toast({
          variant: "destructive",
          title: "Connection issue",
          description: data?.message || "Could not connect to Notion database. Please check server configuration.",
        });
      }
    }
  }, [data, isError]);

  // Refresh the connection
  const refresh = async (): Promise<void> => {
    try {
      const result = await refetch();
      
      if (result.data && result.data.success) {
        toast({
          title: "Connection refreshed",
          description: `Connected to database: ${result.data.database.title}`,
        });
      }
    } catch (error) {
      console.error("Failed to refresh Notion connection:", error);
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Could not refresh Notion connection",
      });
    }
  };

  return (
    <NotionContext.Provider 
      value={{ 
        isConnected, 
        isLoading, 
        databaseInfo, 
        refresh 
      }}
    >
      {children}
    </NotionContext.Provider>
  );
};

export const useNotion = (): NotionContextType => {
  const context = useContext(NotionContext);
  if (context === undefined) {
    throw new Error("useNotion must be used within a NotionProvider");
  }
  return context;
};
