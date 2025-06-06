import { cn } from '@/lib/utils';
import { MatrixCalculation } from '@/lib/hooks/matrix';

interface MatrixCellProps {
  assetId: string;
  scenarioId: string;
  calculation?: MatrixCalculation;
  isSelected?: boolean;
  onClick: () => void;
}

export function MatrixCell({ 
  assetId, 
  scenarioId, 
  calculation, 
  isSelected = false, 
  onClick 
}: MatrixCellProps) {
  
  const getImpactColor = (impact: number) => {
    if (impact > 3) return 'bg-green-600 text-white';
    if (impact > 1) return 'bg-green-400 text-white';
    if (impact > 0) return 'bg-green-200 text-green-900';
    if (impact === 0) return 'bg-gray-100 text-gray-600';
    if (impact > -1) return 'bg-red-200 text-red-900';
    if (impact > -3) return 'bg-red-400 text-white';
    return 'bg-red-600 text-white';
  };
  
  const getRiskBorderColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'border-red-500';
      case 'MEDIUM': return 'border-yellow-500';
      case 'LOW': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };
  
  if (!calculation) {
    return (
      <div 
        className={cn(
          "matrix-cell h-16 border-r border-b flex items-center justify-center",
          "bg-gray-50 text-gray-400 cursor-not-allowed",
          isSelected && "ring-2 ring-blue-500"
        )}
      >
        <span className="text-xs">N/A</span>
      </div>
    );
  }
  
  const { impact, confidenceScore, riskLevel } = calculation;
  
  return (
    <div 
      className={cn(
        "matrix-cell h-16 border-r border-b p-2 cursor-pointer",
        "transition-all duration-200 hover:shadow-md hover:z-10",
        "flex flex-col items-center justify-center relative",
        getImpactColor(impact),
        getRiskBorderColor(riskLevel),
        isSelected && "ring-2 ring-blue-500 shadow-lg z-20"
      )}
      onClick={onClick}
      title={`${calculation.assetName} × ${calculation.scenarioName}\nImpact: ${impact}\nRisk: ${riskLevel}\nConfidence: ${Math.round(confidenceScore * 100)}%`}
    >
      {/* Impact score - Made more prominent */}
      <div className="text-xl font-extrabold mb-1">
        {impact > 0 ? '+' : ''}{impact}
      </div>
      
      {/* Confidence indicator */}
      <div className="text-xs opacity-80 font-medium">
        {Math.round(confidenceScore * 100)}% confident
      </div>
      
      {/* Risk level indicator (small dot) */}
      <div 
        className={cn(
          "absolute top-1 right-1 w-2 h-2 rounded-full",
          riskLevel === 'HIGH' && "bg-red-600",
          riskLevel === 'MEDIUM' && "bg-yellow-500",
          riskLevel === 'LOW' && "bg-green-500"
        )}
      />
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
      )}
    </div>
  );
} 