import { Asset } from '@/lib/hooks/assets';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  TrendingUp, 
  Target,
  MoveHorizontal,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedAssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToTheme?: (themeId: string) => void;
  showMoveOptions?: boolean;
}

export function EnhancedAssetCard({ 
  asset, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  onMoveToTheme,
  showMoveOptions = false
}: EnhancedAssetCardProps) {
  return (
    <Card 
      className={`hover:shadow-md transition-all cursor-pointer group ${
        isSelected ? 'ring-2 ring-primary shadow-lg bg-primary/5' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {asset.name}
          </h3>
          {asset.category && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {asset.category}
            </Badge>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Asset
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {showMoveOptions && onMoveToTheme && (
              <DropdownMenuItem 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  // TODO: Show theme selection dialog
                  console.log('Move to theme:', asset.id);
                }}
              >
                <MoveHorizontal className="mr-2 h-4 w-4" />
                Move to Theme
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {asset.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {asset.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          {asset.growthValue ? (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                ${asset.growthValue.toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No growth data
            </div>
          )}
          
          {asset.categoryConfidence && asset.categoryConfidence > 0 && (
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {Math.round(asset.categoryConfidence * 100)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Asset Themes Preview */}
        {asset.themes && asset.themes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.themes.slice(0, 2).map((theme, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {typeof theme === 'string' ? theme : theme.name || 'Theme'}
              </Badge>
            ))}
            {asset.themes.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{asset.themes.length - 2} more
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            Updated {formatDistanceToNow(new Date(asset.updatedAt), { addSuffix: true })}
          </span>
          {isSelected && (
            <Badge variant="default" className="text-xs">
              Selected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 