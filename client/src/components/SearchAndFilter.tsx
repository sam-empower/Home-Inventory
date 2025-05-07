import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";

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

  const toggleFilter = (filter: FilterOption) => {
    setActiveFilters(current => {
      const newFilters = { ...current };
      
      if (newFilters[filter.id] === filter.value) {
        // If the same value is already selected, remove it
        newFilters[filter.id] = null;
      } else {
        // Otherwise, set the value
        newFilters[filter.id] = filter.value;
      }
      
      onFilter(newFilters);
      return newFilters;
    });
  };

  const isFilterActive = (filter: FilterOption) => {
    return activeFilters[filter.id] === filter.value;
  };

  return (
    <div className="mb-4 sticky top-14 z-20 bg-gray-50 dark:bg-gray-900 pt-2 pb-3">
      <div className="flex flex-col space-y-3">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search in database..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2"
          />
          <Icons.search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-hide">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filters:</span>
          
          {filterOptions.map((filter) => (
            <Button
              key={`${filter.id}-${filter.value}`}
              variant={isFilterActive(filter) ? "outline" : "ghost"}
              size="sm"
              className={`
                px-3 py-1 text-xs rounded-full whitespace-nowrap h-7
                ${isFilterActive(filter) 
                  ? "border-primary-300 bg-primary-50 dark:bg-primary-900 dark:border-primary-700 text-primary-700 dark:text-primary-300" 
                  : "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}
              `}
              onClick={() => toggleFilter(filter)}
            >
              {filter.name}: {filter.value || "All"}
            </Button>
          ))}
          
          <Button
            variant="outline" 
            size="sm"
            className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-0 min-w-0"
          >
            <Icons.plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
