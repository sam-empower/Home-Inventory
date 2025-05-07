import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface FilterOption {
  id: string;
  type: string;
  name: string;
  value: string[] | null;
  available: string[];
}

interface SearchAndFilterProps {
  onSearch: (term: string) => void;
  onFilter: (filters: Record<string, string | null>) => void;
  filterOptions: FilterOption[];
}

export function SearchAndFilter({ onSearch, onFilter, filterOptions }: SearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Trigger search when debounced value changes
  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  // Convert multi-select filters to server format
  useEffect(() => {
    const serverFilters: Record<string, string | null> = {};
    
    // Process each filter for the server
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        // We'll use the first value for now, since server just needs one
        // For box filter, we need to find the boxId that corresponds to the name
        if (key === 'box') {
          // For now we use the first selected box only
          serverFilters[key] = values[0];
        } else if (key === 'room') {
          // For room filter, use the exact room name
          serverFilters[key] = values[0];
        } else {
          serverFilters[key] = values[0];
        }
      } else {
        serverFilters[key] = null;
      }
    });
    
    onFilter(serverFilters);
  }, [activeFilters, onFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectAll = (filterId: string, isSelected: boolean) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (isSelected) {
        // Clear selections for this filter
        newFilters[filterId] = [];
      } else {
        // Get all available options except "All"
        const filter = filterOptions.find(f => f.id === filterId);
        if (filter) {
          const allOptions = filter.available.filter(opt => opt !== "All");
          newFilters[filterId] = [...allOptions];
        }
      }
      return newFilters;
    });
  };

  const handleFilterSelect = (filterId: string, value: string, isChecked: boolean) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      // Initialize array if it doesn't exist
      if (!newFilters[filterId]) {
        newFilters[filterId] = [];
      }
      
      // Handle selection/deselection
      if (isChecked) {
        // Add to selections if not already included
        if (!newFilters[filterId].includes(value)) {
          newFilters[filterId] = [...newFilters[filterId], value];
        }
      } else {
        // Remove from selections
        newFilters[filterId] = newFilters[filterId].filter(v => v !== value);
      }
      
      return newFilters;
    });
  };

  const getFilterDisplayValue = (filter: FilterOption) => {
    const values = activeFilters[filter.id];
    
    if (!values || values.length === 0) {
      return "All";
    } else if (values.length === 1) {
      return values[0];
    } else {
      return `${values.length} selected`;
    }
  };

  const getFilterStyles = (filter: FilterOption) => {
    const values = activeFilters[filter.id];
    const isActive = values && values.length > 0;
    
    if (isActive) {
      return "border-primary bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-foreground";
    }
    return "border border-border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  };

  return (
    <div className="mb-4 sticky top-14 z-20 bg-background pt-2 pb-3">
      <div className="flex flex-col space-y-3">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-100/80 dark:bg-gray-800/80 focus-visible:ring-2 focus-visible:ring-primary placeholder:text-gray-500"
          />
          <Icons.search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-hide">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filters:</span>
          
          {filterOptions.map((filter) => (
            <Popover 
              key={filter.id} 
              open={openFilterId === filter.id}
              onOpenChange={(open) => {
                if (open) {
                  setOpenFilterId(filter.id);
                } else if (openFilterId === filter.id) {
                  setOpenFilterId(null);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`
                    px-3 py-1 text-xs rounded-full whitespace-nowrap h-7
                    ${getFilterStyles(filter)}
                  `}
                >
                  {filter.name}: {getFilterDisplayValue(filter)}
                  <Icons.plus className="h-3 w-3 ml-1 rotate-45 transition-transform" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0 ios-modal border-none overflow-hidden">
                <div className="bg-primary p-3 text-white">
                  <h3 className="text-sm font-semibold">Select {filter.name}</h3>
                </div>
                <div className="p-3 space-y-1">
                  <div className="ios-list-item rounded-t-lg">
                    <Checkbox 
                      id={`${filter.id}-all`} 
                      checked={!activeFilters[filter.id] || activeFilters[filter.id]?.length === 0}
                      onCheckedChange={(checked) => handleSelectAll(filter.id, !!checked)}
                      className="text-primary"
                    />
                    <Label htmlFor={`${filter.id}-all`} className="pl-2 text-sm font-medium w-full cursor-pointer">
                      All
                    </Label>
                  </div>
                  
                  {filter.available.filter(item => item !== "All").map((option) => {
                    const isSelected = activeFilters[filter.id]?.includes(option) || false;
                    return (
                      <div key={option} className="ios-list-item last:rounded-b-lg">
                        <Checkbox 
                          id={`${filter.id}-${option}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleFilterSelect(filter.id, option, !!checked)}
                          className="text-primary"
                        />
                        <Label htmlFor={`${filter.id}-${option}`} className="pl-2 text-sm font-medium w-full cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenFilterId(null)}
                      className="text-xs rounded-full px-3"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>
    </div>
  );
}
