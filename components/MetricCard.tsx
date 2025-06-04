'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, Brain, Atom, Target } from 'lucide-react';

type TechCategory = 'ai' | 'robotics' | 'quantum' | 'traditional';
type TrendDirection = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  category?: TechCategory;
  trend?: TrendDirection;
  sparklineData?: number[];
  confidence?: number;
  insight?: string;
  className?: string;
}

const categoryConfig = {
  ai: {
    gradient: 'gradient-ai',
    icon: Brain,
    label: 'AI/Compute',
    color: 'text-blue-600 dark:text-blue-400'
  },
  robotics: {
    gradient: 'gradient-robotics',
    icon: Zap,
    label: 'Robotics/Physical AI',
    color: 'text-green-600 dark:text-green-400'
  },
  quantum: {
    gradient: 'gradient-quantum',
    icon: Atom,
    label: 'Quantum',
    color: 'text-purple-600 dark:text-purple-400'
  },
  traditional: {
    gradient: 'gradient-traditional',
    icon: Target,
    label: 'Traditional',
    color: 'text-gray-600 dark:text-gray-400'
  }
};

function AnimatedCounter({ 
  value, 
  duration = 1000, 
  suffix = '', 
  prefix = '' 
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * value);
      
      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className="animate-counter">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

function Sparkline({ data, className = '' }: { data: number[]; className?: string }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range > 0 ? ((max - value) / range) * 100 : 50;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`h-8 w-16 ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="animate-sparkline"
        />
      </svg>
    </div>
  );
}

export function MetricCard({
  title,
  value,
  previousValue,
  suffix = '',
  prefix = '',
  category,
  trend,
  sparklineData,
  confidence,
  insight,
  className = ''
}: MetricCardProps) {
  const categoryInfo = category ? categoryConfig[category] : null;
  const CategoryIcon = categoryInfo?.icon;
  
  // Calculate trend if not provided but previousValue exists
  const calculatedTrend = trend || (previousValue !== undefined ? 
    (value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral') : 
    'neutral'
  );

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus
  };

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  const TrendIcon = trendIcons[calculatedTrend];

  const changePercent = previousValue !== undefined && previousValue !== 0 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;

  return (
    <div className={`metric-card group ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          {CategoryIcon && (
            <div className={`p-1.5 rounded-lg ${categoryInfo?.gradient} text-white`}>
              <CategoryIcon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {categoryInfo && (
              <span className={`text-xs font-medium ${categoryInfo.color}`}>
                {categoryInfo.label}
              </span>
            )}
          </div>
        </div>
        
        {sparklineData && (
          <Sparkline 
            data={sparklineData} 
            className={calculatedTrend === 'up' ? 'text-green-500' : 
                      calculatedTrend === 'down' ? 'text-red-500' : 'text-gray-500'} 
          />
        )}
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-foreground mb-1">
          <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
        </div>
        
        {/* Trend and Change */}
        {previousValue !== undefined && (
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 ${trendColors[calculatedTrend]}`}>
              <TrendIcon className="w-3 h-3" />
              <span className="text-xs font-medium">
                {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              vs. previous
            </span>
          </div>
        )}
      </div>

      {/* Confidence Indicator */}
      {confidence !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Confidence</span>
            <span>{Math.round(confidence * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                confidence > 0.8 ? 'bg-green-500' :
                confidence > 0.6 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Insight */}
      {insight && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground italic">
            &ldquo;{insight}&rdquo;
          </p>
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
} 