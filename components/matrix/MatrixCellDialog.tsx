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
import { MatrixAnalysisDetail } from './MatrixAnalysisDetail';

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Matrix Cell Analysis</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
            <span className="ml-2 text-sm text-muted-foreground">Loading detailed analysis...</span>
          </div>
        ) : (
          <MatrixAnalysisDetail
            assetName={calculation.assetName}
            scenarioName={calculation.scenarioName}
            impactScore={calculation.impact}
            confidenceLevel={calculation.confidenceScore}
            reasoning={calculation.explanation}
            evidence={detailedAnalysis?.evidence || []}
            analysisReasoning={detailedAnalysis?.reasoning}
            confidenceBreakdown={detailedAnalysis?.confidenceBreakdown}
            generatedAt={detailedAnalysis?.generatedAt}
            processingTime={detailedAnalysis?.processingTime}
          />
        )}
        
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