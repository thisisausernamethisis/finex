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
import { Plus, Target, Layers, FileText, Edit, Trash2, Save, X } from 'lucide-react';
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
  
  // Theme management
  const [addingTheme, setAddingTheme] = useState<string | null>(null);
  const [newTheme, setNewTheme] = useState({ name: '', description: '', category: 'Evidence' });
  
  // Card management
  const [addingCard, setAddingCard] = useState<{ scenarioId: string; themeId: string } | null>(null);
  const [newCard, setNewCard] = useState({ title: '', content: '', importance: 3, source: '' });

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

  const handleDeleteScenario = (scenarioId: string) => {
    if (confirm('Are you sure you want to delete this scenario? This will also delete all associated themes and cards.')) {
      deleteScenarioMutation.mutate({ id: scenarioId });
    }
  };

  const handleAddTheme = async (scenarioId: string) => {
    if (!newTheme.name.trim()) {
      toast({
        title: 'Error',
        description: 'Theme name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTheme.name,
          description: newTheme.description,
          category: newTheme.category,
          scenarioId: scenarioId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Theme added successfully',
        });
        setAddingTheme(null);
        setNewTheme({ name: '', description: '', category: 'Evidence' });
        refetch();
      } else {
        throw new Error('Failed to create theme');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create theme',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (confirm('Are you sure you want to delete this theme? This will also delete all associated cards.')) {
      try {
        const token = await getToken();
        const response = await fetch(`/api/themes/${themeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          toast({
            title: 'Success',
            description: 'Theme deleted successfully',
          });
          refetch();
        } else {
          throw new Error('Failed to delete theme');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete theme',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAddCard = async (scenarioId: string, themeId: string) => {
    if (!newCard.title.trim()) {
      toast({
        title: 'Error',
        description: 'Card title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newCard.title,
          content: newCard.content,
          importance: newCard.importance,
          source: newCard.source,
          themeId: themeId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Card added successfully',
        });
        setAddingCard(null);
        setNewCard({ title: '', content: '', importance: 3, source: '' });
        refetch();
      } else {
        throw new Error('Failed to create card');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create card',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      try {
        const token = await getToken();
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          toast({
            title: 'Success',
            description: 'Card deleted successfully',
          });
          refetch();
        } else {
          throw new Error('Failed to delete card');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete card',
          variant: 'destructive',
        });
      }
    }
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingTheme(scenario.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Theme
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteScenario(scenario.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Add Theme Form */}
                {addingTheme === scenario.id && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Add New Theme
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        placeholder="Theme name (e.g., Economic Impact, Political Consequences)"
                        value={newTheme.name}
                        onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                      />
                      <Textarea
                        placeholder="Theme description"
                        value={newTheme.description}
                        onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                      />
                      <Input
                        placeholder="Category"
                        value={newTheme.category}
                        onChange={(e) => setNewTheme({ ...newTheme, category: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAddTheme(scenario.id)}>
                          <Save className="w-4 h-4 mr-1" />
                          Add Theme
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddingTheme(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Themes Accordion */}
                {scenario.themes && scenario.themes.length > 0 && (
                  <Accordion type="multiple" className="w-full">
                    {scenario.themes.map((theme) => (
                      <AccordionItem key={theme.id} value={theme.id}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center justify-between w-full mr-4">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              <span>{theme.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {theme.cards?.length || 0} cards
                              </Badge>
                            </div>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAddingCard({ scenarioId: scenario.id, themeId: theme.id })}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTheme(theme.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                          {theme.description && (
                            <p className="text-sm text-muted-foreground">{theme.description}</p>
                          )}

                          {/* Add Card Form */}
                          {addingCard?.scenarioId === scenario.id && addingCard?.themeId === theme.id && (
                            <Card className="bg-muted/30">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Add Research Card
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <Input
                                  placeholder="Card title"
                                  value={newCard.title}
                                  onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                                />
                                <Textarea
                                  placeholder="Research content, evidence, or analysis"
                                  value={newCard.content}
                                  onChange={(e) => setNewCard({ ...newCard, content: e.target.value })}
                                />
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Importance (1-10)"
                                    min="1"
                                    max="10"
                                    value={newCard.importance}
                                    onChange={(e) => setNewCard({ ...newCard, importance: parseInt(e.target.value) || 1 })}
                                    className="w-32"
                                  />
                                  <Input
                                    placeholder="Source (optional)"
                                    value={newCard.source}
                                    onChange={(e) => setNewCard({ ...newCard, source: e.target.value })}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleAddCard(scenario.id, theme.id)}>
                                    <Save className="w-4 h-4 mr-1" />
                                    Add Card
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAddingCard(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Cards List */}
                          {theme.cards && theme.cards.length > 0 ? (
                            <div className="space-y-2">
                              {theme.cards.map((card) => (
                                <Card key={card.id} className="bg-background">
                                  <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                      <CardTitle className="text-sm flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        {card.title}
                                      </CardTitle>
                                      <div className="flex gap-1">
                                        <Badge variant="outline" className="text-xs">
                                          Priority: {card.importance}/10
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteCard(card.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                      {card.content}
                                    </p>
                                    {card.source && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Source: {card.source}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                No research cards yet. Add cards to populate this theme with evidence and analysis.
                              </p>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}

                {(!scenario.themes || scenario.themes.length === 0) && addingTheme !== scenario.id && (
                  <div className="text-center py-6">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No themes yet. Add themes to organize your scenario research and evidence.
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