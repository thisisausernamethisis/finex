'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Target, 
  Grid3X3, 
  Map,
  Users,
  CheckCircle,
  Circle,
  Lock
} from 'lucide-react';
import { useWorkflow, WORKFLOW_PHASES } from '@/lib/hooks/workflow';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { 
    href: '/assets', 
    label: 'Assets', 
    icon: Users
  },
  { 
    href: '/scenarios', 
    label: 'Scenarios', 
    icon: Map
  },
  { 
    href: '/matrix', 
    label: 'Matrix', 
    icon: Grid3X3
  }
];

export function Navigation() {
  const pathname = usePathname();
  const workflow = useWorkflow();
  
  // Map workflow phases to icons
  const getPhaseIcon = (phase: number) => {
    switch (phase) {
      case 1: return Users;
      case 2: return Map;
      case 3: return Grid3X3;
      case 4: return Target;
      default: return Circle;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground">Finex v3</span>
                <span className="text-xs text-muted-foreground -mt-1">Strategic Analysis</span>
              </div>
            </Link>
          </div>

          {/* Workflow Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {WORKFLOW_PHASES.map((phase, index) => {
              const Icon = getPhaseIcon(phase.phase);
              const isActive = pathname === phase.href;
              const isCompleted = workflow.completedPhases.includes(phase.phase);
              const canAccess = workflow.canAccessPhase(phase.phase);
              const progress = workflow.phaseProgress[phase.phase]?.progress || 0;
              
              return (
                <div key={phase.phase} className="flex items-center">
                  {/* Phase Indicator */}
                  <div className="flex flex-col items-center">
                    <Link
                      href={canAccess ? phase.href : '#'}
                      className={`
                        relative group flex flex-col items-center p-3 rounded-lg transition-all duration-300
                        ${isActive 
                          ? 'bg-primary/10 text-primary' 
                          : canAccess 
                            ? 'hover:bg-muted/50 text-foreground'
                            : 'opacity-50 cursor-not-allowed text-muted-foreground'
                        }
                      `}
                      onClick={(e) => {
                        if (!canAccess) {
                          e.preventDefault();
                        }
                      }}
                      title={canAccess ? phase.description : 'Complete previous phases to unlock'}
                    >
                      {/* Phase Number Circle */}
                      <div className={`
                        relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1
                        ${isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isActive 
                            ? 'bg-primary text-primary-foreground'
                            : canAccess
                              ? 'bg-muted border-2 border-primary text-primary'
                              : 'bg-muted border-2 border-muted-foreground text-muted-foreground'
                        }
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : canAccess ? (
                          phase.phase
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        
                        {/* Progress Ring */}
                        {!isCompleted && canAccess && progress > 0 && (
                          <div className="absolute inset-0 -m-1">
                            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-muted stroke-current"
                                strokeWidth="2"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-primary stroke-current"
                                strokeWidth="2"
                                strokeDasharray={`${progress}, 100`}
                                strokeLinecap="round"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Phase Label */}
                      <div className="flex items-center space-x-1">
                        <Icon className="w-3 h-3" />
                        <span className="text-xs font-medium">{phase.label}</span>
                      </div>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </div>
                  
                  {/* Connection Line */}
                  {index < WORKFLOW_PHASES.length - 1 && (
                    <div className={`
                      w-8 h-0.5 mx-2 transition-colors
                      ${workflow.completedPhases.includes(phase.phase) 
                        ? 'bg-green-500' 
                        : 'bg-muted'
                      }
                    `} />
                  )}
                </div>
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
          {WORKFLOW_PHASES.map((phase) => {
            const Icon = getPhaseIcon(phase.phase);
            const isActive = pathname === phase.href;
            const isCompleted = workflow.completedPhases.includes(phase.phase);
            const canAccess = workflow.canAccessPhase(phase.phase);
            
            return (
              <Link
                key={phase.phase}
                href={canAccess ? phase.href : '#'}
                onClick={(e) => {
                  if (!canAccess) {
                    e.preventDefault();
                  }
                }}
                className={`
                  flex flex-col items-center space-y-1 px-3 py-2 rounded-lg
                  text-xs font-medium whitespace-nowrap transition-colors relative
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : canAccess
                      ? 'text-foreground hover:bg-muted/50'
                      : 'opacity-50 text-muted-foreground'
                  }
                `}
              >
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                      ? 'bg-primary-foreground text-primary'
                      : 'bg-muted text-foreground'
                  }
                `}>
                  {isCompleted ? <CheckCircle className="w-3 h-3" /> : phase.phase}
                </div>
                <Icon className="w-4 h-4" />
                <span>{phase.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 