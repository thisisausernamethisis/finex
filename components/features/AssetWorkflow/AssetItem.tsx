'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Layers } from 'lucide-react';

interface WorkflowCard {
  id: string;
  title: string;
  content: string;
  importance: number;
  source?: string;
}

interface WorkflowTheme {
  id: string;
  name: string;
  description?: string;
  category: string;
  cards: WorkflowCard[];
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

interface AssetItemProps {
  asset: WorkflowAsset;
}

export const AssetItem = memo(function AssetItem({
  asset
}: AssetItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalCards = (themes: WorkflowTheme[]) => {
    return themes.reduce((sum, theme) => sum + (theme.cards?.length || 0), 0);
  };

  return (
    <Card key={asset.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {asset.name}
              <Badge variant="outline">
                {asset.themes?.length || 0} themes
              </Badge>
              <Badge variant="secondary">
                {getTotalCards(asset.themes || [])} cards
              </Badge>
            </CardTitle>
            {asset.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {asset.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              {asset.growthValue && (
                <span>Growth Value: {asset.growthValue}</span>
              )}
              <span>Created: {formatDate(asset.createdAt)}</span>
              <span>Updated: {formatDate(asset.updatedAt)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Simplified Themes Display */}
        {asset.themes && asset.themes.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Themes & Research Cards
            </h4>
            <div className="grid gap-2">
              {asset.themes.map((theme) => (
                <div key={theme.id} className="border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4" />
                    <span className="font-medium">{theme.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {theme.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
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
              No themes yet. This asset needs research themes and supporting evidence.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});