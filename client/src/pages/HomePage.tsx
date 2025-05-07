import { useState, useEffect, useCallback } from "react";
import { useNotion } from "@/context/NotionContext";
import { useNotionDatabase, useNotionDatabaseItem } from "@/hooks/useNotionDatabase";
import { useSettings } from "@/hooks/useSettings";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { AppHeader } from "@/components/AppHeader";
import { ConnectionSetup } from "@/components/ConnectionSetup";
import { SearchAndFilter, FilterOption } from "@/components/SearchAndFilter";
import { DatabaseContent } from "@/components/DatabaseContent";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { SettingsPanel } from "@/components/SettingsPanel";
import { BottomNavigation } from "@/components/BottomNavigation";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function HomePage() {
  const { isConnected } = useNotion();
  const { settings } = useSettings();
  const [showConnectionSetup, setShowConnectionSetup] = useState(!isConnected);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string | null>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Sample filter options (will be populated from database schema)
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([
    { id: "status", type: "status", name: "Status", value: null, available: ["All", "In Progress", "Completed", "Planning"] },
    { id: "priority", type: "priority", name: "Priority", value: "High", available: ["All", "High", "Medium", "Low"] },
    { id: "dueDate", type: "date", name: "Due Date", value: null, available: [] },
    { id: "assignedTo", type: "person", name: "Assigned To", value: null, available: [] },
  ]);
  
  // Fetch database data with search and filters
  const { 
    data: items, 
    isLoading, 
    isRefetching,
    refreshData 
  } = useNotionDatabase({
    search: searchTerm,
    filters: filters
  });
  
  // Fetch detail for selected item
  const { 
    data: selectedItem,
    isLoading: isItemLoading 
  } = useNotionDatabaseItem(selectedItemId);
  
  // Auto-refresh setup
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (isConnected && settings.autoRefresh) {
      intervalId = window.setInterval(() => {
        refreshData();
      }, settings.refreshInterval * 1000);
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, settings.autoRefresh, settings.refreshInterval, refreshData]);
  
  // Pull-to-refresh setup
  useEffect(() => {
    let touchStartY = 0;
    const pullThreshold = 80;
    let isPulling = false;
    let indicator: HTMLDivElement | null = null;
    
    const createIndicator = () => {
      if (indicator) return;
      
      indicator = document.createElement('div');
      indicator.className = 'fixed top-0 left-0 right-0 h-16 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transform -translate-y-full transition-transform z-50';
      indicator.innerHTML = `
        <div class="flex items-center">
          <svg class="mr-2 h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span class="text-sm font-medium">Release to refresh</span>
        </div>
      `;
      document.body.appendChild(indicator);
    };
    
    const removeIndicator = () => {
      if (indicator) {
        document.body.removeChild(indicator);
        indicator = null;
      }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh at the top of the page
      if (window.scrollY <= 0) {
        createIndicator();
        touchStartY = e.touches[0].clientY;
        isPulling = true;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || !indicator) return;
      
      const touchY = e.touches[0].clientY;
      const pullDistance = touchY - touchStartY;
      
      if (pullDistance > 0 && pullDistance < pullThreshold) {
        const translateY = Math.round(pullDistance - pullThreshold);
        indicator.style.transform = `translateY(${translateY}px)`;
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isPulling || !indicator) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const pullDistance = touchEndY - touchStartY;
      
      if (pullDistance > pullThreshold) {
        // Trigger refresh
        refreshData();
      }
      
      // Reset indicator position
      indicator.style.transform = 'translateY(-100%)';
      
      // Remove indicator after animation
      setTimeout(removeIndicator, 300);
      isPulling = false;
    };
    
    // Only add event listeners if connected
    if (isConnected) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      removeIndicator();
    };
  }, [isConnected, refreshData]);
  
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);
  
  const handleFilter = useCallback((newFilters: Record<string, string | null>) => {
    setFilters(newFilters);
  }, []);
  
  const handleItemClick = useCallback((id: string) => {
    setSelectedItemId(id);
  }, []);
  
  const handleCloseItemDetail = useCallback(() => {
    setSelectedItemId(null);
  }, []);
  
  useEffect(() => {
    // Show connection setup if not connected
    setShowConnectionSetup(!isConnected);
  }, [isConnected]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <AppHeader 
        onRefreshData={refreshData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isRefreshing={isRefetching}
      />
      
      <main className="flex-1 container mx-auto px-4 py-4 pb-20">
        {isConnected && (
          <>
            <SearchAndFilter 
              onSearch={handleSearch}
              onFilter={handleFilter}
              filterOptions={filterOptions}
            />
            
            <DatabaseContent 
              items={items}
              isLoading={isLoading}
              isRefetching={isRefetching}
              onItemClick={handleItemClick}
            />
          </>
        )}
        
        {!isConnected && !showConnectionSetup && (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">Connect to Notion</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-2 max-w-xs mb-4">
              Connect to your Notion workspace to access your databases
            </p>
            <button 
              className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              onClick={() => setShowConnectionSetup(true)}
            >
              Connect
            </button>
          </div>
        )}
      </main>
      
      <ConnectionSetup 
        isOpen={showConnectionSetup}
        onClose={() => setShowConnectionSetup(false)}
      />
      
      <ItemDetailModal 
        isOpen={!!selectedItemId}
        onClose={handleCloseItemDetail}
        item={selectedItem}
        isLoading={isItemLoading}
      />
      
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onShowConnectionSetup={() => setShowConnectionSetup(true)}
      />
      
      <BottomNavigation />
      
      <InstallPrompt />
    </div>
  );
}
