'use client';

import { useState } from 'react';
import { Info, TrendingUp, TrendingDown, Zap } from 'lucide-react';

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

interface MatrixGridProps {
  assets: Asset[];
  scenarios: Scenario[];
  matrix: MatrixCell[];
  onCellClick?: (assetId: string, scenarioId: string) => void;
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

function MatrixCellComponent({ 
  cell, 
  asset, 
  scenario, 
  onClick 
}: { 
  cell: MatrixCell | undefined;
  asset: Asset;
  scenario: Scenario;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
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
  
  // Determine cell appearance
  const getCellClass = () => {
    if (impact > 0) return 'matrix-cell positive';
    if (impact < 0) return 'matrix-cell negative';
    return 'matrix-cell neutral';
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

  return (
    <div 
      className={`${getCellClass()} h-16 relative cursor-pointer transition-all duration-200`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col items-center justify-center h-full p-2">
        <div className="flex items-center space-x-1 mb-1">
          {getImpactIcon()}
          <span className="text-sm font-medium">
            {getImpactText()}
          </span>
        </div>
        
        {/* Confidence indicator */}
        <div className="w-8 bg-muted rounded-full h-1">
          <div 
            className={`h-1 rounded-full ${
              confidence > 0.8 ? 'bg-green-500' :
              confidence > 0.6 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Hover tooltip */}
      {isHovered && cell.explanation && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
            <div className="text-xs font-medium mb-1">
              {asset.name} × {scenario.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {cell.explanation}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MatrixGrid({ 
  assets, 
  scenarios, 
  matrix, 
  onCellClick, 
  className = '' 
}: MatrixGridProps) {
  const getCellData = (assetId: string, scenarioId: string) => {
    return matrix.find(cell => 
      cell.assetId === assetId && cell.scenarioId === scenarioId
    );
  };

  return (
    <div className={`bg-card rounded-xl border border-border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Impact Matrix</h2>
          <p className="text-sm text-muted-foreground">
            Asset impact analysis across scenarios
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-200 rounded" />
            <span>Positive</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-200 rounded" />
            <span>Negative</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded" />
            <span>Neutral</span>
          </div>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Scenario Headers */}
          <div className="grid grid-cols-[200px_repeat(var(--scenarios),_120px)] gap-2 mb-2">
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
              className="grid grid-cols-[200px_repeat(var(--scenarios),_120px)] gap-2 mb-2"
              style={{ 
                '--scenarios': scenarios.length 
              } as React.CSSProperties}
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
                <MatrixCellComponent
                  key={`${asset.id}-${scenario.id}`}
                  cell={getCellData(asset.id, scenario.id)}
                  asset={asset}
                  scenario={scenario}
                  onClick={() => onCellClick?.(asset.id, scenario.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">
              Impact scores range from -5 (highly negative) to +5 (highly positive). 
              Confidence bars show the reliability of each assessment.
            </p>
            <p>
              Click any cell to view detailed analysis and supporting evidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 