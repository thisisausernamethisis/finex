'use client';

import { useWorkflow } from '@/lib/hooks/workflow';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface WorkflowProgressProps {
  currentPage?: string;
  showRecommendations?: boolean;
  className?: string;
}

export function WorkflowProgress({ 
  currentPage, 
  showRecommendations = true,
  className = '' 
}: WorkflowProgressProps) {
  const workflow = useWorkflow();
  const currentPhaseInfo = workflow.getCurrentPhaseInfo();
  const recommendation = workflow.getNextRecommendation();
  
  // Find next uncompleted phase
  const nextPhase = [1, 2, 3, 4].find(phase => !workflow.phaseProgress[phase]?.completed);
  
  if (!currentPhaseInfo) {
    return null;
  }

  return (
    <div className={`bg-card border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Workflow Progress</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {workflow.completedPhases.length}/4 phases complete
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-4">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(workflow.completedPhases.length / 4) * 100}%` }}
        />
      </div>
      
      {/* Phase Status Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[1, 2, 3, 4].map(phase => {
          const phaseProgress = workflow.phaseProgress[phase];
          const isCompleted = workflow.completedPhases.includes(phase);
          const isCurrent = workflow.currentPhase === phase;
          
          return (
            <div
              key={phase}
              className={`
                p-2 rounded-lg text-center text-xs
                ${isCompleted 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                  : isCurrent
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }
              `}
            >
              <div className="flex items-center justify-center mb-1">
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="font-bold">{phase}</span>
                )}
              </div>
              <div className="text-xs font-medium">
                {phase === 1 && 'Assets'}
                {phase === 2 && 'Scenarios'}
                {phase === 3 && 'Matrix'}
                {phase === 4 && 'Analysis'}
              </div>
              {!isCompleted && phaseProgress && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {Math.round(phaseProgress.progress)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Recommendations */}
      {showRecommendations && recommendation && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-400 mb-1">
                Next Steps
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {recommendation}
              </p>
              
              {/* Action Button */}
              {nextPhase && nextPhase <= 4 && (
                <Link href={nextPhase === 1 ? '/assets' : nextPhase === 2 ? '/scenarios' : nextPhase === 3 ? '/matrix' : '/dashboard'}>
                  <Button size="sm" className="text-xs">
                    Continue to Phase {nextPhase}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Phase completion banner component
interface PhaseCompletionBannerProps {
  phase: number;
  onContinue?: () => void;
  className?: string;
}

export function PhaseCompletionBanner({ 
  phase, 
  onContinue,
  className = '' 
}: PhaseCompletionBannerProps) {
  const nextPhase = phase + 1;
  const nextPhaseLabels = {
    2: 'Scenario Planning',
    3: 'Matrix Generation', 
    4: 'Strategic Analysis'
  };
  
  const nextPhaseLabel = nextPhaseLabels[nextPhase as keyof typeof nextPhaseLabels];
  
  if (!nextPhaseLabel) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">
              🎉 All Phases Complete!
            </h3>
            <p className="text-sm text-green-700">
              You&apos;ve completed the entire strategic analysis workflow. Continue exploring insights and refining your analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">
            Phase {phase} Complete!
          </h3>
          <p className="text-sm text-green-700">
            Ready to move to {nextPhaseLabel}
          </p>
        </div>
        {onContinue && (
          <Button
            onClick={onContinue}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Continue to Phase {nextPhase}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
} 