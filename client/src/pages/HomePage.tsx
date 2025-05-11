import { useState } from "react";
import { useNotion } from "@/context/NotionContext";
import { AppHeader } from "@/components/AppHeader";
import { SettingsPanel } from "@/components/SettingsPanel";
import { BottomNavigation } from "@/components/BottomNavigation";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/lib/icons";

export default function HomePage() {
  const { isConnected, isLoading: isConnectionLoading, refresh: refreshConnection } = useNotion();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await refreshConnection();
    setTimeout(() => setIsRefreshing(false), 1000); // Simulate refresh time
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <AppHeader 
        onRefreshData={handleRefreshData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isRefreshing={isRefreshing}
      />
      
      {/* Add padding-top to accommodate fixed header */}
      <main className="flex-1 container mx-auto px-4 py-4 pb-20 pt-16">
        {/* Hero Header Section */}
        <div className="relative rounded-lg overflow-hidden mb-6 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary-dark/80 z-10"></div>
          <div className="bg-gray-800 h-48"></div>
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-white p-4">
            <h1 className="text-3xl font-bold mb-2">Hopkins Home</h1>
            <p className="text-center max-w-md">Intelligent room and inventory management for your home</p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Inventory Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Icons.packageOpen className="w-4 h-4 mr-2" />
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rooms</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Boxes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">48</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Maintenance Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Icons.clipboardList className="w-4 h-4 mr-2" />
                Maintenance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Icons.wallet className="w-4 h-4 mr-2" />
              Expenses
            </CardTitle>
            <CardDescription>Year to date spending</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$2,345.00</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Budget: $3,600.00</span>
              <span>65% Used</span>
            </div>
          </CardContent>
        </Card>
        
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
      
      <InstallPrompt />
      <BottomNavigation />
    </div>
  );
}