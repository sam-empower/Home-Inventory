import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Image, FolderOpen } from "lucide-react";
import { useRoomItems } from "@/hooks/useRoomItems";
import { SearchAndFilter, FilterOption } from "@/components/SearchAndFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function RoomItemsPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId;
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string | null>>({});
  
  // Get the room name from roomId for display
  const getRoomName = (id: string) => {
    const roomNames: Record<string, string> = {
      'bedroom': 'Bedroom',
      'master-bathroom': 'Master Bathroom',
      'office': 'Office',
      'coffee-room': 'Coffee Room',
      'living-area': 'Living Area',
      'guest-suite': 'Guest Suite',
      'harry-potter-closet': 'Harry Potter Closet'
    };
    
    return roomNames[id] || 'Unknown Room';
  };
  
  // Fetch items for the selected room
  const { 
    data: items = [], 
    isLoading: isLoadingItems,
    isError: isItemsError 
  } = useRoomItems(roomId);

  // Filter options
  const [filterOptions] = useState<FilterOption[]>([
    {
      id: "type",
      type: "type",
      name: "Type", 
      value: null,
      available: ['All', 'Furniture', 'Electronics', 'Decor', 'Other']
    }
  ]);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  // Handle filter changes
  const handleFilter = (newFilters: Record<string, string | null>) => {
    setFilters(newFilters);
  };
  
  // Go back to room list
  const handleBackToRooms = () => {
    setLocation("/inventory");
  };

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    // Apply search filter
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Update item count on the page
  useEffect(() => {
    if (items) {
      console.log(`Loaded ${items.length} items for room ${roomId}`);
    }
  }, [items, roomId]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <AppHeader 
        onRefreshData={() => {}}
        onOpenSettings={() => {}}
        isRefreshing={false}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToRooms}
                className="text-white mr-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">{getRoomName(roomId || '')}</h1>
            </div>
            <p className="text-sm opacity-90">
              Browse items in this room
            </p>
          </div>
        </div>
        
        {/* Search and Filter */}
        <SearchAndFilter 
          onSearch={handleSearch}
          onFilter={handleFilter}
          filterOptions={filterOptions}
        />
        
        {/* Items Count */}
        <div className="mt-4 mb-2">
          <Badge variant="outline" className="text-sm font-normal">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        
        {/* Items Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {isLoadingItems ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={`loading-${index}`} className="h-[280px] animate-pulse">
                <div className="h-40 bg-gray-200 dark:bg-gray-800"></div>
                <CardHeader className="pb-2">
                  <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredItems.length > 0 ? (
            // Display items
            filteredItems.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                {/* Item image or placeholder */}
                <div className="h-40 bg-gray-200 dark:bg-gray-800 relative">
                  {item.image ? (
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }}></div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Image className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mt-2 max-w-xs">
                There are no items in this room, or they don't match your search criteria.
              </p>
            </div>
          )}
        </div>
      </main>
      
      <BottomNavigation currentSection="inventory" />
    </div>
  );
}