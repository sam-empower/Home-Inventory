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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface FilterOption {
  id: string;
  type: string;
  name: string;
  value: string | null;
  available: string[];
}

interface SearchAndFilterProps {
  onSearch: (term: string) => void;
  onFilter: (filters: Record<string, string | null>) => void;
  filterOptions: FilterOption[];
}

export function SearchAndFilter({ onSearch, onFilter, filterOptions }: SearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string | null>>({});
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterSelect = (filterId: string, value: string | null) => {
    setActiveFilters(current => {
      const newFilters = { ...current };
      
      if (value === "All") {
        // If "All" is selected, remove the filter
        newFilters[filterId] = null;
      } else {
        // Otherwise, set the value
        newFilters[filterId] = value;
      }
      
      onFilter(newFilters);
      return newFilters;
    });
    
    // Close the popover after selection
    setOpenFilterId(null);
  };

  const getFilterDisplayValue = (filter: FilterOption) => {
    const value = activeFilters[filter.id];
    return value || "All";
  };

  const getFilterStyles = (filter: FilterOption) => {
    const isActive = activeFilters[filter.id] !== null && activeFilters[filter.id] !== undefined;
    
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
            className="pl-10 pr-4 py-2 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-primary"
          />
          <Icons.search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
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
                <div className="p-3">
                  <RadioGroup 
                    value={activeFilters[filter.id] || "All"}
                    onValueChange={(value) => handleFilterSelect(filter.id, value === "All" ? null : value)}
                    className="space-y-1"
                  >
                    <div className="ios-list-item rounded-t-lg">
                      <RadioGroupItem value="All" id={`${filter.id}-all`} className="text-primary" />
                      <Label htmlFor={`${filter.id}-all`} className="pl-2 text-sm font-medium">
                        All
                      </Label>
                    </div>
                    {filter.available.filter(item => item !== "All").map((option) => (
                      <div key={option} className="ios-list-item last:rounded-b-lg">
                        <RadioGroupItem value={option} id={`${filter.id}-${option}`} className="text-primary" />
                        <Label htmlFor={`${filter.id}-${option}`} className="pl-2 text-sm font-medium">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>
    </div>
  );
}
