'use client'
// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface TemplateSearchBarProps {
  initialSearch?: string;
  initialFilterMine?: boolean;
  onSearchChange?: (q: string) => void;
  onFilterChange?: (mine: boolean) => void;
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
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
        <input
          type="text"
          placeholder="Search templates..."
          value={searchText}
          onChange={handleSearchChange}
          className="w-full h-10 pl-10 pr-10 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          data-testid="template-search-input"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        {searchText && (
          <button
            className="absolute right-1 top-1 h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleClearSearch}
            data-testid="clear-search"
          >
            <X className="h-4 w-4 mx-auto" />
          </button>
        )}
      </div>
      
      <div className="w-full md:w-auto">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <button
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              !filterMine && filterMine !== undefined
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-background/50"
            }`}
            onClick={() => handleFilterChange('all')}
            data-testid="filter-all"
          >
            All
          </button>
          <button
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              filterMine
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-background/50"
            }`}
            onClick={() => handleFilterChange('mine')}
            data-testid="filter-mine"
          >
            Mine
          </button>
          <button
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:bg-background/50`}
            onClick={() => handleFilterChange('public')}
            data-testid="filter-public"
          >
            Public
          </button>
        </div>
      </div>
    </div>
  );
}
