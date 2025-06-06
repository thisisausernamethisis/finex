import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssetTheme } from '@/lib/utils/assetThemes';
import { Search, X, Filter } from 'lucide-react';

interface BoardSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  themeFilter: string;
  onThemeFilterChange: (value: string) => void;
  availableThemes: AssetTheme[];
}

export function BoardSearch({ 
  search, 
  onSearchChange, 
  themeFilter, 
  onThemeFilterChange,
  availableThemes 
}: BoardSearchProps) {
  const clearSearch = () => {
    onSearchChange('');
  };

  const clearThemeFilter = () => {
    onThemeFilterChange('ALL');
  };

  const selectedTheme = availableThemes.find(theme => theme.id === themeFilter);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search assets across all themes..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Theme Filter and Active Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={themeFilter}
            onChange={(e) => onThemeFilterChange(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[200px]"
          >
            <option value="ALL">All Themes ({availableThemes.reduce((sum, theme) => sum + theme.assets.length, 0)})</option>
            {availableThemes.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.name} ({theme.assets.length})
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Display */}
        <div className="flex items-center gap-2 flex-1">
          {search && (
            <Badge variant="secondary" className="flex items-center gap-1">
                             Search: &ldquo;{search}&rdquo;
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
          {themeFilter !== 'ALL' && selectedTheme && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Theme: {selectedTheme.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearThemeFilter}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
          {(search || themeFilter !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearSearch();
                clearThemeFilter();
              }}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 