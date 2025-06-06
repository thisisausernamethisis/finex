import { Asset } from '@/lib/hooks/assets';
import { AssetTheme, getThemeColorClasses } from '@/lib/utils/assetThemes';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EnhancedAssetCard } from './EnhancedAssetCard';
import { Plus, Settings, MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react';

interface ThemeAccordionProps {
  theme: AssetTheme;
  selectedAssetId?: string;
  onAssetSelect: (id: string) => void;
  onAssetEdit: (asset: Asset) => void;
  onAssetDelete: (id: string) => void;
  onAddAssetToTheme?: (themeId: string) => void;
  onEditTheme?: (theme: AssetTheme) => void;
  onDeleteTheme?: (themeId: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function ThemeAccordion({
  theme,
  selectedAssetId,
  onAssetSelect,
  onAssetEdit,
  onAssetDelete,
  onAddAssetToTheme,
  onEditTheme,
  onDeleteTheme,
  isExpanded,
  onToggle
}: ThemeAccordionProps) {
  const ThemeIcon = theme.icon;
  const colorClasses = getThemeColorClasses(theme.color);
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Theme Header - Always Visible */}
      <div className="bg-card">
        <button
          onClick={onToggle}
          className="w-full px-4 py-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
        >
          <div className={`w-10 h-10 rounded-full ${colorClasses.bg} flex items-center justify-center flex-shrink-0`}>
            <ThemeIcon className={`w-5 h-5 ${colorClasses.text}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base">{theme.name}</h3>
              <Badge variant="outline" className="text-xs">
                {theme.assets.length} {theme.assets.length === 1 ? 'asset' : 'assets'}
              </Badge>
              {theme.confidence > 0.7 && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(theme.confidence * 100)}% confidence
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{theme.description}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddAssetToTheme?.(theme.id);
              }}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <Plus className="w-4 h-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="opacity-70 hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditTheme?.(theme)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Theme
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddAssetToTheme?.(theme.id)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Asset
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteTheme?.(theme.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Theme
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className={`w-6 h-6 rounded-full ${colorClasses.bg} flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              } ${colorClasses.text.replace('text-', 'bg-')}`} />
            </div>
          </div>
        </button>
      </div>
      
      {/* Theme Content - Collapsible */}
      {isExpanded && (
        <div className="border-t bg-muted/20">
          <div className="p-4">
            {theme.assets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {theme.assets.map((asset) => (
                  <EnhancedAssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAssetId === asset.id}
                    onSelect={() => onAssetSelect(asset.id)}
                    onEdit={() => onAssetEdit(asset)}
                    onDelete={() => onAssetDelete(asset.id)}
                    showMoveOptions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className={`w-16 h-16 rounded-full ${colorClasses.bg} flex items-center justify-center mx-auto mb-4`}>
                  <ThemeIcon className={`w-8 h-8 ${colorClasses.text}`} />
                </div>
                <h4 className="font-medium text-sm mb-2">No assets in {theme.name}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Add assets to this theme to start building your portfolio
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAddAssetToTheme?.(theme.id)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Asset
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 