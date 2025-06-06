import { Asset } from '@/lib/hooks/assets';
import { AssetCard } from './AssetCard';

interface AssetsGridProps {
  assets: Asset[];
  onEdit: (id: string, data: Partial<Asset>) => void;
  onDelete: (id: string) => void;
  isUpdating?: string;
  isDeleting?: string;
}

export function AssetsGrid({ 
  assets, 
  onEdit, 
  onDelete,
  isUpdating,
  isDeleting 
}: AssetsGridProps) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No assets found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search criteria or create your first asset.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onEdit={(data) => onEdit(asset.id, data)}
          onDelete={() => onDelete(asset.id)}
          isUpdating={isUpdating === asset.id}
          isDeleting={isDeleting === asset.id}
        />
      ))}
    </div>
  );
} 