import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { NotionDatabaseItem } from "@shared/schema";

interface DatabaseContentProps {
  items: NotionDatabaseItem[] | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  onItemClick: (id: string) => void;
}

export function DatabaseContent({ 
  items, 
  isLoading, 
  isRefetching,
  onItemClick 
}: DatabaseContentProps) {
  const { isOnline, isOfflineMode } = useOfflineMode();
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('done')) {
      return "green";
    } else if (statusLower.includes('progress') || statusLower.includes('doing')) {
      return "yellow";
    } else if (statusLower.includes('planning') || statusLower.includes('todo')) {
      return "blue";
    } else if (statusLower.includes('high') || statusLower.includes('urgent')) {
      return "red";
    } else {
      return "gray";
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mb-4">
          <Icons.folder className="h-8 w-8 text-gray-500 dark:text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mt-2 max-w-xs">
          Try adjusting your search or filter to find what you're looking for.
        </p>
      </div>
    );
  }
  
  // Offline state
  if (!isOnline && isOfflineMode) {
    return (
      <div>
        <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-4 mb-4 flex items-center">
          <Icons.wifi className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">You're offline</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">Showing cached data. Connect to the internet to get the latest updates.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {items.map((item) => (
            <DatabaseItemCard key={item.id} item={item} onClick={onItemClick} getStatusColor={getStatusColor} />
          ))}
        </div>
      </div>
    );
  }

  // Regular content
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <DatabaseItemCard key={item.id} item={item} onClick={onItemClick} getStatusColor={getStatusColor} />
      ))}
    </div>
  );
}

interface DatabaseItemCardProps {
  item: NotionDatabaseItem;
  onClick: (id: string) => void;
  getStatusColor: (status: string) => string;
}

function DatabaseItemCard({ item, onClick, getStatusColor }: DatabaseItemCardProps) {
  const statusColor = getStatusColor(item.status);
  
  // Map status color to badge variant
  const getBadgeVariant = (color: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (color) {
      case "green": return "default";
      case "yellow": return "secondary";
      case "red": return "destructive";
      default: return "outline";
    }
  };
  
  return (
    <Card 
      className="bg-white dark:bg-gray-800 shadow hover:shadow-md transition transform active:scale-[0.99]"
      onClick={() => onClick(item.id)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
          <Badge variant={getBadgeVariant(statusColor)} className="px-2 py-1 text-xs font-medium">
            {item.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
          {item.description}
        </p>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <Icons.calendar className="h-3 w-3 text-gray-400 mr-1" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
            </span>
          </div>
          <div className="flex items-center">
            <Icons.user className="h-3 w-3 text-gray-400 mr-1" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.assignedTo || 'Unassigned'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
