// @ts-nocheck - Will be addressed in T-176b
import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  type ChangeEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

// @ts-expect-error TODO(T-176b) - Add type declarations for UI components
import { Button } from '@/components/ui/button';
// @ts-expect-error TODO(T-176b) - Add type declarations for UI components
import { Input } from '@/components/ui/input';
// @ts-expect-error TODO(T-176b) - Add type declarations for UI components
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { debounce } from '@/lib/utils/debounce';

interface TemplateSearchBarProps {
  initialSearch?: string;
  initialFilterMine?: boolean;
  onSearchChange?: (q: string) => void;
  onFilterChange?: (mine: boolean) => void;
}

const TemplateSearchBar = forwardRef<HTMLDivElement, TemplateSearchBarProps>(
  (
    {
      initialSearch = '',
      initialFilterMine = false,
      onSearchChange,
      onFilterChange,
    },
    ref,
  ) => {
    const router = useRouter();
    const [searchText, setSearchText] = useState(initialSearch);
    const [filterMine, setFilterMine] = useState(initialFilterMine);

    /** sync component state → query-string */
    const updateQueryParams = useCallback(() => {
      const params = new URLSearchParams(window.location.search);

      searchText ? params.set('q', searchText) : params.delete('q');
      filterMine ? params.set('mine', 'true') : params.delete('mine');
      params.set('page', '1');

      router.push(`${window.location.pathname}?${params.toString()}`);

      onSearchChange?.(searchText);
      onFilterChange?.(filterMine);
    }, [searchText, filterMine, router, onSearchChange, onFilterChange]);

    /** debounce expensive URL churn */
    const debouncedUpdate = debounce(updateQueryParams, 300);

    useEffect(() => debouncedUpdate(), [searchText, debouncedUpdate]);
    useEffect(() => updateQueryParams(), [filterMine, updateQueryParams]);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) =>
      setSearchText(e.target.value);

    const handleFilterChange = (value: string) =>
      setFilterMine(value === 'mine');

    const handleClearSearch = () => setSearchText('');

    return (
      <div
        ref={ref}
        className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 w-full mb-6"
      >
        {/* search box */}
        <div className="relative flex-1">
          <Input
            data-testid="template-search-input"
            type="text"
            placeholder="Search templates…"
            value={searchText}
            onChange={handleSearchChange}
            className="pl-10 pr-10 h-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          {searchText && (
            <Button
              data-testid="clear-search"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* filter tabs */}
        <Tabs
          defaultValue={filterMine ? 'mine' : 'all'}
          onValueChange={handleFilterChange}
          className="w-full md:w-auto"
        >
          <TabsList>
            <TabsTrigger data-testid="filter-all" value="all">
              All
            </TabsTrigger>
            <TabsTrigger data-testid="filter-mine" value="mine">
              Mine
            </TabsTrigger>
            <TabsTrigger data-testid="filter-public" value="public">
              Public
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    );
  },
);

TemplateSearchBar.displayName = 'TemplateSearchBar';
export default TemplateSearchBar;
