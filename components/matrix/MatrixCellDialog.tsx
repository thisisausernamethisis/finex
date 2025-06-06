import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Info,
  AlertTriangle,
  Target
} from 'lucide-react';
import { MatrixCalculation, useMatrixCellAnalysis } from '@/lib/hooks/matrix';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface MatrixCellDialogProps {
  assetId?: string;
  scenarioId?: string;
  calculation?: MatrixCalculation;
  isOpen: boolean;
  onClose: () => void;
}

export function MatrixCellDialog({ 
  assetId, 
  scenarioId, 
  calculation, 
  isOpen, 
  onClose 
}: MatrixCellDialogProps) {
  const { data: detailedAnalysis, isLoading } = useMatrixCellAnalysis(assetId, scenarioId);
  
  if (!calculation || !assetId || !scenarioId) {
    return null;
  }
  
  const getImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (impact < 0) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Activity className="h-5 w-5 text-gray-600" />;
  };
  
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };
  
  const getImpactColor = (impact: number) => {
    if (impact > 3) return 'text-green-700 bg-green-50';
    if (impact > 1) return 'text-green-600 bg-green-50';
    if (impact > 0) return 'text-green-500 bg-green-50';
    if (impact === 0) return 'text-gray-600 bg-gray-50';
    if (impact > -1) return 'text-red-500 bg-red-50';
    if (impact > -3) return 'text-red-600 bg-red-50';
    return 'text-red-700 bg-red-50';
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getImpactIcon(calculation.impact)}
              <span>Impact Analysis</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-lg font-bold ${getImpactColor(calculation.impact)}`}>
              {calculation.impact > 0 ? '+' : ''}{calculation.impact}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Asset & Scenario Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Asset
              </h4>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{calculation.assetName}</div>
                <div className="text-sm text-muted-foreground">{calculation.assetCategory}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Scenario
              </h4>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{calculation.scenarioName}</div>
                <div className="text-sm text-muted-foreground">{calculation.scenarioType}</div>
              </div>
            </div>
          </div>
          
          {/* Impact Metrics */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Info className="h-4 w-4" />
              Impact Metrics
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{calculation.impact}</div>
                <div className="text-sm text-muted-foreground">Impact Score</div>
                <div className="text-xs mt-1">(-5 to +5 scale)</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{Math.round(calculation.confidenceScore * 100)}%</div>
                <div className="text-sm text-muted-foreground">Confidence</div>
                <div className="text-xs mt-1">Model certainty</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <Badge variant={getRiskColor(calculation.riskLevel) as any} className="text-lg px-3 py-1">
                  {calculation.riskLevel}
                </Badge>
                <div className="text-sm text-muted-foreground mt-2">Risk Level</div>
              </div>
            </div>
          </div>
          
          {/* Breakdown (if available) */}
          {calculation.breakdown && (
            <div className="space-y-3">
              <h4 className="font-semibold">Impact Breakdown</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Base Impact:</span>
                  <span className="font-medium">{calculation.breakdown.baseImpact}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Technology Multiplier:</span>
                  <span className="font-medium">{calculation.breakdown.technologyMultiplier}x</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Timeline Adjustment:</span>
                  <span className="font-medium">{calculation.breakdown.timelineAdjustment}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Confidence Score:</span>
                  <span className="font-medium">{Math.round(calculation.breakdown.confidenceScore * 100)}%</span>
                </div>
              </div>
            </div>
          )}
          
          <Separator />
          
          {/* Analysis Explanation */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Analysis
            </h4>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm leading-relaxed">{calculation.explanation}</p>
            </div>
          </div>
          
          {/* Detailed Analysis (if loading/available) */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-sm text-muted-foreground">Loading detailed analysis...</span>
            </div>
          )}
          
          {detailedAnalysis && (
            <div className="space-y-3">
              <h4 className="font-semibold">Detailed Analysis</h4>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm leading-relaxed text-blue-900">
                  {detailedAnalysis.detailedExplanation || 'Additional analysis data would appear here.'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple loading spinner component if not exists
function LoadingSpinnerFallback() {
  return (
    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
  );
} 