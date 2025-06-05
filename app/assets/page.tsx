'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Building2, TrendingUp, Tag, MoreHorizontal, Edit, Trash, Bookmark } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';
import AssetEditModal from '@/components/features/AssetManagement/AssetEditModal';
import AssetDeleteModal from '@/components/features/AssetManagement/AssetDeleteModal';
import AssetTemplateModal from '@/components/features/AssetManagement/AssetTemplateModal';

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

interface Asset {
  id: string;
  name: string;
  description?: string;
  growthValue?: number;
  userId: string;
  category?: keyof typeof TechnologyCategory;
  categoryConfidence?: number;
  categoryInsights?: any;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedAssets {
  items: Asset[];
  total: number;
  hasMore: boolean;
}

export default function AssetsPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [templatingAsset, setTemplatingAsset] = useState<Asset | null>(null);
  const [newAsset, setNewAsset] = useState({
    name: '',
    description: '',
    growthValue: '',
    category: '' as keyof typeof TechnologyCategory | '',
    categoryConfidence: '',
    isPublic: false
  });

  const loadAssets = async () => {
    try {
      const token = await getToken();
      const url = new URL('/api/assets', window.location.origin);
      
      if (searchTerm) {
        url.searchParams.set('search', searchTerm);
      }
      if (categoryFilter) {
        url.searchParams.set('category', categoryFilter);
      }
      if (showPublicOnly) {
        url.searchParams.set('isPublic', 'true');
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: PaginatedAssets = await response.json();
        setAssets(data.items);
      } else {
        console.error('Failed to load assets');
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAsset = async () => {
    if (!newAsset.name.trim()) return;
    
    setCreating(true);
    try {
      const token = await getToken();
      
      // Build request body with only defined fields
      const requestBody: any = {
        name: newAsset.name,
        isPublic: newAsset.isPublic,
      };
      
      if (newAsset.description) requestBody.description = newAsset.description;
      if (newAsset.category) requestBody.category = newAsset.category;
      if (newAsset.categoryConfidence) requestBody.categoryConfidence = parseFloat(newAsset.categoryConfidence);
      
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewAsset({ 
          name: '', 
          description: '', 
          growthValue: '',
          category: '',
          categoryConfidence: '',
          isPublic: false 
        });
        loadAssets(); // Reload assets
        toast({
          title: "Asset created successfully",
          description: `${newAsset.name} has been added to your portfolio.`
        });
      } else {
        console.error('Failed to create asset');
        toast({
          title: "Failed to create asset",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      toast({
        title: "Network error",
        description: "Unable to connect to server. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
  };

  const handleDeleteAsset = (asset: Asset) => {
    setDeletingAsset(asset);
  };

  const handleTemplateAsset = (asset: Asset) => {
    setTemplatingAsset(asset);
  };

  const handleEditSave = () => {
    loadAssets(); // Refresh the list after edit
  };

  const handleDeleteConfirm = () => {
    loadAssets(); // Refresh the list after delete
  };

  const handleTemplateSave = () => {
    loadAssets(); // Refresh the list after template creation
  };

  useEffect(() => {
    loadAssets();
  }, [searchTerm, categoryFilter, showPublicOnly]);

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'AI_COMPUTE': return 'bg-purple-100 text-purple-800';
      case 'ROBOTICS_PHYSICAL_AI': return 'bg-blue-100 text-blue-800';
      case 'QUANTUM_COMPUTING': return 'bg-indigo-100 text-indigo-800';
      case 'BIOTECH_HEALTH': return 'bg-green-100 text-green-800';
      case 'FINTECH_CRYPTO': return 'bg-yellow-100 text-yellow-800';
      case 'ENERGY_CLEANTECH': return 'bg-emerald-100 text-emerald-800';
      case 'SPACE_DEFENSE': return 'bg-red-100 text-red-800';
      case 'TRADITIONAL_TECH': return 'bg-gray-100 text-gray-800';
      case 'OTHER': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatCategoryName = (category?: string) => {
    if (!category) return 'Uncategorized';
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Assets</h1>
            <p className="text-muted-foreground">
              Manage your portfolio assets and their categorization
            </p>
          </div>
          
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Asset
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="AI_COMPUTE">AI Compute</option>
              <option value="ROBOTICS_PHYSICAL_AI">Robotics & Physical AI</option>
              <option value="QUANTUM_COMPUTING">Quantum Computing</option>
              <option value="BIOTECH_HEALTH">Biotech & Health</option>
              <option value="FINTECH_CRYPTO">Fintech & Crypto</option>
              <option value="ENERGY_CLEANTECH">Energy & CleanTech</option>
              <option value="SPACE_DEFENSE">Space & Defense</option>
              <option value="TRADITIONAL_TECH">Traditional Tech</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="publicOnly"
              checked={showPublicOnly}
              onChange={(e) => setShowPublicOnly(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="publicOnly" className="text-sm text-gray-600">Public assets only</label>
          </div>
          
          {(categoryFilter || showPublicOnly) && (
            <Button 
              onClick={() => {
                setCategoryFilter('');
                setShowPublicOnly(false);
              }}
              className="text-sm px-3 py-1 h-auto bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Asset</CardTitle>
              <CardDescription>
                Add a new asset to your portfolio for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Asset Name *</label>
                  <Input
                    id="name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    placeholder="e.g., NVIDIA Corporation"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    id="description"
                    value={newAsset.description}
                    onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                    placeholder="Brief description of the asset..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-2">Technology Category</label>
                  <select
                    id="category"
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as keyof typeof TechnologyCategory })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="AI_COMPUTE">AI Compute</option>
                    <option value="ROBOTICS_PHYSICAL_AI">Robotics & Physical AI</option>
                    <option value="QUANTUM_COMPUTING">Quantum Computing</option>
                    <option value="BIOTECH_HEALTH">Biotech & Health</option>
                    <option value="FINTECH_CRYPTO">Fintech & Crypto</option>
                    <option value="ENERGY_CLEANTECH">Energy & CleanTech</option>
                    <option value="SPACE_DEFENSE">Space & Defense</option>
                    <option value="TRADITIONAL_TECH">Traditional Tech</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {newAsset.category && (
                  <div>
                    <label htmlFor="categoryConfidence" className="block text-sm font-medium mb-2">
                      Category Confidence (0.0 - 1.0)
                    </label>
                    <Input
                      id="categoryConfidence"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={newAsset.categoryConfidence}
                      onChange={(e) => setNewAsset({ ...newAsset, categoryConfidence: e.target.value })}
                      placeholder="e.g., 0.8"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newAsset.isPublic}
                    onChange={(e) => setNewAsset({ ...newAsset, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm">Make asset public</label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={createAsset} disabled={creating || !newAsset.name.trim()}>
                    {creating ? 'Creating...' : 'Create Asset'}
                  </Button>
                  <Button onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Assets Grid */}
        {assets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
              <p className="text-gray-500 mb-4">
                Add your first asset to start building your portfolio analysis
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        {asset.category && (
                          <Badge className={getCategoryColor(asset.category)}>
                            {formatCategoryName(asset.category)}
                          </Badge>
                        )}
                        {asset.isPublic && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Public
                          </Badge>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="h-8 w-8 p-0 hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTemplateAsset(asset)}>
                            <Bookmark className="h-4 w-4 mr-2" />
                            Create Template
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAsset(asset)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {asset.description && (
                    <CardDescription className="line-clamp-2">
                      {asset.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {asset.growthValue !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Growth Value:</span>
                        <span className="font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {asset.growthValue.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {asset.categoryConfidence !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Category Confidence:</span>
                        <span className="text-sm font-medium">
                          {Math.round(asset.categoryConfidence * 100)}%
                        </span>
                      </div>
                    )}

                    {asset.categoryInsights && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">AI Insights:</span>
                        <Tag className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                      <span>Created</span>
                      <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingAsset && (
          <AssetEditModal
            asset={editingAsset}
            open={!!editingAsset}
            onOpenChange={(open) => !open && setEditingAsset(null)}
            onSave={handleEditSave}
          />
        )}

        {/* Delete Modal */}
        {deletingAsset && (
          <AssetDeleteModal
            asset={deletingAsset}
            open={!!deletingAsset}
            onOpenChange={(open) => !open && setDeletingAsset(null)}
            onDelete={handleDeleteConfirm}
          />
        )}

        {/* Template Modal */}
        {templatingAsset && (
          <AssetTemplateModal
            asset={templatingAsset}
            open={!!templatingAsset}
            onOpenChange={(open) => !open && setTemplatingAsset(null)}
            onSave={handleTemplateSave}
          />
        )}
      </div>
    </div>
  );
} 