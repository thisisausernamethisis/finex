'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useAssets, useCreateAsset, Asset } from '@/lib/hooks/assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { AssetCreationForm } from './AssetCreationForm';
import { AssetItem } from './AssetItem';
import { WorkflowErrorBoundary } from '@/components/common/WorkflowErrorBoundary';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';

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
  const { handleError, createErrorFromResponse } = useErrorHandler();
  
  // Asset management state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Data hooks
  const { data: assetsData, isLoading, refetch } = useAssets();
  
  const createAssetMutation = useCreateAsset({
    onSuccess: () => {
      setShowCreateForm(false);
      refetch();
    }
  });
  

  // Memoized assets data
  const assets: Asset[] = useMemo(() => assetsData?.data || [], [assetsData?.data]);

  // Asset management callbacks
  const handleCreateAsset = useCallback((assetData: { name: string; description: string; growthValue: string }) => {
    const payload: any = {
      name: assetData.name.trim(),
      description: assetData.description.trim() || undefined,
      isPublic: false,
    };

    if (assetData.growthValue) {
      const growthNum = parseFloat(assetData.growthValue);
      if (!isNaN(growthNum)) {
        payload.growthValue = growthNum;
      }
    }

    createAssetMutation.mutate(payload);
  }, [createAssetMutation]);


  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <WorkflowErrorBoundary 
      phase={1} 
      phaseLabel="Asset Research & Theme Organization"
      onRetry={() => refetch()}
    >
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building2 className="w-5 h-5" />
              Asset Research & Theme Organization
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Phase 1: Create assets, organize themes, and populate research cards for comprehensive analysis.
              Assets will appear as rows in your matrix analysis.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {assets.length} assets created
              </div>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Asset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Asset Form */}
        {showCreateForm && (
          <AssetCreationForm
            onSubmit={handleCreateAsset}
            onCancel={() => setShowCreateForm(false)}
            isLoading={createAssetMutation.isPending}
          />
        )}

        {/* Assets List */}
        <div className="space-y-4">
          {assets.length > 0 ? (
            assets.map((asset) => (
              <AssetItem
                key={asset.id}
                asset={asset as WorkflowAsset}
              />
            ))
          ) : (
            <Card className="border-dashed border-2 border-muted-foreground/25">
              <CardContent className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Start Your Asset Research</h3>
                  <p className="text-muted-foreground mb-6">
                    Begin Phase 1 by creating your first asset. Build comprehensive profiles with research themes and supporting data.
                  </p>
                  <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Asset
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    💡 Tip: Start with 3-5 key assets to keep your analysis manageable
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Loading indicators */}
        {createAssetMutation.isPending && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg">
            Creating asset...
          </div>
        )}
      </div>
    </WorkflowErrorBoundary>
  );
}