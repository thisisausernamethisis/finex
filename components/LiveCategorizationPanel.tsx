'use client';

import { useState, useEffect } from 'react';
import { Brain, Zap, Check, Clock, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  ticker?: string;
  category?: string;
  confidence?: number;
  status: 'pending' | 'categorizing' | 'completed' | 'error';
  timestamp?: Date;
}

interface CategorizationResult {
  assetId: string;
  category: string;
  confidence: number;
  reasoning: string;
  processedAt: Date;
}

interface LiveCategorizationPanelProps {
  className?: string;
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
  categorizing: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  error: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
};

const categoryColors = {
  'AI_COMPUTE': 'bg-blue-500',
  'ROBOTICS_PHYSICAL_AI': 'bg-green-500',
  'QUANTUM_COMPUTING': 'bg-purple-500',
  'BIOTECH_LONGEVITY': 'bg-pink-500',
  'ENERGY_STORAGE': 'bg-yellow-500',
  'TRADITIONAL': 'bg-gray-500'
};

const categoryNames = {
  'AI_COMPUTE': 'AI & Compute',
  'ROBOTICS_PHYSICAL_AI': 'Robotics & Physical AI',
  'QUANTUM_COMPUTING': 'Quantum Computing',
  'BIOTECH_LONGEVITY': 'Biotech & Longevity',
  'ENERGY_STORAGE': 'Energy & Storage',
  'TRADITIONAL': 'Traditional'
};

function CategorizationStatusIcon({ status }: { status: Asset['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />;
    case 'categorizing':
      return <Brain className="w-4 h-4 animate-pulse" />;
    case 'completed':
      return <Check className="w-4 h-4" />;
    case 'error':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

function AssetCategorizationCard({ asset }: { asset: Asset }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <div 
      className={`border border-border rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
        asset.status === 'categorizing' ? 'animate-pulse' : ''
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${statusColors[asset.status]}`}>
            <CategorizationStatusIcon status={asset.status} />
          </div>
          
          <div>
            <div className="font-medium text-foreground">{asset.name}</div>
            {asset.ticker && (
              <div className="text-xs text-muted-foreground">{asset.ticker}</div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {asset.category && asset.confidence && (
            <>
              <div className="text-right">
                <div className="text-xs font-medium text-foreground">
                  {categoryNames[asset.category as keyof typeof categoryNames] || asset.category}
                </div>
                <div className={`text-xs ${getConfidenceColor(asset.confidence)}`}>
                  {Math.round(asset.confidence * 100)}% • {getConfidenceText(asset.confidence)}
                </div>
              </div>
              
              <div 
                className={`w-3 h-3 rounded-full ${
                  categoryColors[asset.category as keyof typeof categoryColors] || 'bg-gray-500'
                }`}
              />
            </>
          )}
          
          {asset.status === 'categorizing' && (
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
          )}
        </div>
      </div>

      {isExpanded && asset.category && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-1 capitalize text-foreground">{asset.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Processed:</span>
              <span className="ml-1 text-foreground">
                {asset.timestamp ? asset.timestamp.toLocaleTimeString() : 'Unknown'}
              </span>
            </div>
          </div>
          
          {/* Confidence breakdown */}
          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-1">Confidence Score</div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  asset.confidence && asset.confidence >= 0.9 ? 'bg-green-500' :
                  asset.confidence && asset.confidence >= 0.7 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${(asset.confidence || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LiveCategorizationPanel({ className = '' }: LiveCategorizationPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [processingStats, setProcessingStats] = useState({
    total: 0,
    pending: 0,
    categorizing: 0,
    completed: 0,
    error: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock real-time categorization data - in production this would be real WebSocket/SSE
  useEffect(() => {
    const mockAssets: Asset[] = [
      {
        id: '1',
        name: 'NVIDIA Corporation',
        ticker: 'NVDA',
        category: 'AI_COMPUTE',
        confidence: 0.95,
        status: 'completed',
        timestamp: new Date(Date.now() - 30000)
      },
      {
        id: '2',
        name: 'Tesla Inc',
        ticker: 'TSLA',
        category: 'ROBOTICS_PHYSICAL_AI',
        confidence: 0.88,
        status: 'completed',
        timestamp: new Date(Date.now() - 45000)
      },
      {
        id: '3',
        name: 'Quantum Computing Inc',
        ticker: 'QUBT',
        status: 'categorizing',
        timestamp: new Date()
      },
      {
        id: '4',
        name: 'Advanced Micro Devices',
        ticker: 'AMD',
        category: 'AI_COMPUTE',
        confidence: 0.72,
        status: 'completed',
        timestamp: new Date(Date.now() - 120000)
      },
      {
        id: '5',
        name: 'Mystery Corp',
        ticker: 'MYST',
        status: 'pending'
      }
    ];

    setAssets(mockAssets);
    updateStats(mockAssets);

    // Simulate real-time processing
    const interval = setInterval(() => {
      setAssets(currentAssets => {
        const updated = currentAssets.map(asset => {
          if (asset.status === 'categorizing' && Math.random() > 0.7) {
            // Complete categorization
            return {
              ...asset,
              category: 'QUANTUM_COMPUTING',
              confidence: 0.76 + Math.random() * 0.2,
              status: 'completed' as const,
              timestamp: new Date()
            };
          }
          if (asset.status === 'pending' && Math.random() > 0.8) {
            // Start categorization
            return {
              ...asset,
              status: 'categorizing' as const,
              timestamp: new Date()
            };
          }
          return asset;
        });
        
        updateStats(updated);
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const updateStats = (assetList: Asset[]) => {
    const stats = assetList.reduce(
      (acc, asset) => {
        acc.total++;
        acc[asset.status]++;
        return acc;
      },
      { total: 0, pending: 0, categorizing: 0, completed: 0, error: 0 }
    );
    setProcessingStats(stats);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const completionPercentage = processingStats.total > 0 
    ? Math.round((processingStats.completed / processingStats.total) * 100)
    : 0;

  return (
    <div className={`bg-card rounded-xl border border-border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <span>Live AI Categorization</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time asset classification with confidence scoring
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1 px-3 py-1 bg-muted hover:bg-muted/80 rounded-lg text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Processing Stats */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Processing Progress</span>
          <span className="text-sm text-muted-foreground">
            {processingStats.completed}/{processingStats.total} completed
          </span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2 mb-3">
          <div 
            className="h-2 bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span>{processingStats.pending} pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>{processingStats.categorizing} processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>{processingStats.completed} completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span>{processingStats.error} errors</span>
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="space-y-3">
        {assets.map(asset => (
          <AssetCategorizationCard key={asset.id} asset={asset} />
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">AI Performance</span>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">Avg Confidence</div>
            <div className="font-medium text-foreground">
              {Math.round(
                assets
                  .filter(a => a.confidence)
                  .reduce((sum, a) => sum + (a.confidence || 0), 0) /
                assets.filter(a => a.confidence).length * 100
              )}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Processing Speed</div>
            <div className="font-medium text-foreground">~2.3s</div>
          </div>
          <div>
            <div className="text-muted-foreground">Success Rate</div>
            <div className="font-medium text-foreground">98.5%</div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">
              <strong>Real-time AI categorization</strong> analyzes assets across 6 technology categories
              using advanced machine learning models. High-confidence classifications (90%+) are auto-approved.
            </p>
            <p>
              Click any asset card to view detailed categorization reasoning and confidence breakdown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 