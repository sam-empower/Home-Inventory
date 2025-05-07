import React, { createContext, useState, useEffect, useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotionCredentials {
  integrationToken: string;
  databaseId: string;
}

interface NotionContextType {
  isConnected: boolean;
  credentials: NotionCredentials | null;
  connect: (credentials: NotionCredentials, saveCredentials?: boolean) => Promise<boolean>;
  disconnect: () => void;
  databaseInfo: any | null;
}

const NotionContext = createContext<NotionContextType | undefined>(undefined);

export const NotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [credentials, setCredentials] = useState<NotionCredentials | null>(null);
  const [databaseInfo, setDatabaseInfo] = useState<any | null>(null);
  const { toast } = useToast();

  // Check for saved credentials on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('notionCredentials');
    
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials) as NotionCredentials;
        
        // Auto-connect with saved credentials
        connect(parsed, true).catch(() => {
          // If reconnection fails, clear saved credentials
          localStorage.removeItem('notionCredentials');
        });
      } catch (error) {
        console.error("Error parsing saved credentials:", error);
        localStorage.removeItem('notionCredentials');
      }
    }
  }, []);

  const connect = async (newCredentials: NotionCredentials, saveCredentials: boolean = false): Promise<boolean> => {
    try {
      // Validate credentials with the server
      const response = await apiRequest('POST', '/api/notion/connect', newCredentials);
      const data = await response.json();
      
      setCredentials(newCredentials);
      setIsConnected(true);
      setDatabaseInfo(data.database);
      
      if (saveCredentials) {
        localStorage.setItem('notionCredentials', JSON.stringify(newCredentials));
      }
      
      toast({
        title: "Connected to Notion",
        description: `Connected to database: ${data.database.title}`,
      });
      
      return true;
    } catch (error) {
      console.error("Failed to connect to Notion:", error);
      
      // Extract the error message
      let errorMessage = "Could not connect to Notion";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for specific error messages and provide better guidance
      if (errorMessage.includes("API token is invalid")) {
        toast({
          variant: "destructive",
          title: "Invalid API Token",
          description: "The integration token provided is not valid. Make sure you're using the token from your Notion integration settings.",
        });
      } else if (errorMessage.includes("Could not find database") || errorMessage.includes("shared with your integration")) {
        toast({
          variant: "destructive",
          title: "Database access error",
          description: "Make sure to share your database with your integration. Open your database, click Share, and add your integration to the access list.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: errorMessage,
        });
      }
      
      return false;
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setCredentials(null);
    setDatabaseInfo(null);
    localStorage.removeItem('notionCredentials');
    
    toast({
      title: "Disconnected",
      description: "Notion connection has been removed.",
    });
  };

  return (
    <NotionContext.Provider value={{ isConnected, credentials, connect, disconnect, databaseInfo }}>
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
