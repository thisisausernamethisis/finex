import { cn } from '@/lib/utils';

interface MatrixHeaderProps {
  scenario: {
    id: string;
    name: string;
    type: string;
    avgImpact?: number; // Add average impact for this scenario
  };
  className?: string;
}

export function MatrixHeader({ scenario, className }: MatrixHeaderProps) {
  const getScenarioTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'technology': return 'bg-blue-100 text-blue-700';
      case 'economic': return 'bg-green-100 text-green-700';
      case 'regulatory': return 'bg-red-100 text-red-700';
      case 'market': return 'bg-purple-100 text-purple-700';
      case 'social': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <div 
      className={cn(
        "matrix-header bg-background border-r border-b p-3 min-h-16",
        "flex flex-col justify-center text-center",
        className
      )}
    >
      {/* Scenario name */}
      <div className="font-medium text-sm leading-tight mb-1" title={scenario.name}>
        {scenario.name.length > 20 
          ? `${scenario.name.substring(0, 20)}...` 
          : scenario.name
        }
      </div>
      
      {/* Scenario type badge */}
      <div className={cn(
        "text-xs px-2 py-1 rounded-full mb-1",
        getScenarioTypeColor(scenario.type)
      )}>
        {scenario.type}
      </div>
      
      {/* Average impact (risk assessment) */}
      {scenario.avgImpact !== undefined && (
        <div className={`text-xs font-bold ${
          scenario.avgImpact > 0 ? 'text-green-600' : 
          scenario.avgImpact < 0 ? 'text-red-600' : 'text-gray-600'
        }`}>
          Avg: {scenario.avgImpact > 0 ? '+' : ''}{scenario.avgImpact.toFixed(1)}
        </div>
      )}
    </div>
  );
} 