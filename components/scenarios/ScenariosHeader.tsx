import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { ScenarioType } from '@/lib/hooks/scenarios';

interface ScenariosHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: ScenarioType | 'ALL';
  onTypeFilterChange: (value: ScenarioType | 'ALL') => void;
  onCreateClick: () => void;
  isCreating?: boolean;
}

export function ScenariosHeader({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onCreateClick,
  isCreating = false,
}: ScenariosHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scenarios</h1>
        <Button
          onClick={onCreateClick}
          disabled={isCreating}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? 'Creating...' : 'Create Scenario'}
        </Button>
      </div>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search scenarios..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as ScenarioType | 'ALL')}
          className="w-[180px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="ALL">All Types</option>
          <option value="TECHNOLOGY">Technology</option>
          <option value="ECONOMIC">Economic</option>
          <option value="GEOPOLITICAL">Geopolitical</option>
        </select>
      </div>
    </div>
  );
} 