'use client';

import { useState } from 'react';
import { useScenarios, useCreateScenario, useDeleteScenario, type Scenario, type ScenarioType } from '@/lib/hooks/scenarios';
import { ScenariosHeader } from '@/components/scenarios/ScenariosHeader';
import { ScenariosGrid } from '@/components/scenarios/ScenariosGrid';
import { ScenariosSkeleton } from '@/components/scenarios/ScenariosSkeleton';
import { ScenariosErrorBoundary } from '@/components/scenarios/ScenariosErrorBoundary';
import { useToast } from '@/components/ui/use-toast';

export default function ScenariosPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ScenarioType | 'ALL'>('ALL');
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  
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
    // For now, create a sample scenario
    // TODO: Replace with proper create modal
    createScenarioMutation.mutate({
      name: `New Scenario ${Date.now()}`,
      description: 'Sample scenario description',
      type: 'TECHNOLOGY',
      isPublic: false,
    });
  };
  
  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    // TODO: Open edit modal
    console.log('Edit scenario:', scenario);
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
      <div className="max-w-7xl mx-auto">
        <ScenariosHeader
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onCreateClick={handleCreateClick}
          isCreating={createScenarioMutation.isPending}
        />
        
        <ScenariosGrid
          scenarios={scenarios}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
} 