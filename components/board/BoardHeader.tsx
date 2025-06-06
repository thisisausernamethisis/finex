import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, Settings, Plus, Filter } from 'lucide-react';

interface BoardHeaderProps {
  totalAssets: number;
  totalThemes: number;
  selectedAssetId?: string;
  onCreateAsset?: () => void;
}

export function BoardHeader({ 
  totalAssets, 
  totalThemes, 
  selectedAssetId,
  onCreateAsset
}: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Asset Board</h1>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-muted-foreground">
            {totalAssets} assets organized across {totalThemes} themes
          </p>
          {selectedAssetId && (
            <Badge variant="default" className="text-xs">
              1 selected
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // TODO: Toggle between board and list view
            console.log('Toggle view');
          }}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Board View
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // TODO: Open theme organization settings
            console.log('Organize themes');
          }}
        >
          <Settings className="w-4 h-4 mr-2" />
          Organize
        </Button>
        
        <Button 
          onClick={onCreateAsset}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>
    </div>
  );
} 