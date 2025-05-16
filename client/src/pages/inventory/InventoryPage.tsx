import { useState, useEffect } from "react";
import { useNotion } from "@/context/NotionContext";
import { AppHeader } from "@/components/AppHeader";
import { SettingsPanel } from "@/components/SettingsPanel";
import { BottomNavigation } from "@/components/BottomNavigation";
import { SearchAndFilter, FilterOption } from "@/components/SearchAndFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotionRooms } from "@/hooks/useNotionRooms";
import { Icons } from "@/lib/icons";

export default function InventoryPage() {
  const { isConnected, isLoading: isConnectionLoading, refresh: refreshConnection } = useNotion();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string | null>>({});

  // Initial filter options
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([
    { 
      id: "room", 
      type: "room", 
      name: "Room", 
      value: null, 
      available: ['All']
    },
  ]);

  // Fetch rooms directly from the Notion Rooms database
  const { 
    data: rooms = [], 
    isLoading: isLoadingRooms,
    isError: isRoomsError,
    refetch: refetchRooms
  } = useNotionRooms();

  // Force refresh rooms data when component mounts
  useEffect(() => {
    console.log('Refreshing rooms data...');
    refetchRooms();
  }, [refetchRooms]);

  // Log rooms data for debugging
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      console.log('Rooms loaded from Notion:', rooms.map(r => r.name).join(', '));
    }
    if (isRoomsError) {
      console.error('Error loading rooms from Notion');
    }
  }, [rooms, isRoomsError]);

  // Update room filter options when rooms data is loaded
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      // Extract room names and sort them alphabetically
      const roomNames = rooms.map(room => room.name).sort();
      
      // Update filter options for rooms
      setFilterOptions(current => {
        return current.map(filter => {
          if (filter.id === 'room') {
            return {
              ...filter,
              available: ['All', ...roomNames]
            };
          }
          return filter;
        });
      });
    }
  }, [rooms]);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    // Refresh both the connection and the rooms data
    await Promise.all([
      refreshConnection(),
      refetchRooms()
    ]);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  const handleFilter = (newFilters: Record<string, string | null>) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <AppHeader 
        onRefreshData={handleRefreshData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isRefreshing={isRefreshing}
      />
      
      <main className="flex-1 container mx-auto px-4 py-4 pb-20 pt-16">
        {/* Room Header Section */}
        <div className="relative rounded-lg overflow-hidden mb-6 shadow-md h-48">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary-dark/70 z-10"></div>
          <div className="bg-gray-800 h-full">
            {/* Room image would go here */}
          </div>
          <div className="absolute inset-0 z-20 flex flex-col justify-end text-white p-6">
            <div className="flex items-center mb-2">
              <Icons.packageOpen className="h-6 w-6 mr-2" />
              <h1 className="text-2xl font-bold">Inventory</h1>
            </div>
            <p className="text-sm opacity-90">Browse and manage your home inventory by room</p>
          </div>
        </div>

        {/* Search and Filter */}
        <SearchAndFilter 
          onSearch={handleSearch}
          onFilter={handleFilter}
          filterOptions={filterOptions}
        />

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {(!isLoadingRooms && rooms.length > 0) ? (
            rooms.map(room => (
              <Card key={room.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-24 bg-gray-200 dark:bg-gray-800 relative">
                  {/* Room image would go here */}
                  <div className="absolute bottom-0 right-0 bg-primary p-2 text-white text-xs font-medium">
                    {/* Use room property that exists or default to 0 */}
                    {(room as any).itemCount || 0} items
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>{room.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {/* Use room property that exists or default to a message */}
                    {(room as any).description || "No description available"}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            // Loading or empty state
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-48 animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-gray-800"></div>
                <CardHeader className="pb-2">
                  <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* Not connected state */}
        {!isConnected && (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Icons.alert className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              {isConnectionLoading ? "Connecting to Notion..." : "Connection Error"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-2 max-w-xs mb-4">
              {isConnectionLoading 
                ? "Please wait while we connect to your Notion database" 
                : "Unable to connect to the Notion database. Please check the server configuration."}
            </p>
            {!isConnectionLoading && (
              <button 
                className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                onClick={() => refreshConnection()}
              >
                Retry connection
              </button>
            )}
          </div>
        )}
      </main>
      
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onShowConnectionSetup={() => {}}
      />
      
      <BottomNavigation />
    </div>
  );
}