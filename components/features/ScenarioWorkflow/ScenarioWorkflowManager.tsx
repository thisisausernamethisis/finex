'use client';

import { useState } from 'react';
import { useScenarios, useCreateScenario, useDeleteScenario, Scenario, ScenarioType } from '@/lib/hooks/scenarios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Target, Layers, FileText, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@clerk/nextjs';

// Types for our scenario workflow
interface WorkflowTheme {
  id: string;
  name: string;
  description?: string;
  category: string;
  cards: WorkflowCard[];
}

interface WorkflowCard {
  id: string;
  title: string;
  content: string;
  importance: number;
  source?: string;
}

interface WorkflowScenario extends Scenario {
  themes?: WorkflowTheme[];
}

export function ScenarioWorkflowManager() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [newScenario, setNewScenario] = useState({ 
    name: '', 
    description: '', 
    type: 'TECHNOLOGY' as const,
    timeline: '',
    probability: ''
  });
  

  const { data: scenariosData, isLoading, refetch } = useScenarios();
  const createScenarioMutation = useCreateScenario({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario created successfully',
      });
      setShowCreateForm(false);
      setNewScenario({ name: '', description: '', type: 'TECHNOLOGY', timeline: '', probability: '' });
      refetch();
    },
  });
  
  const deleteScenarioMutation = useDeleteScenario({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Scenario deleted successfully',
      });
      refetch();
    },
  });

  const scenarios: WorkflowScenario[] = scenariosData?.data || [];

  const handleCreateScenario = () => {
    if (!newScenario.name.trim()) {
      toast({
        title: 'Error',
        description: 'Scenario name is required',
        variant: 'destructive',
      });
      return;
    }

    createScenarioMutation.mutate({
      name: newScenario.name,
      description: newScenario.description || undefined,
      type: newScenario.type,
      timeline: newScenario.timeline || undefined,
      probability: newScenario.probability ? parseFloat(newScenario.probability) : undefined,
      isPublic: false,
    });
  };


  const getScenarioTypeColor = (type?: string) => {
    const colors = {
      TECHNOLOGY: 'bg-blue-500',
      ECONOMIC: 'bg-green-500',
      GEOPOLITICAL: 'bg-red-500',
      REGULATORY: 'bg-yellow-500',
      MARKET: 'bg-purple-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  if (isLoading) {
    return <div>Loading scenarios...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create Scenario Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Create New Scenario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Scenario name (e.g., China takes Taiwan, Major recession occurs)"
              value={newScenario.name}
              onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
            />
            <Textarea
              placeholder="Scenario description and context"
              value={newScenario.description}
              onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={newScenario.type} onValueChange={(value: any) => setNewScenario({ ...newScenario, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                    <SelectItem value="ECONOMIC">Economic</SelectItem>
                    <SelectItem value="GEOPOLITICAL">Geopolitical</SelectItem>
                    <SelectItem value="REGULATORY">Regulatory</SelectItem>
                    <SelectItem value="MARKET">Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Timeline (e.g., 2-5 years)"
                value={newScenario.timeline}
                onChange={(e) => setNewScenario({ ...newScenario, timeline: e.target.value })}
              />
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                placeholder="Probability (0.0-1.0)"
                value={newScenario.probability}
                onChange={(e) => setNewScenario({ ...newScenario, probability: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateScenario} disabled={createScenarioMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {createScenarioMutation.isPending ? 'Creating...' : 'Create Scenario'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenarios List */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Scenarios ({scenarios.length})</h2>
        <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Scenario
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Scenarios Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first scenario to start building your analysis matrix
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Scenario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <Card key={scenario.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {scenario.name}
                    </CardTitle>
                    {scenario.description && (
                      <p className="text-muted-foreground mt-1">{scenario.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className={`text-white ${getScenarioTypeColor(scenario.type)}`}>
                        {scenario.type?.toLowerCase() || 'unknown'}
                      </Badge>
                      <Badge variant="outline">
                        {scenario.themes?.length || 0} themes
                      </Badge>
                      {scenario.timeline && (
                        <Badge variant="outline">
                          {scenario.timeline}
                        </Badge>
                      )}
                      {scenario.probability && (
                        <Badge variant="outline">
                          {Math.round(scenario.probability * 100)}% probability
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Simplified view - themes and cards display only */}
                {scenario.themes && scenario.themes.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {scenario.themes.length} theme{scenario.themes.length !== 1 ? 's' : ''} with research data
                    </p>
                    <div className="grid gap-2">
                      {scenario.themes.map((theme) => (
                        <div key={theme.id} className="border rounded-lg p-3 bg-muted/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4" />
                            <span className="font-medium">{theme.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {theme.cards?.length || 0} cards
                            </Badge>
                          </div>
                          {theme.description && (
                            <p className="text-sm text-muted-foreground">{theme.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No themes yet. This scenario needs research themes and supporting evidence.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 