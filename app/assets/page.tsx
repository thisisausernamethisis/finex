'use client';

import { useState } from 'react';
import { AssetWorkflowManager } from '@/components/features/AssetWorkflow/AssetWorkflowManager';

export default function AssetsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Asset Management</h1>
          <p className="text-muted-foreground">
            Phase 1: Create assets, organize themes, and populate research cards for matrix analysis
          </p>
        </div>
        
        <AssetWorkflowManager />
      </div>
    </div>
  );
} 