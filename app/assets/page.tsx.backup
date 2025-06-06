'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Building2, Tag, Edit, Trash, File, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';

interface Card {
  id: string;
  title: string;
  content: string;
  source?: string;
  importance?: number;
}

interface Theme {
  id: string;
  name: string;
  description?: string;
  cards: Card[];
}

interface Asset {
  id: string;
  name: string;
  description?: string;
  userId: string;
  themes: Theme[];
  createdAt: string;
  updatedAt: string;
}

export default function AssetsPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingTheme, setEditingTheme] = useState<{ assetId: string; theme: Theme | null }>({ assetId: '', theme: null });
  const [editingCard, setEditingCard] = useState<{ assetId: string; themeId: string; card: Card | null }>({ assetId: '', themeId: '', card: null });
  const [loadingTheme, setLoadingTheme] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  
  const [newAsset, setNewAsset] = useState({
    name: '',
    description: ''
  });

  const [newTheme, setNewTheme] = useState({
    name: '',
    description: ''
  });

  const [newCard, setNewCard] = useState({
    title: '',
    content: '',
    source: '',
    importance: 1
  });

  const loadAssets = useCallback(async () => {
    try {
      const token = await getToken();
      const url = new URL('/api/assets', window.location.origin);
      
      if (searchTerm) {
        url.searchParams.set('search', searchTerm);
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Load themes for each asset
        const assetsWithThemes = await Promise.all(
          (data.items || []).map(async (asset: Asset) => {
            const themesResponse = await fetch(`/api/themes?assetId=${asset.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (themesResponse.ok) {
              const themesData = await themesResponse.json();
              // Load cards for each theme
              const themesWithCards = await Promise.all(
                (themesData.items || []).map(async (theme: Theme) => {
                  const cardsResponse = await fetch(`/api/cards?themeId=${theme.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  
                  if (cardsResponse.ok) {
                    const cardsData = await cardsResponse.json();
                    return { ...theme, cards: cardsData.items || [] };
                  }
                  return { ...theme, cards: [] };
                })
              );
              return { ...asset, themes: themesWithCards };
            }
            return { ...asset, themes: [] };
          })
        );
        setAssets(assetsWithThemes);
      } else {
        console.error('Failed to load assets');
        toast({
          title: "Failed to load assets",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading assets:', error);
      toast({
        title: "Error loading assets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [getToken, searchTerm, toast]);

  const createAsset = async () => {
    if (!newAsset.name.trim()) return;
    
    try {
      const token = await getToken();
      
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newAsset.name,
          description: newAsset.description
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewAsset({ name: '', description: '' });
        loadAssets();
        toast({
          title: "Asset created",
          description: `${newAsset.name} has been created.`
        });
      } else {
        toast({
          title: "Failed to create asset",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      toast({
        title: "Failed to create asset",
        variant: "destructive"
      });
    }
  };

  const deleteAsset = async (assetId: string) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadAssets();
        toast({
          title: "Asset deleted",
          description: "Asset has been removed."
        });
      } else {
        toast({
          title: "Failed to delete asset",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Failed to delete asset",
        variant: "destructive"
      });
    }
  };

  const addTheme = async (assetId: string) => {
    if (!newTheme.name.trim()) return;

    setLoadingTheme(true);
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
          assetId: assetId
        }),
      });

      if (response.ok) {
        setNewTheme({ name: '', description: '' });
        setEditingTheme({ assetId: '', theme: null });
        loadAssets(); // Reload to get updated data
        toast({
          title: "Theme added",
          description: `${newTheme.name} has been added.`
        });
      } else {
        toast({
          title: "Failed to add theme",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding theme:', error);
      toast({
        title: "Failed to add theme",
        variant: "destructive"
      });
    } finally {
      setLoadingTheme(false);
    }
  };

  const removeTheme = async (themeId: string) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`/api/themes/${themeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadAssets(); // Reload to get updated data
        toast({
          title: "Theme removed",
          description: "Theme has been deleted."
        });
      } else {
        toast({
          title: "Failed to remove theme",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing theme:', error);
      toast({
        title: "Failed to remove theme",
        variant: "destructive"
      });
    }
  };

  const addCard = async (themeId: string) => {
    if (!newCard.title.trim()) return;

    setLoadingCard(true);
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
          source: newCard.source,
          importance: newCard.importance,
          themeId: themeId
        }),
      });

      if (response.ok) {
        setNewCard({ title: '', content: '', source: '', importance: 1 });
        setEditingCard({ assetId: '', themeId: '', card: null });
        loadAssets(); // Reload to get updated data
        toast({
          title: "Card added",
          description: `${newCard.title} has been added.`
        });
      } else {
        toast({
          title: "Failed to add card",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding card:', error);
      toast({
        title: "Failed to add card",
        variant: "destructive"
      });
    } finally {
      setLoadingCard(false);
    }
  };

  const removeCard = async (cardId: string) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadAssets(); // Reload to get updated data
        toast({
          title: "Card removed",
          description: "Card has been deleted."
        });
      } else {
        toast({
          title: "Failed to remove card",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing card:', error);
      toast({
        title: "Failed to remove card",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadAssets();
  }, [searchTerm, loadAssets]);

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assets</h1>
            <p className="text-muted-foreground mt-1">Manage your assets, themes, and data cards</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Asset
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Create Asset Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Asset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Asset name"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newAsset.description}
                onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
              />
              <div className="flex space-x-2">
                <Button onClick={createAsset}>Create Asset</Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assets Grid */}
        <div className="grid gap-6">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{asset.name}</h3>
                    {asset.description && (
                      <p className="text-muted-foreground text-sm">{asset.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingAsset(asset)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteAsset(asset.id)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Themes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Themes ({asset.themes?.length || 0})
                  </h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingTheme({ assetId: asset.id, theme: null })}
                    disabled={loadingTheme}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Theme
                  </Button>
                </div>

                {/* Add Theme Form */}
                {editingTheme.assetId === asset.id && !editingTheme.theme && (
                  <Card className="p-4 bg-muted/30">
                    <div className="space-y-2">
                      <Input
                        placeholder="Theme name"
                        value={newTheme.name}
                        onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={newTheme.description}
                        onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                      />
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => addTheme(asset.id)}
                          disabled={loadingTheme}
                        >
                          {loadingTheme ? 'Adding...' : 'Add'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingTheme({ assetId: '', theme: null })}>Cancel</Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Themes List */}
                {asset.themes?.map((theme) => (
                  <Card key={theme.id} className="p-4 ml-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-medium">{theme.name}</h5>
                        {theme.description && (
                          <p className="text-sm text-muted-foreground">{theme.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingCard({ assetId: asset.id, themeId: theme.id, card: null })}
                          disabled={loadingCard}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Card
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => removeTheme(theme.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Add Card Form */}
                    {editingCard.assetId === asset.id && editingCard.themeId === theme.id && !editingCard.card && (
                      <Card className="p-3 bg-muted/20 mb-3">
                        <div className="space-y-2">
                          <Input
                            placeholder="Card title"
                            value={newCard.title}
                            onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                          />
                          <Textarea
                            placeholder="Content"
                            value={newCard.content}
                            onChange={(e) => setNewCard({ ...newCard, content: e.target.value })}
                          />
                          <Input
                            placeholder="Source (optional)"
                            value={newCard.source}
                            onChange={(e) => setNewCard({ ...newCard, source: e.target.value })}
                          />
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => addCard(theme.id)}
                              disabled={loadingCard}
                            >
                              {loadingCard ? 'Adding...' : 'Add'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingCard({ assetId: '', themeId: '', card: null })}>Cancel</Button>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Cards */}
                    <div className="space-y-2">
                      {theme.cards?.map((card) => (
                        <div key={card.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                          <div className="flex items-center space-x-2">
                            <File className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{card.title}</span>
                              {card.source && (
                                <a href={card.source} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-primary hover:underline">
                                  View Source
                                </a>
                              )}
                              {card.content && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">{card.content}</p>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => removeCard(card.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No assets found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first asset'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Asset
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 