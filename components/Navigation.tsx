'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Target, 
  Grid3X3, 
  Zap,
  Atom
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { 
    href: '/assets', 
    label: 'Assets', 
    icon: Target
  },
  { 
    href: '/scenarios', 
    label: 'Scenarios', 
    icon: Zap
  },
  { 
    href: '/matrix', 
    label: 'Matrix', 
    icon: Grid3X3
  }
];

export function Navigation() {
  const pathname = usePathname();

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
                <span className="text-xs text-muted-foreground -mt-1">Asset Management</span>
              </div>
            </Link>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
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
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Empty space for future actions */}
          <div className="w-8"></div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border/50">
        <div className="flex overflow-x-auto py-2 px-4 space-x-1 no-scrollbar">
          {navItems.map((item) => {
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
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 