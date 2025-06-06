'use client';

import { useState } from 'react';
import { AssetBoard } from '@/components/board/AssetBoard';

export default function AssetsPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <AssetBoard
          selectedAssetId={selectedAssetId}
          onAssetSelect={setSelectedAssetId}
          onAssetDeselect={() => setSelectedAssetId(undefined)}
        />
      </div>
    </div>
  );
} 