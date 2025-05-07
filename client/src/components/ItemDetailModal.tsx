
import { Fragment } from "react";
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

  const content = (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
      {isLoading || !item ? (
        <LoadingDetailContent />
      ) : (
        <div className="space-y-6">
          {isMobile && (
            <div className="flex justify-center -mt-2 mb-4">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
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
          className="h-[65vh] rounded-t-xl shadow-lg pt-4 overflow-hidden flex flex-col"
          hideClose={true}
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
  return (
    <div className="space-y-4">
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
