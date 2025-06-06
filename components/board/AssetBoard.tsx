import { useState, useEffect } from 'react';
import { useAssets, useCreateAsset, useDeleteAsset } from '@/lib/hooks/assets';
import { organizeAssetsByTheme } from '@/lib/utils/assetThemes';
import { ThemeAccordion } from './ThemeAccordion';
import { BoardHeader } from './BoardHeader';
import { BoardSearch } from './BoardSearch';
import { AssetsBoardSkeleton } from './AssetsBoardSkeleton';
import { AssetTemplateSelector } from '@/components/features/AssetManagement/AssetTemplateSelector';
import AssetEditModal from '@/components/features/AssetManagement/AssetEditModal';
import { ContextualHelp, WorkflowStepIndicator } from '@/components/common/ContextualHelp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AssetBoardProps {
  selectedAssetId?: string;
  onAssetSelect?: (id: string) => void;
  onAssetDeselect?: () => void;
}

export function AssetBoard({ 
  selectedAssetId, 
  onAssetSelect, 
  onAssetDeselect 
}: AssetBoardProps) {
  const [search, setSearch] = useState('');
  const [themeFilter, setThemeFilter] = useState<string>('ALL');
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [showFileTextSelector, setShowFileTextSelector] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  
  const { toast } = useToast();
  
  const {
    data: assetsData,
    isLoading,
    isError,
    error,
  } = useAssets({ search: search || undefined });
  
  const createAssetMutation = useCreateAsset({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Asset created successfully',
      });
    },
  });
  
  const deleteAssetMutation = useDeleteAsset({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Asset deleted successfully',
      });
    },
  });
  
  const assets = assetsData?.data || [];
  const themes = organizeAssetsByTheme(assets);
  
  // Auto-expand theme when asset is selected
  useEffect(() => {
    if (selectedAssetId) {
      const themeWithSelectedAsset = themes.find(theme =>
        theme.assets.some(asset => asset.id === selectedAssetId)
      );
      
      if (themeWithSelectedAsset) {
        setExpandedThemes(prev => new Set(Array.from(prev).concat(themeWithSelectedAsset.id)));
      }
    }
  }, [selectedAssetId, themes]);
  
  const handleAssetSelect = (assetId: string) => {
    if (selectedAssetId === assetId) {
      onAssetDeselect?.();
    } else {
      onAssetSelect?.(assetId);
    }
  };
  
  const handleThemeToggle = (themeId: string) => {
    setExpandedThemes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(themeId)) {
        newSet.delete(themeId);
      } else {
        newSet.add(themeId);
      }
      return newSet;
    });
  };
  
  const handleCreateAsset = () => {
    setShowFileTextSelector(true);
  };

  const handleQuickCreateAsset = () => {
    // Create a basic asset without template
    createAssetMutation.mutate({
      name: `New Asset ${Date.now()}`,
      description: 'Custom asset description',
      category: 'uncategorized',
      isPublic: false,
    });
  };

  const handleCreateFromFileText = async (template: any) => {
    // Clone the template to create a new asset
    try {
      const response = await fetch(`/api/theme-templates/${template.id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const newAsset = await response.json();
        toast({
          title: 'Success',
          description: `Asset created from template: ${template.name}`,
        });
      } else {
        throw new Error('Failed to clone template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create asset from template',
        variant: 'destructive',
      });
    }
  };

  const handleCreateFromScratch = () => {
    handleQuickCreateAsset();
  };
  
  const handleAssetEdit = (asset: any) => {
    setEditingAsset(asset);
  };
  
  const handleAssetDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      deleteAssetMutation.mutate({ id });
    }
  };

  const handleAddAssetToTheme = (themeId: string) => {
    toast({
      title: 'Add Asset to Theme',
      description: 'This feature will allow you to assign existing assets to themes',
    });
  };

  const handleEditTheme = (theme: any) => {
    toast({
      title: 'Edit Theme',
      description: 'Theme editing functionality will be implemented',
    });
  };

  const handleDeleteTheme = (themeId: string) => {
    if (confirm('Are you sure you want to delete this theme?')) {
      toast({
        title: 'Delete Theme',
        description: 'Theme deletion functionality will be implemented',
      });
    }
  };
  
  // Filter themes based on selected filter
  const filteredThemes = themeFilter === 'ALL' 
    ? themes 
    : themes.filter(theme => theme.id === themeFilter);
  
  if (isLoading) {
    return <AssetsBoardSkeleton />;
  }
  
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-4">
          Failed to load assets
        </p>
        <p className="text-sm text-muted-foreground">
          {error?.message || 'An unexpected error occurred'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BoardHeader 
          totalAssets={assets.length}
          totalThemes={themes.length}
          selectedAssetId={selectedAssetId}
          onCreateAsset={handleCreateAsset}
          onQuickCreateAsset={handleQuickCreateAsset}
        />
        <ContextualHelp 
          phase={1} 
          triggerText="Phase 1 Help"
          className="ml-4"
        />
      </div>
      
      <BoardSearch
        search={search}
        onSearchChange={setSearch}
        themeFilter={themeFilter}
        onThemeFilterChange={setThemeFilter}
        availableThemes={themes}
      />

      {/* Phase 1 Progress Indicator */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <WorkflowStepIndicator
            currentStep={1}
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
      
      <div className="space-y-4">
        {filteredThemes.length > 0 ? (
          filteredThemes.map((theme) => (
            <ThemeAccordion
              key={theme.id}
              theme={theme}
              selectedAssetId={selectedAssetId}
              onAssetSelect={handleAssetSelect}
              onAssetEdit={handleAssetEdit}
              onAssetDelete={handleAssetDelete}
              onAddAssetToTheme={handleAddAssetToTheme}
              onEditTheme={handleEditTheme}
              onDeleteTheme={handleDeleteTheme}
              isExpanded={expandedThemes.has(theme.id)}
              onToggle={() => handleThemeToggle(theme.id)}
            />
          ))
        ) : search || themeFilter !== 'ALL' ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-2">
              No assets found
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Start Your Portfolio Analysis</h3>
                <p className="text-muted-foreground mb-6">
                  Begin Phase 1 by adding assets you want to analyze. Create comprehensive profiles with research themes and supporting data.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleCreateAsset}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Browse FileTexts
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleQuickCreateAsset}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Create
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  💡 Tip: Start with 3-5 key assets to keep your analysis manageable
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* FileText Selector Modal */}
      <AssetTemplateSelector
        isOpen={showFileTextSelector}
        onClose={() => setShowFileTextSelector(false)}
        onSelectTemplate={handleCreateFromFileText}
        onCreateFromScratch={handleCreateFromScratch}
      />
      
      {/* Asset Edit Modal */}
      {editingAsset && (
        <AssetEditModal
          asset={editingAsset}
          open={!!editingAsset}
          onOpenChange={(open) => !open && setEditingAsset(null)}
          onSave={() => {
            setEditingAsset(null);
            // Refresh assets list
            window.location.reload();
          }}
        />
      )}
      
      {/* Status indicators */}
      {createAssetMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg">
          Creating asset...
        </div>
      )}
      
      {deleteAssetMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg">
          Deleting asset...
        </div>
      )}
    </div>
  );
} 