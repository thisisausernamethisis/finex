// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { debounce } from '@/lib/utils/debounce';

interface TemplateSearchBarProps {
  initialSearch?: string;
  initialFilterMine?: boolean;
  onSearchChange?: (q: string) => void;
  onFilterChange?: (mine: boolean) => void;
}

export function TemplateSearchBar({
  initialSearch = '',
  initialFilterMine = false,
  onSearchChange,
  onFilterChange
}: TemplateSearchBarProps) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(initialSearch);
  const [filterMine, setFilterMine] = useState(initialFilterMine);
  
  // Sync URL parameters with component state
  const updateQueryParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Update search query parameter
    if (searchText) {
      params.set('q', searchText);
    } else {
      params.delete('q');
    }
    
    // Update mine filter parameter
    if (filterMine) {
      params.set('mine', 'true');
    } else {
      params.delete('mine');
    }
    
    // Reset to page 1 when search/filter changes
    params.set('page', '1');
    
    // Update URL
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl);
    
    // Notify parent components of changes
    if (onSearchChange) onSearchChange(searchText);
    if (onFilterChange) onFilterChange(filterMine);
  }, [searchText, filterMine, router, onSearchChange, onFilterChange]);
  
  // Debounce search to avoid too many URL updates
  const debouncedUpdateQueryParams = debounce(updateQueryParams, 300);
  
  // Update on search text change
  useEffect(() => {
    debouncedUpdateQueryParams();
  }, [searchText, debouncedUpdateQueryParams]);
  
  // Update immediately on filter change
  useEffect(() => {
    updateQueryParams();
  }, [filterMine, updateQueryParams]);
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  
  // Handle filter changes
  const handleFilterChange = (value: string) => {
    setFilterMine(value === 'mine');
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchText('');
  };
  
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center w-full mb-6">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search templates..."
          value={searchText}
          onChange={handleSearchChange}
          className="pl-10 pr-10 h-10"
          data-testid="template-search-input"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        {searchText && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-8 w-8"
            onClick={handleClearSearch}
            data-testid="clear-search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div>
        <Tabs
          defaultValue={filterMine ? 'mine' : 'all'}
          onValueChange={handleFilterChange}
          className="w-full md:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all" data-testid="filter-all">
              All
            </TabsTrigger>
            <TabsTrigger value="mine" data-testid="filter-mine">
              Mine
            </TabsTrigger>
            <TabsTrigger value="public" data-testid="filter-public">
              Public
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
