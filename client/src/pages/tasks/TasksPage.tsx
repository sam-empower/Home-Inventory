import { useState } from "react";
import { useNotion } from "@/context/NotionContext";
import { AppHeader } from "@/components/AppHeader";
import { SettingsPanel } from "@/components/SettingsPanel";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/lib/icons";

export default function TasksPage() {
  const { isConnected, isLoading: isConnectionLoading, refresh: refreshConnection } = useNotion();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("maintenance");

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
        {/* Tasks Header Section */}
        <div className="relative rounded-lg overflow-hidden mb-6 shadow-md h-40">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/70 to-indigo-700/70 z-10"></div>
          <div className="bg-gray-800 h-full">
            {/* Task image would go here */}
          </div>
          <div className="absolute inset-0 z-20 flex flex-col justify-end text-white p-6">
            <div className="flex items-center mb-2">
              <Icons.clipboardList className="h-6 w-6 mr-2" />
              <h1 className="text-2xl font-bold">Tasks</h1>
            </div>
            <p className="text-sm opacity-90">Manage recurring maintenance and one-time projects</p>
          </div>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="maintenance" className="mt-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          
          <TabsContent value="maintenance" className="mt-4">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <Icons.calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Recurring Maintenance
                </CardTitle>
                <CardDescription>
                  Schedule and track recurring home maintenance tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample maintenance tasks */}
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                        <Icons.calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-medium">Replace Air Filters</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Due in 5 days</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Quarterly
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3">
                        <Icons.calendar className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                      </div>
                      <div>
                        <h3 className="font-medium">Clean Gutters</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Due in 2 weeks</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Seasonal
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                        <Icons.calendar className="h-5 w-5 text-green-600 dark:text-green-300" />
                      </div>
                      <div>
                        <h3 className="font-medium">Lawn Equipment Maintenance</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Due in 3 weeks</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      Seasonal
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Next upcoming task: Replace Air Filters (3 days)
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="projects" className="mt-4">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <Icons.layers className="w-5 h-5 mr-2 text-indigo-600" />
                  Home Projects
                </CardTitle>
                <CardDescription>
                  Manage your one-time home improvement projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample projects */}
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                        <Icons.list className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div>
                        <h3 className="font-medium">Kitchen Renovation</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">5 tasks remaining</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      In Progress
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                        <Icons.list className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div>
                        <h3 className="font-medium">Backyard Landscaping</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Planning phase</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Planned
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total projects: 2 (1 active, 1 planned)
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
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