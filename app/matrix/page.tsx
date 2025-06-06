'use client';

import { useState } from 'react';
import { useMatrixCalculation } from '@/lib/hooks/matrix';
import { MatrixSkeleton } from '@/components/matrix/MatrixSkeleton';
import { MatrixStrategicInsights } from '@/components/matrix/MatrixStrategicInsights';
import { MatrixGrid } from '@/components/matrix/MatrixGrid';
import { MatrixToolbar, MatrixFilters } from '@/components/matrix/MatrixToolbar';
import { MatrixCellDialog } from '@/components/matrix/MatrixCellDialog';
import { MatrixErrorBoundary } from '@/components/matrix/MatrixErrorBoundary';

export default function MatrixPage() {
  const { data: matrixData, isLoading, isError, error, refetch } = useMatrixCalculation('detailed');
  
  // State management
  const [selectedCell, setSelectedCell] = useState<{ assetId: string; scenarioId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MatrixFilters>({});

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
        calc.assetCategory.toLowerCase().includes(query) ||
        calc.scenarioType.toLowerCase().includes(query)
      );
    }
    
    // Apply category filters
    if (filters.assetCategory && filters.assetCategory !== 'all') {
      filtered = filtered.filter(calc => calc.assetCategory.toLowerCase() === filters.assetCategory?.toLowerCase());
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
      ['Asset', 'Category', 'Scenario', 'Type', 'Impact', 'Risk Level', 'Confidence'],
      ...calculations.map(calc => [
        calc.assetName,
        calc.assetCategory, 
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No matrix data available</h2>
          <p className="text-muted-foreground mb-4">
            Please ensure you have assets and scenarios configured to see the impact matrix.
          </p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  const filteredCalculations = getFilteredCalculations();

  return (
    <MatrixErrorBoundary>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Asset-Scenario Impact Matrix</h1>
          <p className="text-muted-foreground mt-2">
            Interactive analysis of how different scenarios impact your portfolio assets.
            Click on any cell for detailed analysis.
          </p>
        </div>

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
          onRefresh={() => refetch()}
          onExport={handleExport}
          isLoading={isLoading}
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
      </div>
    </MatrixErrorBoundary>
  );
} 