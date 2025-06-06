'use client';

import { useState } from 'react';
import { useScenarios, useCreateScenario, useDeleteScenario, type Scenario, type ScenarioType } from '@/lib/hooks/scenarios';
import { ScenariosHeader } from '@/components/scenarios/ScenariosHeader';
import { ScenariosGrid } from '@/components/scenarios/ScenariosGrid';
import { ScenariosSkeleton } from '@/components/scenarios/ScenariosSkeleton';
import { ScenariosErrorBoundary } from '@/components/scenarios/ScenariosErrorBoundary';
import ScenarioEditModal from '@/components/features/ScenarioManagement/ScenarioEditModal';
import { ScenarioTemplateSelector } from '@/components/features/ScenarioManagement/ScenarioTemplateSelector';
import { ContextualHelp, WorkflowStepIndicator } from '@/components/common/ContextualHelp';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function ScenariosPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ScenarioType | 'ALL'>('ALL');
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  const { toast } = useToast();
  
  // Query params for scenarios
  const queryParams = {
    search: search || undefined,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
  };
  
  const {
    data: scenariosData,
    isLoading,
    isError,
    error,
    refetch,
  } = useScenarios(queryParams);
  
  const createScenarioMutation = useCreateScenario({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario created successfully',
      });
    },
  });
  
  const deleteScenarioMutation = useDeleteScenario({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario deleted successfully',
      });
    },
  });
  
  const handleCreateClick = () => {
    setShowTemplateSelector(true);
  };

  const handleQuickCreateClick = () => {
    // Quick create scenario
    createScenarioMutation.mutate({
      name: `New Scenario ${Date.now()}`,
      description: 'Sample scenario description',
      type: 'TECHNOLOGY',
      isPublic: false,
    });
  };

  const handleCreateFromTemplate = (template: any) => {
    // Create scenario from template
    createScenarioMutation.mutate({
      name: template.name,
      description: template.description,
      type: template.type,
      probability: template.probability,
      timeline: template.timeline,
      isPublic: false,
    });
    setShowTemplateSelector(false);
    toast({
      title: 'Success',
      description: `Scenario created from template: ${template.name}`,
    });
  };

  const handleCreateFromScratch = () => {
    handleQuickCreateClick();
    setShowTemplateSelector(false);
  };
  
  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      deleteScenarioMutation.mutate({ id });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <ScenariosSkeleton />
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <ScenariosErrorBoundary error={error as Error} reset={() => refetch()} />
        </div>
      </div>
    );
  }
  
  const scenarios = scenariosData?.data || [];
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <ScenariosHeader
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            onCreateClick={handleCreateClick}
            onQuickCreateClick={handleQuickCreateClick}
            totalScenarios={scenarios.length}
            isCreating={createScenarioMutation.isPending}
          />
          <ContextualHelp 
            phase={2} 
            triggerText="Phase 2 Help"
            className="ml-4"
          />
        </div>

        {/* Phase 2 Progress Indicator */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <WorkflowStepIndicator
              currentStep={2}
              totalSteps={4}
              stepLabels={[
                'Asset Research & Theme Organization',
                'Scenario Planning & Definition',
                'Matrix Generation & Analysis',
                'Strategic Insights & Recommendations'
              ]}
            />
          </CardContent>
        </Card>
        
        <ScenariosGrid
          scenarios={scenarios}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreateFromFileText={handleCreateClick}
          onQuickCreate={handleQuickCreateClick}
        />
        
        {/* Scenario Template Selector */}
        <ScenarioTemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onSelectTemplate={handleCreateFromTemplate}
          onCreateFromScratch={handleCreateFromScratch}
        />

        {/* Scenario Edit Modal */}
        {editingScenario && (
          <ScenarioEditModal
            scenario={editingScenario}
            open={!!editingScenario}
            onOpenChange={(open) => !open && setEditingScenario(null)}
            onSave={() => {
              setEditingScenario(null);
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
} 