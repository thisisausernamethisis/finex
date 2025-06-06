import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, ChevronDown, FileText, Zap } from 'lucide-react';
import { ScenarioType } from '@/lib/hooks/scenarios';

interface ScenariosHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: ScenarioType | 'ALL';
  onTypeFilterChange: (value: ScenarioType | 'ALL') => void;
  onCreateClick: () => void;
  onQuickCreateClick?: () => void;
  totalScenarios?: number;
  isCreating?: boolean;
}

export function ScenariosHeader({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onCreateClick,
  onQuickCreateClick,
  totalScenarios = 0,
  isCreating = false,
}: ScenariosHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Scenario Planning</h1>
            <Badge variant="secondary" className="text-xs">
              Phase 2: Scenario Planning
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              {totalScenarios} scenarios for future impact analysis
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? 'Creating...' : 'Add Scenario'}
              <ChevronDown className="w-3 h-3 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCreateClick}>
              <FileText className="w-4 h-4 mr-2" />
              From FileText
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onQuickCreateClick}>
              <Zap className="w-4 h-4 mr-2" />
              Quick Create
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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