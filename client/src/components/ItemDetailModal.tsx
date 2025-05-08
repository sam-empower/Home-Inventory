
import { useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NotionDatabaseItem } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: NotionDatabaseItem | null;
  isLoading: boolean;
}

export function ItemDetailModal({ isOpen, onClose, item, isLoading }: ItemDetailModalProps) {
  const isMobile = useIsMobile();
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const gripperRef = useRef<HTMLDivElement>(null);
  
  // Handle touch interactions for the gripper
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) {
      setIsDragging(true);
      setDragOffset(0);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && gripperRef.current) {
      const touchY = e.touches[0].clientY;
      const rect = gripperRef.current.getBoundingClientRect();
      const offset = touchY - rect.top;
      
      // Only allow downward drag (positive offset)
      if (offset > 0) {
        setDragOffset(offset);
      }
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDragging) {
      // If dragged down more than 60px, close the modal
      if (dragOffset > 60) {
        onClose();
      }
      
      // Reset state
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const content = (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
      {isLoading || !item ? (
        <LoadingDetailContent />
      ) : (
        <div className="space-y-6">
          {isMobile && (
            <div 
              className="flex flex-col items-center justify-center -mt-2 mb-4 py-2 touch-manipulation cursor-grab active:cursor-grabbing"
              ref={gripperRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ 
                transform: isDragging ? `translateY(${dragOffset}px)` : 'translateY(0)',
                transition: isDragging ? 'none' : 'transform 0.2s ease'
              }}
            >
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              {isDragging && (
                <span className="text-xs text-gray-400 mt-1 select-none">
                  Swipe down to close
                </span>
              )}
            </div>
          )}

          {item.images && item.images.length > 0 && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <img 
                src={item.images[0].url} 
                alt={item.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <h2 className="text-xl font-bold text-foreground">{item.title}</h2>

          <div className="flex flex-row justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">ID</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {item.notionId || 'Not set'}
              </p>
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Box</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {item.boxNames?.join(', ') || 'Not set'}
              </p>
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Room</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {item.roomName || 'Not set'}
              </p>
            </div>
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {item.description}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[65vh] rounded-t-3xl shadow-lg pt-4 overflow-hidden flex flex-col bg-white dark:bg-gray-900 border-0"
          hideClose={true}
          style={{
            transform: isDragging ? `translateY(${dragOffset * 0.5}px)` : undefined, // Scale the whole sheet movement but subtly
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.1, 1.0)'
          }}
        >
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" hideClose={true}>
        <DialogTitle className="sr-only">
          Item Details
        </DialogTitle>
        <DialogDescription className="sr-only">
          Detailed information about the selected item
        </DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function LoadingDetailContent() {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-4">
      {isMobile && (
        <div className="flex justify-center -mt-2 mb-4">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
      )}
      
      <Skeleton className="h-40 w-full" /> {/* Image skeleton */}
      <Skeleton className="h-6 w-1/2" /> {/* Title skeleton */}
      
      {/* ID, Box, Room row skeleton */}
      <div className="flex flex-row justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex-1">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      
      <Skeleton className="h-20 w-full" /> {/* Description skeleton */}
    </div>
  );
}
