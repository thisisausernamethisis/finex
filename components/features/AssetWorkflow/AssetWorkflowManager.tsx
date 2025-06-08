'use client';

import { useState } from 'react';
import { useAssets, useCreateAsset, useDeleteAsset } from '@/lib/hooks/assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Building2, Layers, FileText, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@clerk/nextjs';

// Types for our workflow
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

interface WorkflowAsset {
  id: string;
  name: string;
  description?: string;
  growthValue?: number;
  themes: WorkflowTheme[];
  createdAt: string;
  updatedAt: string;
}

export function AssetWorkflowManager() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [newAsset, setNewAsset] = useState({ name: '', description: '', growthValue: '' });
  
  // Theme management
  const [addingTheme, setAddingTheme] = useState<string | null>(null);
  const [newTheme, setNewTheme] = useState({ name: '', description: '', category: 'Market Analysis' });
  
  // Card management
  const [addingCard, setAddingCard] = useState<{ assetId: string; themeId: string } | null>(null);
  const [newCard, setNewCard] = useState({ title: '', content: '', importance: 3, source: '' });

  const { data: assetsData, isLoading, refetch } = useAssets();
  const createAssetMutation = useCreateAsset({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Asset created successfully',
      });
      setShowCreateForm(false);
      setNewAsset({ name: '', description: '', growthValue: '' });
      refetch();
    },
  });
  
  const deleteAssetMutation = useDeleteAsset({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Asset deleted successfully',
      });
      refetch();
    },
  });

  const assets: WorkflowAsset[] = assetsData?.data || [];

  const handleCreateAsset = () => {
    if (!newAsset.name.trim()) {
      toast({
        title: 'Error',
        description: 'Asset name is required',
        variant: 'destructive',
      });
      return;
    }

    createAssetMutation.mutate({
      name: newAsset.name,
      description: newAsset.description || undefined,
      growthValue: newAsset.growthValue ? parseFloat(newAsset.growthValue) : undefined,
      isPublic: false,
    });
  };

  const handleDeleteAsset = (assetId: string) => {
    if (confirm('Are you sure you want to delete this asset? This will also delete all associated themes and cards.')) {
      deleteAssetMutation.mutate({ id: assetId });
    }
  };

  const handleAddTheme = async (assetId: string) => {
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
          assetId: assetId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Theme added successfully',
        });
        setAddingTheme(null);
        setNewTheme({ name: '', description: '', category: 'Market Analysis' });
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

  const handleAddCard = async (assetId: string, themeId: string) => {
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

  if (isLoading) {
    return <div>Loading assets...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create Asset Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Create New Asset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Asset name (e.g., Tesla, Bitcoin, NVIDIA)"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newAsset.description}
              onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Growth value/TAM (optional)"
              value={newAsset.growthValue}
              onChange={(e) => setNewAsset({ ...newAsset, growthValue: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateAsset} disabled={createAssetMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {createAssetMutation.isPending ? 'Creating...' : 'Create Asset'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets List */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Assets ({assets.length})</h2>
        <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Assets Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first asset to start building your analysis matrix
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {asset.name}
                    </CardTitle>
                    {asset.description && (
                      <p className="text-muted-foreground mt-1">{asset.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        {asset.themes?.length || 0} themes
                      </Badge>
                      {asset.growthValue && (
                        <Badge variant="outline">
                          TAM: ${asset.growthValue.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingTheme(asset.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Theme
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAsset(asset.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Add Theme Form */}
                {addingTheme === asset.id && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Add New Theme
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        placeholder="Theme name (e.g., Market Position, Technology, Competition)"
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
                        <Button size="sm" onClick={() => handleAddTheme(asset.id)}>
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
                {asset.themes && asset.themes.length > 0 && (
                  <Accordion type="multiple" className="w-full">
                    {asset.themes.map((theme) => (
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
                                onClick={() => setAddingCard({ assetId: asset.id, themeId: theme.id })}
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
                          {addingCard?.assetId === asset.id && addingCard?.themeId === theme.id && (
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
                                  placeholder="Research content, data, or analysis"
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
                                  <Button size="sm" onClick={() => handleAddCard(asset.id, theme.id)}>
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
                                No research cards yet. Add cards to populate this theme with data and analysis.
                              </p>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}

                {(!asset.themes || asset.themes.length === 0) && addingTheme !== asset.id && (
                  <div className="text-center py-6">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No themes yet. Add themes to organize your research and analysis.
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