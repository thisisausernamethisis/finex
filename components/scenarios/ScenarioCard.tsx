import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Clock, Target } from 'lucide-react';
import { Scenario } from '@/lib/hooks/scenarios';
import { formatDistanceToNow } from 'date-fns';

interface ScenarioCardProps {
  scenario: Scenario;
  onEdit: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
}

const typeColors = {
  TECHNOLOGY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ECONOMIC: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  GEOPOLITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  REGULATORY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  MARKET: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const typeLabels = {
  TECHNOLOGY: 'Technology',
  ECONOMIC: 'Economic',
  GEOPOLITICAL: 'Geopolitical',
  REGULATORY: 'Regulatory',
  MARKET: 'Market',
};

export function ScenarioCard({ scenario, onEdit, onDelete }: ScenarioCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-lg line-clamp-2">{scenario.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(scenario)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(scenario.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {scenario.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {scenario.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {scenario.type && (
            <Badge variant="secondary" className={typeColors[scenario.type]}>
              {typeLabels[scenario.type]}
            </Badge>
          )}
          
          {scenario.probability && (
            <Badge variant="outline" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              {Math.round(scenario.probability * 100)}%
            </Badge>
          )}
        </div>
        
        {scenario.timeline && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {scenario.timeline}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(scenario.updatedAt), { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
} 