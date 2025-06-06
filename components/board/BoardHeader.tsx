import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutGrid, Settings, Plus, Filter, FileText, ChevronDown, Zap } from 'lucide-react';
import Link from 'next/link';

interface BoardHeaderProps {
  totalAssets: number;
  totalThemes: number;
  selectedAssetId?: string;
  onCreateAsset?: () => void;
  onQuickCreateAsset?: () => void;
}

export function BoardHeader({ 
  totalAssets, 
  totalThemes, 
  selectedAssetId,
  onCreateAsset,
  onQuickCreateAsset
}: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Asset Board</h1>
          <Badge variant="secondary" className="text-xs">
            Phase 1: Asset Research
          </Badge>
        </div>
        <div className="flex items-center gap-2">
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
          asChild
        >
          <Link href="/templates">
            <FileText className="w-4 h-4 mr-2" />
            FileTexts
          </Link>
        </Button>
        
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
              <ChevronDown className="w-3 h-3 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCreateAsset}>
              <FileText className="w-4 h-4 mr-2" />
              From FileText
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onQuickCreateAsset}>
              <Zap className="w-4 h-4 mr-2" />
              Quick Create
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 