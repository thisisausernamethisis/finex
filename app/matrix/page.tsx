'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMatrixCalculation } from '@/lib/hooks/matrix';
import { useWorkflow } from '@/lib/hooks/workflow';
import { MatrixSkeleton } from '@/components/matrix/MatrixSkeleton';
import { MatrixStrategicInsights } from '@/components/matrix/MatrixStrategicInsights';
import { MatrixGrid } from '@/components/matrix/MatrixGrid';
import { MatrixToolbar, MatrixFilters } from '@/components/matrix/MatrixToolbar';
import { MatrixCellDialog } from '@/components/matrix/MatrixCellDialog';
import { MatrixErrorBoundary } from '@/components/matrix/MatrixErrorBoundary';
import { MatrixProcessingStatus } from '@/components/matrix/MatrixProcessingStatus';
import { ContextualHelp, WorkflowStepIndicator } from '@/components/common/ContextualHelp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, TrendingUp, Lock } from 'lucide-react';
import Link from 'next/link';

export default function MatrixPage() {
  const workflow = useWorkflow();
  const router = useRouter();
  const canAccessMatrix = workflow.canAccessPhase(3);
  
  // Always call hooks at the top level
  const { data: matrixData, isLoading, isError, error, refetch } = useMatrixCalculation('detailed');
  
  // State management
  const [selectedCell, setSelectedCell] = useState<{ assetId: string; scenarioId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MatrixFilters>({});
  const [showProcessingStatus, setShowProcessingStatus] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check access to matrix phase and redirect if needed
  useEffect(() => {
    if (!canAccessMatrix) {
      // Redirect to appropriate phase based on completion
      if (!workflow.canAccessPhase(2)) {
        router.push('/dashboard'); // Go to assets
      } else {
        router.push('/scenarios'); // Go to scenarios
      }
    }
  }, [canAccessMatrix, workflow, router]);
  
  // Show loading while checking access or if access is denied
  if (!canAccessMatrix) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Matrix Access Locked</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Complete previous phases to unlock matrix analysis:
            </p>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${workflow.canAccessPhase(1) ? 'text-green-600' : 'text-muted-foreground'}`}>
                {workflow.canAccessPhase(1) ? '✓' : '○'} Phase 1: Assets
              </div>
              <div className={`flex items-center gap-2 ${workflow.canAccessPhase(2) ? 'text-green-600' : 'text-muted-foreground'}`}>
                {workflow.canAccessPhase(2) ? '✓' : '○'} Phase 2: Scenarios
              </div>
              <div className={`flex items-center gap-2 ${workflow.canAccessPhase(3) ? 'text-green-600' : 'text-muted-foreground'}`}>
                {workflow.canAccessPhase(3) ? '✓' : '○'} Phase 3: Matrix Analysis
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Continue Setup
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter and search logic
  const getFilteredCalculations = () => {
    if (!matrixData?.calculations) return [];
    
    let filtered = matrixData.calculations;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(calc => 
        calc.assetName.toLowerCase().includes(query) ||
        calc.scenarioName.toLowerCase().includes(query) ||
        calc.scenarioType.toLowerCase().includes(query)
      );
    }
    
    
    if (filters.scenarioType && filters.scenarioType !== 'all') {
      filtered = filtered.filter(calc => calc.scenarioType.toLowerCase() === filters.scenarioType?.toLowerCase());
    }
    
    if (filters.riskLevel && filters.riskLevel !== 'all') {
      filtered = filtered.filter(calc => calc.riskLevel === filters.riskLevel);
    }
    
    // Apply impact range filter
    if (filters.impactRange) {
      const { min, max } = filters.impactRange;
      filtered = filtered.filter(calc => calc.impact >= min && calc.impact <= max);
    }
    
    return filtered;
  };

  const handleCellClick = (assetId: string, scenarioId: string) => {
    setSelectedCell({ assetId, scenarioId });
  };

  const handleExport = () => {
    // Simple CSV export functionality
    const calculations = getFilteredCalculations();
    const csvData = [
      ['Asset', 'Scenario', 'Type', 'Impact', 'Risk Level', 'Confidence'],
      ...calculations.map(calc => [
        calc.assetName,
        calc.scenarioName,
        calc.scenarioType,
        calc.impact.toString(),
        calc.riskLevel,
        Math.round(calc.confidenceScore * 100).toString() + '%'
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matrix-analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRecalculateMatrix = () => {
    setIsProcessing(true);
    setShowProcessingStatus(true);
    
    // Simulate starting matrix recalculation
    setTimeout(() => {
      refetch();
      // Processing will continue in background, status component will show progress
    }, 1000);
  };

  const handlePauseJob = (jobId: string) => {
    console.log('Pausing job:', jobId);
    // Implement job pause logic
  };

  const handleResumeJob = (jobId: string) => {
    console.log('Resuming job:', jobId);
    // Implement job resume logic
  };

  const handleCancelJob = (jobId: string) => {
    console.log('Cancelling job:', jobId);
    // Implement job cancellation logic
  };

  const handleRetryJob = (jobId: string) => {
    console.log('Retrying job:', jobId);
    // Implement job retry logic
  };

  const selectedCalculation = selectedCell 
    ? matrixData?.calculations.find(c => 
        c.assetId === selectedCell.assetId && c.scenarioId === selectedCell.scenarioId
      )
    : undefined;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Asset-Scenario Impact Matrix</h1>
          <p className="text-muted-foreground mt-2">
            Analyze how different scenarios impact your portfolio assets
          </p>
        </div>
        <MatrixSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <MatrixErrorBoundary 
          error={error} 
          onRetry={() => refetch()} 
        />
      </div>
    );
  }

  if (!matrixData || !matrixData.calculations.length) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Impact Matrix Analysis</h1>
              <Badge variant="secondary" className="text-xs">
                Phase 3: Matrix Generation
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                Interactive analysis of how different scenarios impact your portfolio assets.
              </p>
            </div>
          </div>
          <ContextualHelp 
            phase={3} 
            triggerText="Phase 3 Help"
            className="ml-4"
          />
        </div>

        {/* Phase 3 Progress Indicator */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <WorkflowStepIndicator
              currentStep={3}
              totalSteps={4}
              stepLabels={[
                'Asset Research & Theme Organization',
                'Scenario Planning & Definition',
                'Matrix Generation & Analysis',
                'Strategic Insights & Recommendations'
              ]}
            />
          </CardContent>
        </Card>

        {/* Enhanced Empty State */}
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="text-center py-12">
            <div className="max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="grid grid-cols-2 gap-1">
                  <div className="w-2 h-2 bg-primary rounded"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded"></div>
                  <div className="w-2 h-2 bg-primary/40 rounded"></div>
                  <div className="w-2 h-2 bg-primary/20 rounded"></div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to Generate Impact Matrix</h3>
              <p className="text-muted-foreground mb-6">
                Phase 3 analyzes how your Phase 2 scenarios impact your Phase 1 assets. The AI will generate impact scores, confidence levels, and detailed reasoning for every combination.
              </p>
              
              {/* Prerequisites Check */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-medium mb-3">Prerequisites Check:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Phase 1: Assets created ✓</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Phase 2: Scenarios defined ✓</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Phase 3: Matrix analysis pending</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRecalculateMatrix}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                  Generate Matrix Analysis
                </button>
                <button 
                  onClick={() => refetch()}
                  className="px-6 py-3 border border-input bg-background rounded-lg hover:bg-accent hover:text-accent-foreground"
                >
                  Refresh Data
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                💡 Matrix generation analyzes every asset × scenario combination using AI to provide impact scores and strategic insights
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredCalculations = getFilteredCalculations();

  return (
    <MatrixErrorBoundary>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Impact Matrix Analysis</h1>
              <Badge variant="secondary" className="text-xs">
                Phase 3: Matrix Generation
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                Interactive analysis of how different scenarios impact your portfolio assets.
                Click on any cell for detailed analysis.
              </p>
            </div>
          </div>
          <ContextualHelp 
            phase={3} 
            triggerText="Phase 3 Help"
            className="ml-4"
          />
        </div>

        {/* Phase 3 Progress Indicator */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <WorkflowStepIndicator
              currentStep={3}
              totalSteps={4}
              stepLabels={[
                'Asset Research & Theme Organization',
                'Scenario Planning & Definition',
                'Matrix Generation & Analysis',
                'Strategic Insights & Recommendations'
              ]}
            />
          </CardContent>
        </Card>

        {/* Portfolio Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{matrixData.portfolioMetrics.totalAssets}</div>
            <div className="text-sm text-muted-foreground">Assets</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{matrixData.portfolioMetrics.totalScenarios}</div>
            <div className="text-sm text-muted-foreground">Scenarios</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">
              {matrixData.portfolioMetrics.averageImpact > 0 ? '+' : ''}
              {matrixData.portfolioMetrics.averageImpact.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Impact</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className={`text-2xl font-bold ${
              matrixData.portfolioMetrics.riskLevel === 'HIGH' ? 'text-red-600' :
              matrixData.portfolioMetrics.riskLevel === 'MEDIUM' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {matrixData.portfolioMetrics.riskLevel}
            </div>
            <div className="text-sm text-muted-foreground">Risk Level</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{Math.round(matrixData.portfolioMetrics.opportunityScore)}%</div>
            <div className="text-sm text-muted-foreground">Opportunity</div>
          </div>
        </div>

        {/* Toolbar */}
        <MatrixToolbar
          onSearch={setSearchQuery}
          onFilterChange={setFilters}
          onRefresh={handleRecalculateMatrix}
          onExport={handleExport}
          onGenerate={handleRecalculateMatrix}
          isLoading={isLoading || isProcessing}
          matrixStats={{
            totalCalculations: matrixData.calculations.length,
            avgConfidence: matrixData.calculations.reduce((sum, calc) => sum + calc.confidenceScore, 0) / matrixData.calculations.length,
            lastUpdated: 'just now'
          }}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Matrix Grid - Takes up 3/4 on extra large screens */}
          <div className="xl:col-span-3">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Impact Matrix</h2>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCalculations.length} of {matrixData.calculations.length} calculations
                </div>
              </div>
              
              {filteredCalculations.length > 0 ? (
                <MatrixGrid
                  calculations={filteredCalculations}
                  onCellClick={handleCellClick}
                  selectedCell={selectedCell || undefined}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No calculations match your current filters.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Insights Panel - Takes up 1/4 on extra large screens */}
          <div className="xl:col-span-1">
            <MatrixStrategicInsights 
              calculations={filteredCalculations} 
              isLoading={isLoading} 
            />
          </div>
        </div>

        {/* Cell Detail Dialog */}
        <MatrixCellDialog
          assetId={selectedCell?.assetId}
          scenarioId={selectedCell?.scenarioId}
          calculation={selectedCalculation}
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
        />

        {/* Next Steps to Phase 4 */}
        {filteredCalculations.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" />
                Ready for Strategic Analysis?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-2">
                    Your impact matrix is complete. Move to Phase 4 to discover AI-powered strategic insights and portfolio recommendations.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {filteredCalculations.length} impact relationships analyzed
                    </span>
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      AI insights ready
                    </span>
                  </div>
                </div>
                <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Link href="/dashboard">
                    Phase 4: Strategic Analysis
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matrix Processing Status */}
        <MatrixProcessingStatus
          isVisible={showProcessingStatus}
          onClose={() => setShowProcessingStatus(false)}
          onPauseJob={handlePauseJob}
          onResumeJob={handleResumeJob}
          onCancelJob={handleCancelJob}
          onRetryJob={handleRetryJob}
        />
      </div>
    </MatrixErrorBoundary>
  );
} 