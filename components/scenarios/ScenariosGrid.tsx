import { Scenario } from '@/lib/hooks/scenarios';
import { ScenarioCard } from './ScenarioCard';
import { FileText } from 'lucide-react';

interface ScenariosGridProps {
  scenarios: Scenario[];
  onEdit: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
}

export function ScenariosGrid({ scenarios, onEdit, onDelete }: ScenariosGridProps) {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">No scenarios</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first scenario.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
} 