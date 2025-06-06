'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit3, FileText, BookOpen } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

// Technology Category Enum (matches Prisma schema)
const TechnologyCategory = {
  AI_COMPUTE: 'AI_COMPUTE',
  ROBOTICS_PHYSICAL_AI: 'ROBOTICS_PHYSICAL_AI', 
  QUANTUM_COMPUTING: 'QUANTUM_COMPUTING',
  TRADITIONAL_TECH: 'TRADITIONAL_TECH',
  BIOTECH_HEALTH: 'BIOTECH_HEALTH',
  FINTECH_CRYPTO: 'FINTECH_CRYPTO',
  ENERGY_CLEANTECH: 'ENERGY_CLEANTECH',
  SPACE_DEFENSE: 'SPACE_DEFENSE',
  OTHER: 'OTHER'
} as const;

interface Theme {
  id: string;
  name: string;
  description?: string;
  category: string;
  themeType: 'STANDARD' | 'GROWTH' | 'PROBABILITY';
  cards: Card[];
}

interface Card {
  id: string;
  title: string;
  content: string;
  importance?: number;
  source?: string;
}

interface Asset {
  id: string;
  name: string;
  description?: string;
  category?: keyof typeof TechnologyCategory;
  categoryConfidence?: number;
  categoryInsights?: any;
  isPublic: boolean;
  themes?: Theme[];
}

interface AssetEditModalProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export default function AssetEditModal({ asset, open, onOpenChange, onSave }: AssetEditModalProps) {
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [editedAsset, setEditedAsset] = useState({
    name: asset.name,
    description: asset.description || '',
    category: asset.category || '',
    categoryConfidence: asset.categoryConfidence?.toString() || '',
    isPublic: asset.isPublic
  });
  
  const [themes, setThemes] = useState<Theme[]>(asset.themes || []);
  const [newTheme, setNewTheme] = useState({ name: '', description: '', category: 'Default', themeType: 'STANDARD' as const });
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ title: '', content: '', importance: 1, source: '' });
  const [editingCard, setEditingCard] = useState<{ themeId: string; cardId: string } | null>(null);

  const addTheme = () => {
    if (!newTheme.name.trim()) return;
    
    const theme: Theme = {
      id: `temp-${Date.now()}`,
      name: newTheme.name,
      description: newTheme.description,
      category: newTheme.category,
      themeType: newTheme.themeType,
      cards: []
    };
    
    setThemes([...themes, theme]);
    setNewTheme({ name: '', description: '', category: 'Default', themeType: 'STANDARD' });
  };

  const removeTheme = (themeId: string) => {
    setThemes(themes.filter(t => t.id !== themeId));
  };

  const addCard = (themeId: string) => {
    if (!newCard.title.trim()) return;
    
    const card: Card = {
      id: `temp-${Date.now()}`,
      title: newCard.title,
      content: newCard.content,
      importance: newCard.importance,
      source: newCard.source
    };
    
    setThemes(themes.map(theme => 
      theme.id === themeId 
        ? { ...theme, cards: [...theme.cards, card] }
        : theme
    ));
    
    setNewCard({ title: '', content: '', importance: 1, source: '' });
  };

  const removeCard = (themeId: string, cardId: string) => {
    setThemes(themes.map(theme => 
      theme.id === themeId 
        ? { ...theme, cards: theme.cards.filter(c => c.id !== cardId) }
        : theme
    ));
  };

  const handleSave = async () => {
    if (!editedAsset.name.trim()) return;
    
    setSaving(true);
    try {
      const token = await getToken();
      
      // Build request body with only defined fields
      const requestBody: any = {
        name: editedAsset.name,
        isPublic: editedAsset.isPublic,
        themes: themes // Include themes in the save
      };
      
      if (editedAsset.description) requestBody.description = editedAsset.description;
      if (editedAsset.category) requestBody.category = editedAsset.category;
      if (editedAsset.categoryConfidence) requestBody.categoryConfidence = parseFloat(editedAsset.categoryConfidence);
      
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        onOpenChange(false);
        onSave(); // Refresh the parent list
      } else {
        console.error('Failed to update asset');
      }
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription>
            Manage your asset information, themes, and research cards.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="themes">
              Themes ({themes.length})
            </TabsTrigger>
            <TabsTrigger value="research">Research Cards</TabsTrigger>
          </TabsList>
          
          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Asset Name *</Label>
                  <Input
                    id="edit-name"
                    value={editedAsset.name}
                    onChange={(e) => setEditedAsset({ ...editedAsset, name: e.target.value })}
                    placeholder="e.g., NVIDIA Corporation"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editedAsset.description}
                    onChange={(e) => setEditedAsset({ ...editedAsset, description: e.target.value })}
                    placeholder="Brief description of the asset..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isPublic"
                    checked={editedAsset.isPublic}
                    onChange={(e) => setEditedAsset({ ...editedAsset, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="edit-isPublic">Make asset public</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-category">Technology Category</Label>
                  <Select 
                    value={editedAsset.category} 
                    onValueChange={(value) => setEditedAsset({ ...editedAsset, category: value as keyof typeof TechnologyCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI_COMPUTE">AI Compute</SelectItem>
                      <SelectItem value="ROBOTICS_PHYSICAL_AI">Robotics & Physical AI</SelectItem>
                      <SelectItem value="QUANTUM_COMPUTING">Quantum Computing</SelectItem>
                      <SelectItem value="BIOTECH_HEALTH">Biotech & Health</SelectItem>
                      <SelectItem value="FINTECH_CRYPTO">Fintech & Crypto</SelectItem>
                      <SelectItem value="ENERGY_CLEANTECH">Energy & CleanTech</SelectItem>
                      <SelectItem value="SPACE_DEFENSE">Space & Defense</SelectItem>
                      <SelectItem value="TRADITIONAL_TECH">Traditional Tech</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editedAsset.category && (
                  <div>
                    <Label htmlFor="edit-categoryConfidence">
                      Category Confidence (0.0 - 1.0)
                    </Label>
                    <Input
                      id="edit-categoryConfidence"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={editedAsset.categoryConfidence}
                      onChange={(e) => setEditedAsset({ ...editedAsset, categoryConfidence: e.target.value })}
                      placeholder="e.g., 0.8"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Themes Tab */}
          <TabsContent value="themes" className="space-y-4">
            {/* Add New Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Theme name"
                    value={newTheme.name}
                    onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                  />
                  <Input
                    placeholder="Category"
                    value={newTheme.category}
                    onChange={(e) => setNewTheme({ ...newTheme, category: e.target.value })}
                  />
                  <Select 
                    value={newTheme.themeType} 
                    onValueChange={(value) => setNewTheme({ ...newTheme, themeType: value as 'STANDARD' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="GROWTH">Growth</SelectItem>
                      <SelectItem value="PROBABILITY">Probability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Theme description (optional)"
                  value={newTheme.description}
                  onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                  rows={2}
                />
                <Button onClick={addTheme} disabled={!newTheme.name.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Theme
                </Button>
              </CardContent>
            </Card>
            
            {/* Existing Themes */}
            <div className="space-y-3">
              {themes.map((theme) => (
                <Card key={theme.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <CardTitle className="text-base">{theme.name}</CardTitle>
                        <Badge variant="outline">{theme.themeType}</Badge>
                        <Badge variant="secondary">{theme.cards.length} cards</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTheme(theme.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {theme.description && (
                      <p className="text-sm text-muted-foreground mb-2">{theme.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Category: {theme.category}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Research Cards Tab */}
          <TabsContent value="research" className="space-y-4">
            {themes.map((theme) => (
              <Card key={theme.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {theme.name}
                      <Badge variant="outline">{theme.cards.length} cards</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Add Card to Theme */}
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Input
                        placeholder="Card title"
                        value={newCard.title}
                        onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Source (optional)"
                          value={newCard.source}
                          onChange={(e) => setNewCard({ ...newCard, source: e.target.value })}
                        />
                        <Select 
                          value={newCard.importance.toString()} 
                          onValueChange={(value) => setNewCard({ ...newCard, importance: parseInt(value) })}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(i => (
                              <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Card content"
                      value={newCard.content}
                      onChange={(e) => setNewCard({ ...newCard, content: e.target.value })}
                      rows={2}
                      className="mb-3"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => addCard(theme.id)} 
                      disabled={!newCard.title.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Card
                    </Button>
                  </div>
                  
                  {/* Existing Cards */}
                  <div className="space-y-2">
                    {theme.cards.map((card) => (
                      <div key={card.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{card.title}</span>
                            <Badge variant="outline">Importance: {card.importance}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCard(theme.id, card.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {card.content}
                        </p>
                        {card.source && (
                          <div className="text-xs text-muted-foreground">
                            Source: {card.source}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {themes.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Add themes first to organize your research cards
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !editedAsset.name.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 