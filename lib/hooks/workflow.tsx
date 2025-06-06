'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAssets } from './assets';
import { useScenarios } from './scenarios';
import { useMatrixCalculation } from './matrix';

// Workflow phase definition
export interface WorkflowPhase {
  phase: number;
  href: string;
  label: string;
  description: string;
  requirements: string[];
}

// Workflow state interface
export interface WorkflowState {
  currentPhase: number;
  completedPhases: number[];
  phaseProgress: {
    [key: number]: {
      completed: boolean;
      progress: number;
      requirements: string[];
      completedRequirements: string[];
    };
  };
  canAccessPhase: (phase: number) => boolean;
  markPhaseComplete: (phase: number) => void;
  getNextRecommendation: () => string;
  getCurrentPhaseInfo: () => WorkflowPhase | null;
}

// Phase definitions
export const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    phase: 1,
    href: '/assets',
    label: 'Asset Research',
    description: 'Define assets and build comprehensive profiles',
    requirements: ['hasAssets', 'hasThemes']
  },
  {
    phase: 2,
    href: '/scenarios',
    label: 'Scenario Planning',
    description: 'Create future scenarios to test against',
    requirements: ['hasScenarios', 'hasProbabilities']
  },
  {
    phase: 3,
    href: '/matrix',
    label: 'Matrix Generation',
    description: 'AI-powered impact analysis',
    requirements: ['matrixCalculated']
  },
  {
    phase: 4,
    href: '/dashboard',
    label: 'Strategic Analysis',
    description: 'Portfolio insights and recommendations',
    requirements: []
  }
];

// Context for workflow state
const WorkflowContext = createContext<WorkflowState | null>(null);

// Provider component
interface WorkflowProviderProps {
  children: ReactNode;
}

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  
  // Data hooks for calculating progress
  const { data: assetsData } = useAssets();
  const { data: scenariosData } = useScenarios({});
  const { data: matrixData } = useMatrixCalculation('summary');
  
  // Calculate phase completion based on real data
  const calculatePhaseProgress = () => {
    const assets = assetsData?.data || [];
    const scenarios = scenariosData?.data || [];
    const matrixCalculations = matrixData?.calculations || [];
    
    const progress: WorkflowState['phaseProgress'] = {};
    
    // Phase 1: Asset Research
    const hasAssets = assets.length > 0;
    const hasThemes = assets.some(asset => asset.themes && asset.themes.length > 0);
    const phase1Requirements = [];
    if (hasAssets) phase1Requirements.push('hasAssets');
    if (hasThemes) phase1Requirements.push('hasThemes');
    
    progress[1] = {
      completed: hasAssets && hasThemes,
      progress: ((hasAssets ? 50 : 0) + (hasThemes ? 50 : 0)),
      requirements: ['hasAssets', 'hasThemes'],
      completedRequirements: phase1Requirements
    };
    
    // Phase 2: Scenario Planning
    const hasScenarios = scenarios.length > 0;
    const hasProbabilities = scenarios.some(s => s.probability && s.probability > 0);
    const phase2Requirements = [];
    if (hasScenarios) phase2Requirements.push('hasScenarios');
    if (hasProbabilities) phase2Requirements.push('hasProbabilities');
    
    progress[2] = {
      completed: hasScenarios && hasProbabilities,
      progress: ((hasScenarios ? 50 : 0) + (hasProbabilities ? 50 : 0)),
      requirements: ['hasScenarios', 'hasProbabilities'],
      completedRequirements: phase2Requirements
    };
    
    // Phase 3: Matrix Generation
    const matrixCalculated = matrixCalculations.length > 0;
    const phase3Requirements = [];
    if (matrixCalculated) phase3Requirements.push('matrixCalculated');
    
    progress[3] = {
      completed: matrixCalculated,
      progress: matrixCalculated ? 100 : 0,
      requirements: ['matrixCalculated'],
      completedRequirements: phase3Requirements
    };
    
    // Phase 4: Strategic Analysis (always accessible once Phase 3 complete)
    progress[4] = {
      completed: progress[3].completed,
      progress: progress[3].completed ? 100 : 0,
      requirements: [],
      completedRequirements: progress[3].completed ? [] : []
    };
    
    return progress;
  };
  
  const phaseProgress = calculatePhaseProgress();
  
  // Update completed phases based on progress
  useEffect(() => {
    const newCompletedPhases = Object.keys(phaseProgress)
      .map(Number)
      .filter(phase => phaseProgress[phase].completed);
    
    setCompletedPhases(newCompletedPhases);
    
    // Update current phase to the furthest accessible phase
    const maxAccessiblePhase = Math.max(1, ...newCompletedPhases.map(p => p + 1).filter(p => p <= 4));
    setCurrentPhase(Math.min(maxAccessiblePhase, 4));
  }, [phaseProgress]);
  
  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('finex-workflow-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedPhases(parsed.completedPhases || []);
        setCurrentPhase(parsed.currentPhase || 1);
      } catch (error) {
        console.warn('Failed to load workflow state from localStorage:', error);
      }
    }
  }, []);
  
  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('finex-workflow-state', JSON.stringify({
      completedPhases,
      currentPhase
    }));
  }, [completedPhases, currentPhase]);
  
  const canAccessPhase = (phase: number): boolean => {
    if (phase === 1) return true;
    if (phase === 4) return phaseProgress[3]?.completed || false;
    return phaseProgress[phase - 1]?.completed || false;
  };
  
  const markPhaseComplete = (phase: number) => {
    if (!completedPhases.includes(phase)) {
      setCompletedPhases(prev => [...prev, phase].sort());
    }
  };
  
  const getNextRecommendation = (): string => {
    const incompletePhase = [1, 2, 3, 4].find(phase => !phaseProgress[phase]?.completed);
    
    if (!incompletePhase) {
      return "Congratulations! You've completed all workflow phases.";
    }
    
    const phase = WORKFLOW_PHASES.find(p => p.phase === incompletePhase);
    const progress = phaseProgress[incompletePhase];
    
    if (!phase || !progress) return '';
    
    const missingRequirements = progress.requirements.filter(
      req => !progress.completedRequirements.includes(req)
    );
    
    if (incompletePhase === 1) {
      if (missingRequirements.includes('hasAssets')) {
        return "Start by creating your first asset in the Asset Research phase.";
      }
      if (missingRequirements.includes('hasThemes')) {
        return "Add themes to your assets to organize your research effectively.";
      }
    }
    
    if (incompletePhase === 2) {
      if (missingRequirements.includes('hasScenarios')) {
        return "Create your first scenario to test against your assets.";
      }
      if (missingRequirements.includes('hasProbabilities')) {
        return "Set probability estimates for your scenarios to complete the planning phase.";
      }
    }
    
    if (incompletePhase === 3) {
      return "Generate your impact matrix to see how scenarios affect your assets.";
    }
    
    return `Continue with ${phase.label}: ${phase.description}`;
  };
  
  const getCurrentPhaseInfo = (): WorkflowPhase | null => {
    return WORKFLOW_PHASES.find(phase => phase.phase === currentPhase) || null;
  };
  
  const workflowState: WorkflowState = {
    currentPhase,
    completedPhases,
    phaseProgress,
    canAccessPhase,
    markPhaseComplete,
    getNextRecommendation,
    getCurrentPhaseInfo
  };
  
  return (
    <WorkflowContext.Provider value={workflowState}>
      {children}
    </WorkflowContext.Provider>
  );
}

// Hook to use workflow state
export function useWorkflow(): WorkflowState {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
} 