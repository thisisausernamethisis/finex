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
  const formatCategory = (category?: string) => {
    if (!category) return null;
    
    const categoryLabels: Record<string, string> = {
      'AI_COMPUTE': 'AI/Compute',
      'ROBOTICS_PHYSICAL_AI': 'Robotics/Physical AI',
      'QUANTUM_COMPUTING': 'Quantum Computing',
      'BIOTECH_HEALTH': 'Biotech/Health',
      'FINTECH_CRYPTO': 'Fintech/Crypto',
      'ENERGY_CLEANTECH': 'Energy/Cleantech',
      'SPACE_DEFENSE': 'Space/Defense',
      'TRADITIONAL_TECH': 'Traditional Tech',
      'OTHER': 'Other',
    };
    
    return categoryLabels[category] || category;
  };

  const getCategoryColor = (category?: string) => {
    const colorMap: Record<string, string> = {
      'AI_COMPUTE': 'bg-blue-100 text-blue-800',
      'ROBOTICS_PHYSICAL_AI': 'bg-purple-100 text-purple-800',
      'QUANTUM_COMPUTING': 'bg-green-100 text-green-800',
      'BIOTECH_HEALTH': 'bg-red-100 text-red-800',
      'FINTECH_CRYPTO': 'bg-yellow-100 text-yellow-800',
      'ENERGY_CLEANTECH': 'bg-emerald-100 text-emerald-800',
      'SPACE_DEFENSE': 'bg-indigo-100 text-indigo-800',
      'TRADITIONAL_TECH': 'bg-gray-100 text-gray-800',
      'OTHER': 'bg-slate-100 text-slate-800',
    };
    
    return colorMap[category || ''] || 'bg-gray-100 text-gray-800';
  };

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
            <div className="flex flex-wrap gap-2 mt-2">
              {asset.category && (
                <Badge 
                  variant="secondary" 
                  className={getCategoryColor(asset.category)}
                >
                  {formatCategory(asset.category)}
                </Badge>
              )}
              {asset.categoryConfidence && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(asset.categoryConfidence * 100)}% confidence
                </Badge>
              )}
            </div>
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