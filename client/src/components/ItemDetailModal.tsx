
import { Fragment } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
    <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">ID</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {item.notionId || 'Not set'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Box</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {item.boxNames?.join(', ') || 'Not set'}
              </p>
            </div>

            <div>
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
          className="h-[65vh] rounded-t-xl shadow-lg pt-4"
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
        {content}
      </DialogContent>
    </Dialog>
  );
}

function LoadingDetailContent() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" /> {/* Image skeleton */}
      <Skeleton className="h-6 w-1/2" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
