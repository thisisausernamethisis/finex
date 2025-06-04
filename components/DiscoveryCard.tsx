'use client';

import { useState } from 'react';
import { Lightbulb, Zap, Brain, AlertTriangle, TrendingUp, ExternalLink, ChevronRight } from 'lucide-react';

type InsightType = 'revelation' | 'concentration' | 'risk' | 'opportunity' | 'correlation';
type TechCategory = 'ai' | 'robotics' | 'quantum' | 'traditional';

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  category?: TechCategory;
  assets: string[];
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
  metadata?: {
    percentage?: number;
    timeframe?: string;
    source?: string;
  };
}

interface DiscoveryCardProps {
  insight: Insight;
  onExplore?: (insightId: string) => void;
  onDismiss?: (insightId: string) => void;
  className?: string;
  animated?: boolean;
}

const insightConfig = {
  revelation: {
    icon: Lightbulb,
    label: 'AI Revelation',
    gradient: 'from-yellow-400 to-orange-500',
    bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
    description: 'Unexpected technology insight discovered'
  },
  concentration: {
    icon: TrendingUp,
    label: 'Portfolio Analysis',
    gradient: 'from-blue-400 to-purple-500',
    bgGradient: 'from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20',
    description: 'Technology concentration analysis'
  },
  risk: {
    icon: AlertTriangle,
    label: 'Risk Assessment',
    gradient: 'from-red-400 to-pink-500',
    bgGradient: 'from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20',
    description: 'Potential technology risk identified'
  },
  opportunity: {
    icon: Zap,
    label: 'Opportunity',
    gradient: 'from-green-400 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    description: 'Technology opportunity discovered'
  },
  correlation: {
    icon: Brain,
    label: 'Correlation',
    gradient: 'from-indigo-400 to-purple-500',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20',
    description: 'Asset correlation pattern found'
  }
};

const impactColors = {
  low: 'text-gray-600 dark:text-gray-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-red-600 dark:text-red-400'
};

const categoryColors = {
  ai: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  robotics: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  quantum: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  traditional: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
};

export function DiscoveryCard({ 
  insight, 
  onExplore, 
  onDismiss, 
  className = '',
  animated = true
}: DiscoveryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(!animated);

  const config = insightConfig[insight.type];
  const Icon = config.icon;

  const handleReveal = () => {
    if (!isRevealed) {
      setIsRevealed(true);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div 
      className={`
        discovery-card relative overflow-hidden
        ${animated && !isRevealed ? 'animate-pulse-glow' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleReveal}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-50`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient} text-white shadow-sm`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-foreground">{config.label}</h3>
                {!isRevealed && (
                  <div className="animate-pulse w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {formatTimestamp(insight.timestamp)}
          </div>
        </div>

        {/* Insight Content */}
        <div className={`transition-all duration-500 ${isRevealed ? 'opacity-100' : 'opacity-60 blur-sm'}`}>
          <h4 className="font-semibold text-foreground mb-2">
            {insight.title}
          </h4>
          
          <p className="text-sm text-muted-foreground mb-4">
            {insight.description}
          </p>

          {/* Metadata */}
          {insight.metadata && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {insight.metadata.percentage !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Portfolio Impact</div>
                  <div className="text-lg font-bold text-foreground">
                    {insight.metadata.percentage}%
                  </div>
                </div>
              )}
              {insight.metadata.timeframe && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Timeframe</div>
                  <div className="text-sm font-medium text-foreground">
                    {insight.metadata.timeframe}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assets */}
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">Related Assets</div>
            <div className="flex flex-wrap gap-1">
              {insight.assets.slice(0, 3).map((asset, index) => (
                <span 
                  key={index}
                  className={`text-xs px-2 py-1 rounded-full ${
                    insight.category ? categoryColors[insight.category] : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {asset}
                </span>
              ))}
              {insight.assets.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{insight.assets.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Confidence and Impact */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        insight.confidence > 0.8 ? 'bg-green-500' :
                        insight.confidence > 0.6 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${insight.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {Math.round(insight.confidence * 100)}%
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">Impact</div>
                <span className={`text-xs font-medium ${impactColors[insight.impact]}`}>
                  {insight.impact.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExplore?.(insight.id);
            }}
            className="flex items-center space-x-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <span>Explore Details</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </button>
            {onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(insight.id);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shimmer effect for unrevealed insights */}
      {!isRevealed && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

export interface DiscoveryFeedProps {
  insights: Insight[];
  onExplore?: (insightId: string) => void;
  onDismiss?: (insightId: string) => void;
  className?: string;
}

export function DiscoveryFeed({ 
  insights, 
  onExplore, 
  onDismiss, 
  className = '' 
}: DiscoveryFeedProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Discoveries</h2>
          <p className="text-sm text-muted-foreground">
            Technology insights revealed by analysis
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {insights.length} new insights
        </div>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight) => (
          <DiscoveryCard
            key={insight.id}
            insight={insight}
            onExplore={onExplore}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
} 