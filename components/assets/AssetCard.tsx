import { Asset } from '@/lib/hooks/assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, TrendingUp, Loader2 } from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
  onEdit: (data: Partial<Asset>) => void;
  onDelete: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function AssetCard({ 
  asset, 
  onEdit, 
  onDelete,
  isUpdating,
  isDeleting 
}: AssetCardProps) {

  return (
    <Card className="relative">
      {/* Optimistic update overlay */}
      {(isUpdating || isDeleting) && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{asset.name}</CardTitle>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                disabled={isUpdating || isDeleting}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                onClick={() => onEdit({})}
                disabled={isUpdating || isDeleting}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                disabled={isUpdating || isDeleting}
                className="text-red-600"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        {asset.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {asset.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm">
          {asset.growthValue && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                {asset.growthValue}% growth
              </span>
            </div>
          )}
          
          {asset.themes && asset.themes.length > 0 && (
            <div className="text-muted-foreground">
              {asset.themes.length} theme{asset.themes.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 