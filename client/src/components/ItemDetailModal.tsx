import { Fragment } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/lib/icons";
import { NotionDatabaseItem } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: NotionDatabaseItem | null;
  isLoading: boolean;
}

export function ItemDetailModal({ isOpen, onClose, item, isLoading }: ItemDetailModalProps) {
  // Get status badge color
  const getStatusColor = (status: string | undefined) => {
    if (!status) return "default";
    
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
      return "default";
    }
  };
  
  // Map status color to badge variant
  const getBadgeVariant = (color: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (color) {
      case "green": return "default";
      case "yellow": return "secondary";
      case "red": return "destructive";
      default: return "outline";
    }
  };

  const openInNotion = () => {
    if (item?.url) {
      window.open(item.url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        {isLoading || !item ? (
          <LoadingDetailContent />
        ) : (
          <Fragment>
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <DialogTitle className="text-lg font-medium text-gray-900 dark:text-white">
                  {item.title}
                </DialogTitle>
                <Badge variant={getBadgeVariant(getStatusColor(item.status))}>
                  {item.status}
                </Badge>
              </div>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {item.description}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned To</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {item.assignedTo}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {item.priority || 'Not set'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {item.category || 'Not set'}
                  </p>
                </div>
              </div>
              
              {item.attachments && item.attachments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</h4>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {item.attachments.map((attachment, index) => (
                      <a 
                        key={index} 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <Icons.file className="h-4 w-4 mr-2 text-blue-500" />
                        <span>{attachment.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={openInNotion}>
                Open in Notion
              </Button>
            </DialogFooter>
          </Fragment>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LoadingDetailContent() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-5 w-20" />
      </div>
      
      <div className="mt-4 space-y-4">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full mt-1" />
          <Skeleton className="h-4 w-3/4 mt-1" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
