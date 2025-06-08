import { cn } from '@/lib/utils';

interface MatrixRowHeaderProps {
  asset: {
    id: string;
    name: string;
    avgImpact?: number; // Add resilience score
  };
  className?: string;
}

export function MatrixRowHeader({ asset, className }: MatrixRowHeaderProps) {
  
  return (
    <div 
      className={cn(
        "matrix-row-header bg-background border-r border-b p-3 min-h-16",
        "flex flex-col justify-center border-l-4 border-l-gray-500",
        "bg-gray-100 text-gray-700",
        className
      )}
    >
      {/* Asset name */}
      <div className="font-medium text-sm leading-tight mb-1" title={asset.name}>
        {asset.name}
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