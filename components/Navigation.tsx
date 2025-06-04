'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Target, 
  Grid3X3, 
  Lightbulb, 
  Settings, 
  HelpCircle,
  ChevronDown,
  Zap,
  Brain,
  Atom
} from 'lucide-react';

type ComplexityLevel = 'essential' | 'advanced' | 'pro';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  complexity: ComplexityLevel;
  badge?: string;
}

const navItems: NavItem[] = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: BarChart3, 
    complexity: 'essential',
    badge: 'New'
  },
  { 
    href: '/assets', 
    label: 'Assets', 
    icon: Target, 
    complexity: 'essential' 
  },
  { 
    href: '/matrix', 
    label: 'Matrix', 
    icon: Grid3X3, 
    complexity: 'advanced' 
  },
  { 
    href: '/insights', 
    label: 'Insights', 
    icon: Lightbulb, 
    complexity: 'essential',
    badge: 'AI'
  },
  { 
    href: '/scenarios', 
    label: 'Scenarios', 
    icon: Zap, 
    complexity: 'advanced' 
  },
  { 
    href: '/evidence', 
    label: 'Evidence', 
    icon: Brain, 
    complexity: 'pro' 
  },
  { 
    href: '/advanced', 
    label: 'Advanced', 
    icon: Atom, 
    complexity: 'pro' 
  }
];

const complexityConfig = {
  essential: {
    label: 'Essential',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    description: 'Core features for quick analysis'
  },
  advanced: {
    label: 'Advanced',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    description: 'Detailed analysis and customization'
  },
  pro: {
    label: 'Pro',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    description: 'Full workflow and collaboration'
  }
};

export function Navigation() {
  const [complexity, setComplexity] = useState<ComplexityLevel>('essential');
  const [isComplexityOpen, setIsComplexityOpen] = useState(false);
  const pathname = usePathname();

  const visibleNavItems = navItems.filter(item => {
    if (complexity === 'essential') return item.complexity === 'essential';
    if (complexity === 'advanced') return ['essential', 'advanced'].includes(item.complexity);
    return true; // pro shows all
  });

  const currentComplexity = complexityConfig[complexity];

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Atom className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground">MetaMap</span>
                <span className="text-xs text-muted-foreground -mt-1">Technology Analysis</span>
              </div>
            </Link>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link relative group ${isActive ? 'active' : ''}`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Complexity Selector */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsComplexityOpen(!isComplexityOpen)}
                className={`
                  flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium
                  ${currentComplexity.bgColor} ${currentComplexity.color}
                  hover:opacity-80 transition-opacity
                `}
              >
                <span>{currentComplexity.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isComplexityOpen ? 'rotate-180' : ''}`} />
              </button>

              {isComplexityOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                  {Object.entries(complexityConfig).map(([level, config]) => (
                    <button
                      key={level}
                      onClick={() => {
                        setComplexity(level as ComplexityLevel);
                        setIsComplexityOpen(false);
                      }}
                      className={`
                        w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors
                        ${complexity === level ? 'bg-muted/30' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        {complexity === level && (
                          <div className="w-2 h-2 bg-current rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {config.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border/50">
        <div className="flex overflow-x-auto py-2 px-4 space-x-1 no-scrollbar">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center space-y-1 px-3 py-2 rounded-lg
                  text-xs font-medium whitespace-nowrap transition-colors
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-xs px-1 py-0.5 bg-accent text-accent-foreground rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 