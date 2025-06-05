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

interface DataCard {
  id: string;
  name: string;
  description?: string;
  url?: string;
  type: 'report' | 'article' | 'video' | 'document' | 'other';
}

interface Theme {
  id: string;
  name: string;
  description?: string;
  dataCards: DataCard[];
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
  const [editingDataCard, setEditingDataCard] = useState<{ assetId: string; themeId: string; dataCard: DataCard | null }>({ assetId: '', themeId: '', dataCard: null });
  
  const [newAsset, setNewAsset] = useState({
    name: '',
    description: ''
  });

  const [newTheme, setNewTheme] = useState({
    name: '',
    description: ''
  });

  const [newDataCard, setNewDataCard] = useState({
    name: '',
    description: '',
    url: '',
    type: 'report' as DataCard['type']
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
        setAssets(data.items || []);
      } else {
        console.error('Failed to load assets');
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, searchTerm]);

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

    // Mock implementation - in real app, this would call an API
    const updatedAssets = assets.map(asset => {
      if (asset.id === assetId) {
        const newThemeObj: Theme = {
          id: Date.now().toString(),
          name: newTheme.name,
          description: newTheme.description,
          dataCards: []
        };
        return {
          ...asset,
          themes: [...(asset.themes || []), newThemeObj]
        };
      }
      return asset;
    });
    
    setAssets(updatedAssets);
    setNewTheme({ name: '', description: '' });
    setEditingTheme({ assetId: '', theme: null });
    
    toast({
      title: "Theme added",
      description: `${newTheme.name} has been added.`
    });
  };

  const removeTheme = async (assetId: string, themeId: string) => {
    const updatedAssets = assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          themes: asset.themes.filter(theme => theme.id !== themeId)
        };
      }
      return asset;
    });
    
    setAssets(updatedAssets);
    toast({
      title: "Theme removed",
      description: "Theme has been deleted."
    });
  };

  const addDataCard = async (assetId: string, themeId: string) => {
    if (!newDataCard.name.trim()) return;

    const updatedAssets = assets.map(asset => {
      if (asset.id === assetId) {
        const updatedThemes = asset.themes.map(theme => {
          if (theme.id === themeId) {
            const newDataCardObj: DataCard = {
              id: Date.now().toString(),
              name: newDataCard.name,
              description: newDataCard.description,
              url: newDataCard.url,
              type: newDataCard.type
            };
            return {
              ...theme,
              dataCards: [...theme.dataCards, newDataCardObj]
            };
          }
          return theme;
        });
        return { ...asset, themes: updatedThemes };
      }
      return asset;
    });
    
    setAssets(updatedAssets);
    setNewDataCard({ name: '', description: '', url: '', type: 'report' });
    setEditingDataCard({ assetId: '', themeId: '', dataCard: null });
    
    toast({
      title: "Data card added",
      description: `${newDataCard.name} has been added.`
    });
  };

  const removeDataCard = async (assetId: string, themeId: string, dataCardId: string) => {
    const updatedAssets = assets.map(asset => {
      if (asset.id === assetId) {
        const updatedThemes = asset.themes.map(theme => {
          if (theme.id === themeId) {
            return {
              ...theme,
              dataCards: theme.dataCards.filter(card => card.id !== dataCardId)
            };
          }
          return theme;
        });
        return { ...asset, themes: updatedThemes };
      }
      return asset;
    });
    
    setAssets(updatedAssets);
    toast({
      title: "Data card removed",
      description: "Data card has been deleted."
    });
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
                        <Button size="sm" onClick={() => addTheme(asset.id)}>Add</Button>
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
                          onClick={() => setEditingDataCard({ assetId: asset.id, themeId: theme.id, dataCard: null })}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Card
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => removeTheme(asset.id, theme.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Add Data Card Form */}
                    {editingDataCard.assetId === asset.id && editingDataCard.themeId === theme.id && !editingDataCard.dataCard && (
                      <Card className="p-3 bg-muted/20 mb-3">
                        <div className="space-y-2">
                          <Input
                            placeholder="Data card name"
                            value={newDataCard.name}
                            onChange={(e) => setNewDataCard({ ...newDataCard, name: e.target.value })}
                          />
                          <Input
                            placeholder="URL (optional)"
                            value={newDataCard.url}
                            onChange={(e) => setNewDataCard({ ...newDataCard, url: e.target.value })}
                          />
                          <select
                            value={newDataCard.type}
                            onChange={(e) => setNewDataCard({ ...newDataCard, type: e.target.value as DataCard['type'] })}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="report">Report</option>
                            <option value="article">Article</option>
                            <option value="video">Video</option>
                            <option value="document">Document</option>
                            <option value="other">Other</option>
                          </select>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => addDataCard(asset.id, theme.id)}>Add</Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingDataCard({ assetId: '', themeId: '', dataCard: null })}>Cancel</Button>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Data Cards */}
                    <div className="space-y-2">
                      {theme.dataCards.map((dataCard) => (
                        <div key={dataCard.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                          <div className="flex items-center space-x-2">
                            <File className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium">{dataCard.name}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">{dataCard.type}</Badge>
                              {dataCard.url && (
                                <a href={dataCard.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-primary hover:underline">
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => removeDataCard(asset.id, theme.id, dataCard.id)}>
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