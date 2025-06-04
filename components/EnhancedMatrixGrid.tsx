'use client';

import { useState, useEffect } from 'react';
import { Info, TrendingUp, TrendingDown, Zap, RefreshCw, AlertCircle } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  category: 'ai' | 'robotics' | 'quantum' | 'traditional';
  ticker?: string;
}

interface Scenario {
  id: string;
  name: string;
  type: 'TECHNOLOGY' | 'ECONOMIC' | 'GEOPOLITICAL';
  timeline: string;
  description: string;
}

interface MatrixCell {
  assetId: string;
  scenarioId: string;
  impact: number; // -5 to +5
  confidence: number; // 0 to 1
  explanation?: string;
}

interface EnhancedMatrixGridProps {
  assets: Asset[];
  scenarios: Scenario[];
  onCellClick?: (assetId: string, scenarioId: string, cellData: MatrixCell) => void;
  className?: string;
}

const categoryColors = {
  ai: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  robotics: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  quantum: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  traditional: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
};

const scenarioTypeColors = {
  TECHNOLOGY: 'text-blue-600 dark:text-blue-400',
  ECONOMIC: 'text-green-600 dark:text-green-400',
  GEOPOLITICAL: 'text-red-600 dark:text-red-400'
};

function EnhancedMatrixCell({ 
  cell, 
  asset, 
  scenario, 
  isLoading,
  onClick 
}: { 
  cell: MatrixCell | undefined;
  asset: Asset;
  scenario: Scenario;
  isLoading: boolean;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  if (isLoading) {
    return (
      <div className="matrix-cell neutral h-16 flex items-center justify-center">
        <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
      </div>
    );
  }
  
  if (!cell) {
    return (
      <div 
        className="matrix-cell neutral h-16 flex items-center justify-center opacity-30"
        onClick={onClick}
      >
        <span className="text-xs text-muted-foreground">-</span>
      </div>
    );
  }

  const impact = cell.impact;
  const confidence = cell.confidence;
  
  // Enhanced cell appearance logic
  const getCellClass = () => {
    const intensity = Math.abs(impact);
    if (impact > 0) {
      if (intensity > 3) return 'matrix-cell positive bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
      if (intensity > 1.5) return 'matrix-cell positive bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      return 'matrix-cell positive bg-green-25 dark:bg-green-900/10 border-green-100 dark:border-green-900';
    }
    if (impact < 0) {
      if (intensity > 3) return 'matrix-cell negative bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
      if (intensity > 1.5) return 'matrix-cell negative bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      return 'matrix-cell negative bg-red-25 dark:bg-red-900/10 border-red-100 dark:border-red-900';
    }
    return 'matrix-cell neutral bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
  };

  const getImpactIcon = () => {
    if (impact > 2) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (impact < -2) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Zap className="w-3 h-3 text-gray-500" />;
  };

  const getImpactText = () => {
    if (impact > 0) return `+${impact.toFixed(1)}`;
    return impact.toFixed(1);
  };

  const getConfidenceColor = () => {
    if (confidence > 0.8) return 'bg-green-500';
    if (confidence > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div 
      className={`${getCellClass()} h-16 relative cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md`}
      onClick={() => onClick && cell && onClick()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col items-center justify-center h-full p-2">
        <div className="flex items-center space-x-1 mb-1">
          {getImpactIcon()}
          <span className="text-sm font-bold">
            {getImpactText()}
          </span>
        </div>
        
        {/* Enhanced confidence indicator */}
        <div className="w-8 bg-muted/50 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${getConfidenceColor()} transition-all duration-300`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
        
        {/* High confidence indicator */}
        {confidence > 0.9 && (
          <div className="absolute top-1 right-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Enhanced hover tooltip */}
      {isHovered && cell.explanation && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20">
          <div className="bg-card border border-border rounded-lg shadow-xl p-4 max-w-sm">
            <div className="text-sm font-semibold mb-2 text-foreground">
              {asset.name} × {scenario.name}
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              {cell.explanation}
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                Impact: <span className="font-medium text-foreground">{getImpactText()}</span>
              </span>
              <span className="text-muted-foreground">
                Confidence: <span className="font-medium text-foreground">{Math.round(confidence * 100)}%</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EnhancedMatrixGrid({ 
  assets, 
  scenarios, 
  onCellClick, 
  className = '' 
}: EnhancedMatrixGridProps) {
  const [matrix, setMatrix] = useState<MatrixCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch matrix data from API
  const fetchMatrixData = async (forceRefresh = false) => {
    try {
      setError(null);
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/matrix/calculate?mode=detailed&forceRefresh=${forceRefresh}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch matrix data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.calculations && Array.isArray(data.calculations)) {
        setMatrix(data.calculations);
      } else {
        // Fallback to mock data structure if API returns different format
        setMatrix([]);
      }
    } catch (err) {
      console.error('Matrix calculation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load matrix data');
      // Keep existing data on error
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (assets.length > 0 && scenarios.length > 0) {
      fetchMatrixData();
    }
  }, [assets, scenarios]);

  const getCellData = (assetId: string, scenarioId: string) => {
    return matrix.find(cell => 
      cell.assetId === assetId && cell.scenarioId === scenarioId
    );
  };

  const handleCellClick = (assetId: string, scenarioId: string) => {
    const cellData = getCellData(assetId, scenarioId);
    if (cellData && onCellClick) {
      onCellClick(assetId, scenarioId, cellData);
    }
  };

  const getMatrixStats = () => {
    if (matrix.length === 0) return { positive: 0, negative: 0, neutral: 0 };
    
    return matrix.reduce((acc, cell) => {
      if (cell.impact > 0.5) acc.positive++;
      else if (cell.impact < -0.5) acc.negative++;
      else acc.neutral++;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });
  };

  const stats = getMatrixStats();

  if (error && matrix.length === 0) {
    return (
      <div className={`bg-card rounded-xl border border-border p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-foreground mb-1">Failed to load matrix</div>
            <div className="text-xs text-muted-foreground mb-3">{error}</div>
            <button 
              onClick={() => fetchMatrixData()}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl border border-border p-6 ${className}`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Enhanced Impact Matrix</h2>
          <p className="text-sm text-muted-foreground">
            Real-time asset impact analysis across technology scenarios
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Matrix Stats */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-200 rounded" />
              <span>{stats.positive} positive</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-200 rounded" />
              <span>{stats.negative} negative</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-200 rounded" />
              <span>{stats.neutral} neutral</span>
            </div>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={() => fetchMatrixData(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-1 px-3 py-1 bg-muted hover:bg-muted/80 rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && matrix.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              Using cached data - {error}
            </span>
          </div>
        </div>
      )}

      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Scenario Headers */}
          <div className="grid gap-2 mb-2" style={{
            gridTemplateColumns: `200px repeat(${scenarios.length}, 120px)`
          }}>
            <div /> {/* Empty corner */}
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="text-center p-2">
                <div className="text-sm font-medium text-foreground mb-1">
                  {scenario.name}
                </div>
                <div className={`text-xs font-medium ${scenarioTypeColors[scenario.type]}`}>
                  {scenario.type}
                </div>
                <div className="text-xs text-muted-foreground">
                  {scenario.timeline}
                </div>
              </div>
            ))}
          </div>

          {/* Asset Rows */}
          {assets.map((asset) => (
            <div 
              key={asset.id} 
              className="grid gap-2 mb-2"
              style={{
                gridTemplateColumns: `200px repeat(${scenarios.length}, 120px)`
              }}
            >
              {/* Asset Header */}
              <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {asset.name}
                  </div>
                  {asset.ticker && (
                    <div className="text-xs text-muted-foreground">
                      {asset.ticker}
                    </div>
                  )}
                  <div className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${categoryColors[asset.category]}`}>
                    {asset.category.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Matrix Cells */}
              {scenarios.map((scenario) => (
                <EnhancedMatrixCell
                  key={`${asset.id}-${scenario.id}`}
                  cell={getCellData(asset.id, scenario.id)}
                  asset={asset}
                  scenario={scenario}
                  isLoading={loading}
                  onClick={() => handleCellClick(asset.id, scenario.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Footer Info */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">
              <strong>Enhanced Matrix Analysis:</strong> Impact scores from -5 (highly negative) to +5 (highly positive). 
              Confidence bars show assessment reliability. Real-time calculations update automatically.
            </p>
            <p>
              Click any cell for detailed analysis. High-confidence predictions (90%+) show green indicators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 