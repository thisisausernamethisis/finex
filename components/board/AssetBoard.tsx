import { useState, useEffect } from 'react';
import { useAssets, useCreateAsset, useDeleteAsset } from '@/lib/hooks/assets';
import { organizeAssetsByTheme } from '@/lib/utils/assetThemes';
import { ThemeAccordion } from './ThemeAccordion';
import { BoardHeader } from './BoardHeader';
import { BoardSearch } from './BoardSearch';
import { AssetsBoardSkeleton } from './AssetsBoardSkeleton';
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
    // Create a sample asset for demo
    createAssetMutation.mutate({
      name: `New Asset ${Date.now()}`,
      description: 'Sample asset description',
      category: 'uncategorized',
      isPublic: false,
    });
  };
  
  const handleAssetEdit = (asset: any) => {
    // TODO: Open edit modal
    console.log('Edit asset:', asset);
    toast({
      title: 'Edit Asset',
      description: 'Asset editing will be implemented in a future update',
    });
  };
  
  const handleAssetDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      deleteAssetMutation.mutate({ id });
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
      <BoardHeader 
        totalAssets={assets.length}
        totalThemes={themes.length}
        selectedAssetId={selectedAssetId}
        onCreateAsset={handleCreateAsset}
      />
      
      <BoardSearch
        search={search}
        onSearchChange={setSearch}
        themeFilter={themeFilter}
        onThemeFilterChange={setThemeFilter}
        availableThemes={themes}
      />
      
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
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              No assets in your portfolio yet
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Start building your portfolio by adding your first asset
            </p>
            <button
              onClick={handleCreateAsset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Add Your First Asset
            </button>
          </div>
        )}
      </div>
      
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