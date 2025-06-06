import { Scenario } from '@/lib/hooks/scenarios';
import { ScenarioCard } from './ScenarioCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Zap } from 'lucide-react';

interface ScenariosGridProps {
  scenarios: Scenario[];
  onEdit: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
  onCreateFromFileText?: () => void;
  onQuickCreate?: () => void;
}

export function ScenariosGrid({ scenarios, onEdit, onDelete, onCreateFromFileText, onQuickCreate }: ScenariosGridProps) {
  if (scenarios.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Define Your Future Scenarios</h3>
            <p className="text-muted-foreground mb-6">
              Create scenarios representing potential future events or conditions that could impact your assets. Consider technology changes, economic shifts, and market dynamics.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={onCreateFromFileText}
                className="bg-primary hover:bg-primary/90"
              >
                <FileText className="w-4 h-4 mr-2" />
                Browse FileTexts
              </Button>
              <Button
                variant="outline"
                onClick={onQuickCreate}
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Create
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              💡 Tip: Focus on scenarios that could materially impact your assets - balance probable events with high-impact edge cases
            </p>
          </div>
        </CardContent>
      </Card>
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