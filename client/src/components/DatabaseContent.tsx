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
  boxOptions?: Record<string, string>;  // Added box options mapping
}

export function DatabaseContent({ 
  items, 
  isLoading, 
  isRefetching,
  onItemClick,
  boxOptions = {} 
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="bg-white dark:bg-gray-800 shadow-sm max-w-[200px]">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-3/4 mb-2" />
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <DatabaseItemCard key={item.id} item={item} onClick={onItemClick} getStatusColor={getStatusColor} />
          ))}
        </div>
      </div>
    );
  }

  // Regular content
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
  boxOptions?: Record<string, string>;
}

function DatabaseItemCard({ item, onClick, getStatusColor, boxOptions = {} }: DatabaseItemCardProps) {
  // Get first image if available
  const hasImage = !!(item.images && item.images.length > 0);
  const firstImage = hasImage ? item.images![0] : null;
  
  // Room and box information
  const roomName = item.roomName || 'No location';
  const hasBoxes = item.boxIds && item.boxIds.length > 0;
  
  // Get box name from boxOptions if available
  let boxName = 'Storage Box'; // Default value
  if (hasBoxes && item.boxIds.length > 0) {
    const boxId = item.boxIds[0]; // Get the first box ID
    if (boxOptions[boxId]) {
      boxName = boxOptions[boxId]; // Use the box name from options
    }
  }
  
  return (
    <Card 
      className="ios-card bg-white dark:bg-gray-800 shadow hover:shadow-md transition transform active:scale-[0.99] overflow-hidden mb-3 max-w-[200px] mx-auto"
      onClick={() => onClick(item.id)}
    >
      {hasImage && (
        <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <img 
            src={firstImage!.url} 
            alt={item.title || 'Item image'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide the image on error
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          
          {/* iOS-style image overlay gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
        </div>
      )}
      
      <CardContent className={`p-4 ${hasImage ? '' : 'pt-4'}`}>
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-1">
            {item.title || 'Untitled'}
          </h3>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-1">
          {roomName !== 'No location' && (
            <Badge className="ios-badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 px-2 py-0.5 text-xs">
              {roomName}
            </Badge>
          )}
          
          {hasBoxes && (
            <Badge className="ios-badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0 px-2 py-0.5 text-xs">
              <Icons.database className="h-2.5 w-2.5 mr-1 inline-block" />
              {boxName}
            </Badge>
          )}
        </div>
        
        {item.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
            {item.description}
          </p>
        )}
        
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end">
          {hasImage && (
            <div className="flex items-center mr-auto">
              <Icons.file className="h-3 w-3 text-primary mr-1" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Photo
              </span>
            </div>
          )}
          
          {/* iOS-style chevron indicator */}
          <div className="h-4 w-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Icons.plus className="h-2.5 w-2.5 text-gray-500 dark:text-gray-400 rotate-45" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
