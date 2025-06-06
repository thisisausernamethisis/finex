import { cn } from '@/lib/utils';

interface MatrixRowHeaderProps {
  asset: {
    id: string;
    name: string;
    category: string;
    avgImpact?: number; // Add resilience score
  };
  className?: string;
}

export function MatrixRowHeader({ asset, className }: MatrixRowHeaderProps) {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technology': return 'bg-blue-100 text-blue-700 border-l-blue-500';
      case 'finance': return 'bg-green-100 text-green-700 border-l-green-500';
      case 'healthcare': return 'bg-red-100 text-red-700 border-l-red-500';
      case 'energy': return 'bg-yellow-100 text-yellow-700 border-l-yellow-500';
      case 'manufacturing': return 'bg-purple-100 text-purple-700 border-l-purple-500';
      case 'retail': return 'bg-orange-100 text-orange-700 border-l-orange-500';
      default: return 'bg-gray-100 text-gray-700 border-l-gray-500';
    }
  };
  
  return (
    <div 
      className={cn(
        "matrix-row-header bg-background border-r border-b p-3 min-h-16",
        "flex flex-col justify-center border-l-4",
        getCategoryColor(asset.category),
        className
      )}
    >
      {/* Asset name */}
      <div className="font-medium text-sm leading-tight mb-1" title={asset.name}>
        {asset.name}
      </div>
      
      {/* Asset category */}
      <div className="text-xs opacity-75 mb-1">
        {asset.category}
      </div>
      
      {/* Resilience score (average impact) */}
      {asset.avgImpact !== undefined && (
        <div className={`text-xs font-bold ${
          asset.avgImpact > 0 ? 'text-green-600' : 
          asset.avgImpact < 0 ? 'text-red-600' : 'text-gray-600'
        }`}>
          Resilience: {asset.avgImpact > 0 ? '+' : ''}{asset.avgImpact.toFixed(1)}
        </div>
      )}
    </div>
  );
} 