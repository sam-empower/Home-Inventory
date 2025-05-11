import { useState } from "react";
import { useNotion } from "@/context/NotionContext";
import { AppHeader } from "@/components/AppHeader";
import { SettingsPanel } from "@/components/SettingsPanel";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/lib/icons";

export default function ExpensesPage() {
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
      
      <main className="flex-1 container mx-auto px-4 py-4 pb-20 pt-16">
        {/* Expenses Header Section */}
        <div className="relative rounded-lg overflow-hidden mb-6 shadow-md h-40">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/70 to-emerald-700/70 z-10"></div>
          <div className="bg-gray-800 h-full">
            {/* Expense image would go here */}
          </div>
          <div className="absolute inset-0 z-20 flex flex-col justify-end text-white p-6">
            <div className="flex items-center mb-2">
              <Icons.wallet className="h-6 w-6 mr-2" />
              <h1 className="text-2xl font-bold">Expenses</h1>
            </div>
            <p className="text-sm opacity-90">Track and manage your home-related expenses</p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <Icons.wallet className="w-5 h-5 mr-2 text-green-600" />
              Expense Summary
            </CardTitle>
            <CardDescription>Year to date spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold">$2,345.00</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total YTD</p>
              </div>
            </div>
            
            {/* Budget Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Year to Date</span>
                <span>$2,345 / $3,600</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex justify-end text-xs mt-1 text-gray-500">
                <span>65% of annual budget</span>
              </div>
            </div>
            
            {/* Expense Categories */}
            <div className="space-y-3 mt-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Maintenance</span>
                  <span>$850.00</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Utilities</span>
                  <span>$720.00</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Improvements</span>
                  <span>$495.00</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Other</span>
                  <span>$280.00</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full">
                  <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Expenses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                    <Icons.settings className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-medium">HVAC Repair</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">May 2, 2025</p>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  $245.00
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                    <Icons.bolt className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <h3 className="font-medium">Electricity Bill</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">April 15, 2025</p>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  $142.50
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3">
                    <Icons.hammer className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-medium">New Shelving</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">April 10, 2025</p>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  $87.25
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <button className="text-sm text-primary hover:underline">
              View all expenses →
            </button>
          </CardFooter>
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
      
      <BottomNavigation />
    </div>
  );
}