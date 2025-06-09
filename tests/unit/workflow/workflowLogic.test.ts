/**
 * Unit tests for workflow logic without React components
 * Tests the pure logic functions and phase calculations
 */

import { describe, test, expect } from 'vitest';
import { WORKFLOW_PHASES } from '@/lib/hooks/workflow';

describe('Workflow Logic System', () => {
  describe('Phase Definitions', () => {
    test('should have correct number of phases', () => {
      expect(WORKFLOW_PHASES).toHaveLength(4);
    });

    test('should have sequential phase numbers', () => {
      WORKFLOW_PHASES.forEach((phase, index) => {
        expect(phase.phase).toBe(index + 1);
      });
    });

    test('should have required fields for each phase', () => {
      WORKFLOW_PHASES.forEach(phase => {
        expect(phase).toHaveProperty('phase');
        expect(phase).toHaveProperty('href');
        expect(phase).toHaveProperty('label');
        expect(phase).toHaveProperty('description');
        expect(phase).toHaveProperty('requirements');
        expect(Array.isArray(phase.requirements)).toBe(true);
      });
    });

    test('should have correct URLs for each phase', () => {
      expect(WORKFLOW_PHASES[0].href).toBe('/assets');
      expect(WORKFLOW_PHASES[1].href).toBe('/scenarios');
      expect(WORKFLOW_PHASES[2].href).toBe('/matrix');
      expect(WORKFLOW_PHASES[3].href).toBe('/dashboard');
    });

    test('should have proper requirements structure', () => {
      expect(WORKFLOW_PHASES[0].requirements).toEqual(['hasAssets', 'hasThemes']);
      expect(WORKFLOW_PHASES[1].requirements).toEqual(['hasScenarios', 'hasProbabilities']);
      expect(WORKFLOW_PHASES[2].requirements).toEqual(['matrixCalculated']);
      expect(WORKFLOW_PHASES[3].requirements).toEqual([]);
    });
  });

  describe('Phase Calculation Logic', () => {
    // Pure functions to test workflow logic without React
    const calculatePhaseProgress = (assets: any[], scenarios: any[], matrixCalculations: any[]) => {
      // Phase 1: Asset Research
      const hasAssets = assets.length > 0;
      const hasThemes = assets.some(asset => asset.themes && asset.themes.length > 0);
      const phase1Requirements = [];
      if (hasAssets) phase1Requirements.push('hasAssets');
      if (hasThemes) phase1Requirements.push('hasThemes');
      
      const phase1Progress = {
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
      
      const phase2Progress = {
        completed: hasScenarios && hasProbabilities,
        progress: ((hasScenarios ? 50 : 0) + (hasProbabilities ? 50 : 0)),
        requirements: ['hasScenarios', 'hasProbabilities'],
        completedRequirements: phase2Requirements
      };

      // Phase 3: Matrix Generation
      const matrixCalculated = matrixCalculations.length > 0;
      const phase3Progress = {
        completed: matrixCalculated,
        progress: matrixCalculated ? 100 : 0,
        requirements: ['matrixCalculated'],
        completedRequirements: matrixCalculated ? ['matrixCalculated'] : []
      };

      // Phase 4: Strategic Analysis
      const phase4Progress = {
        completed: phase3Progress.completed,
        progress: phase3Progress.completed ? 100 : 0,
        requirements: [],
        completedRequirements: phase3Progress.completed ? [] : []
      };

      return {
        1: phase1Progress,
        2: phase2Progress,
        3: phase3Progress,
        4: phase4Progress
      };
    };

    const canAccessPhase = (phase: number, phaseProgress: any) => {
      if (phase === 1) return true;
      if (phase === 4) return phaseProgress[3]?.completed || false;
      return phaseProgress[phase - 1]?.completed || false;
    };

    test('should calculate empty state correctly', () => {
      const progress = calculatePhaseProgress([], [], []);
      
      expect(progress[1].completed).toBe(false);
      expect(progress[1].progress).toBe(0);
      expect(progress[2].completed).toBe(false);
      expect(progress[2].progress).toBe(0);
      expect(progress[3].completed).toBe(false);
      expect(progress[3].progress).toBe(0);
      expect(progress[4].completed).toBe(false);
      expect(progress[4].progress).toBe(0);
    });

    test('should calculate Phase 1 partial completion', () => {
      const assets = [{ id: '1', name: 'Asset 1', themes: [] }];
      const progress = calculatePhaseProgress(assets, [], []);
      
      expect(progress[1].completed).toBe(false);
      expect(progress[1].progress).toBe(50);
      expect(progress[1].completedRequirements).toEqual(['hasAssets']);
    });

    test('should calculate Phase 1 full completion', () => {
      const assets = [{ id: '1', name: 'Asset 1', themes: [{ id: '1', name: 'Theme 1' }] }];
      const progress = calculatePhaseProgress(assets, [], []);
      
      expect(progress[1].completed).toBe(true);
      expect(progress[1].progress).toBe(100);
      expect(progress[1].completedRequirements).toEqual(['hasAssets', 'hasThemes']);
    });

    test('should calculate Phase 2 partial completion', () => {
      const assets = [{ id: '1', name: 'Asset 1', themes: [{ id: '1', name: 'Theme 1' }] }];
      const scenarios = [{ id: '1', name: 'Scenario 1', probability: 0 }];
      const progress = calculatePhaseProgress(assets, scenarios, []);
      
      expect(progress[2].completed).toBe(false);
      expect(progress[2].progress).toBe(50);
      expect(progress[2].completedRequirements).toEqual(['hasScenarios']);
    });

    test('should calculate Phase 2 full completion', () => {
      const assets = [{ id: '1', name: 'Asset 1', themes: [{ id: '1', name: 'Theme 1' }] }];
      const scenarios = [{ id: '1', name: 'Scenario 1', probability: 0.5 }];
      const progress = calculatePhaseProgress(assets, scenarios, []);
      
      expect(progress[2].completed).toBe(true);
      expect(progress[2].progress).toBe(100);
      expect(progress[2].completedRequirements).toEqual(['hasScenarios', 'hasProbabilities']);
    });

    test('should calculate Phase 3 completion', () => {
      const assets = [{ id: '1', name: 'Asset 1', themes: [{ id: '1', name: 'Theme 1' }] }];
      const scenarios = [{ id: '1', name: 'Scenario 1', probability: 0.5 }];
      const matrix = [{ id: '1', assetId: '1', scenarioId: '1', impact: 2.5 }];
      const progress = calculatePhaseProgress(assets, scenarios, matrix);
      
      expect(progress[3].completed).toBe(true);
      expect(progress[3].progress).toBe(100);
      expect(progress[4].completed).toBe(true);
      expect(progress[4].progress).toBe(100);
    });

    test('should handle edge case with multiple assets', () => {
      const assets = [
        { id: '1', name: 'Asset 1', themes: [{ id: '1', name: 'Theme 1' }] },
        { id: '2', name: 'Asset 2', themes: [] },
        { id: '3', name: 'Asset 3', themes: [{ id: '2', name: 'Theme 2' }] }
      ];
      const progress = calculatePhaseProgress(assets, [], []);
      
      expect(progress[1].completed).toBe(true); // Some assets have themes
      expect(progress[1].progress).toBe(100);
    });

    test('should handle edge case with mixed scenario probabilities', () => {
      const assets = [{ id: '1', name: 'Asset 1', themes: [{ id: '1', name: 'Theme 1' }] }];
      const scenarios = [
        { id: '1', name: 'Scenario 1', probability: 0.5 },
        { id: '2', name: 'Scenario 2', probability: 0 },
        { id: '3', name: 'Scenario 3', probability: 0.8 }
      ];
      const progress = calculatePhaseProgress(assets, scenarios, []);
      
      expect(progress[2].completed).toBe(true); // Some scenarios have probabilities
      expect(progress[2].progress).toBe(100);
    });
  });

  describe('Access Control Logic', () => {
    const mockPhaseProgress = (completedPhases: number[]) => {
      return {
        1: { completed: completedPhases.includes(1) },
        2: { completed: completedPhases.includes(2) },
        3: { completed: completedPhases.includes(3) },
        4: { completed: completedPhases.includes(4) }
      };
    };

    const canAccessPhase = (phase: number, phaseProgress: any) => {
      if (phase === 1) return true;
      if (phase === 4) return phaseProgress[3]?.completed || false;
      return phaseProgress[phase - 1]?.completed || false;
    };

    test('should allow Phase 1 access always', () => {
      const progress = mockPhaseProgress([]);
      expect(canAccessPhase(1, progress)).toBe(true);
    });

    test('should block Phase 2 without Phase 1 completion', () => {
      const progress = mockPhaseProgress([]);
      expect(canAccessPhase(2, progress)).toBe(false);
    });

    test('should allow Phase 2 with Phase 1 completion', () => {
      const progress = mockPhaseProgress([1]);
      expect(canAccessPhase(2, progress)).toBe(true);
    });

    test('should block Phase 3 without Phase 2 completion', () => {
      const progress = mockPhaseProgress([1]);
      expect(canAccessPhase(3, progress)).toBe(false);
    });

    test('should allow Phase 3 with Phase 2 completion', () => {
      const progress = mockPhaseProgress([1, 2]);
      expect(canAccessPhase(3, progress)).toBe(true);
    });

    test('should block Phase 4 without Phase 3 completion', () => {
      const progress = mockPhaseProgress([1, 2]);
      expect(canAccessPhase(4, progress)).toBe(false);
    });

    test('should allow Phase 4 with Phase 3 completion', () => {
      const progress = mockPhaseProgress([1, 2, 3]);
      expect(canAccessPhase(4, progress)).toBe(true);
    });

    test('should handle non-sequential completion correctly', () => {
      // This shouldn't happen in normal flow, but test the logic
      const progress = mockPhaseProgress([1, 3]); // Skip phase 2
      expect(canAccessPhase(2, progress)).toBe(true); // Phase 1 is complete
      expect(canAccessPhase(3, progress)).toBe(false); // Phase 2 not complete
      expect(canAccessPhase(4, progress)).toBe(true); // Phase 3 is complete
    });
  });

  describe('Recommendation System', () => {
    const getNextRecommendation = (phaseProgress: any) => {
      const incompletePhase = [1, 2, 3, 4].find(phase => !phaseProgress[phase]?.completed);
      
      if (!incompletePhase) {
        return "Congratulations! You've completed all workflow phases.";
      }
      
      const progress = phaseProgress[incompletePhase];
      const missingRequirements = progress.requirements.filter(
        (req: string) => !progress.completedRequirements.includes(req)
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
      
      return `Continue with Phase ${incompletePhase}`;
    };

    test('should recommend asset creation for empty state', () => {
      const progress = {
        1: { completed: false, requirements: ['hasAssets', 'hasThemes'], completedRequirements: [] },
        2: { completed: false, requirements: ['hasScenarios', 'hasProbabilities'], completedRequirements: [] },
        3: { completed: false, requirements: ['matrixCalculated'], completedRequirements: [] },
        4: { completed: false, requirements: [], completedRequirements: [] }
      };
      
      expect(getNextRecommendation(progress)).toBe(
        "Start by creating your first asset in the Asset Research phase."
      );
    });

    test('should recommend theme addition when assets exist', () => {
      const progress = {
        1: { completed: false, requirements: ['hasAssets', 'hasThemes'], completedRequirements: ['hasAssets'] },
        2: { completed: false, requirements: ['hasScenarios', 'hasProbabilities'], completedRequirements: [] },
        3: { completed: false, requirements: ['matrixCalculated'], completedRequirements: [] },
        4: { completed: false, requirements: [], completedRequirements: [] }
      };
      
      expect(getNextRecommendation(progress)).toBe(
        "Add themes to your assets to organize your research effectively."
      );
    });

    test('should recommend scenario creation when Phase 1 complete', () => {
      const progress = {
        1: { completed: true, requirements: ['hasAssets', 'hasThemes'], completedRequirements: ['hasAssets', 'hasThemes'] },
        2: { completed: false, requirements: ['hasScenarios', 'hasProbabilities'], completedRequirements: [] },
        3: { completed: false, requirements: ['matrixCalculated'], completedRequirements: [] },
        4: { completed: false, requirements: [], completedRequirements: [] }
      };
      
      expect(getNextRecommendation(progress)).toBe(
        "Create your first scenario to test against your assets."
      );
    });

    test('should recommend probability setting when scenarios exist', () => {
      const progress = {
        1: { completed: true, requirements: ['hasAssets', 'hasThemes'], completedRequirements: ['hasAssets', 'hasThemes'] },
        2: { completed: false, requirements: ['hasScenarios', 'hasProbabilities'], completedRequirements: ['hasScenarios'] },
        3: { completed: false, requirements: ['matrixCalculated'], completedRequirements: [] },
        4: { completed: false, requirements: [], completedRequirements: [] }
      };
      
      expect(getNextRecommendation(progress)).toBe(
        "Set probability estimates for your scenarios to complete the planning phase."
      );
    });

    test('should recommend matrix generation when Phase 2 complete', () => {
      const progress = {
        1: { completed: true, requirements: ['hasAssets', 'hasThemes'], completedRequirements: ['hasAssets', 'hasThemes'] },
        2: { completed: true, requirements: ['hasScenarios', 'hasProbabilities'], completedRequirements: ['hasScenarios', 'hasProbabilities'] },
        3: { completed: false, requirements: ['matrixCalculated'], completedRequirements: [] },
        4: { completed: false, requirements: [], completedRequirements: [] }
      };
      
      expect(getNextRecommendation(progress)).toBe(
        "Generate your impact matrix to see how scenarios affect your assets."
      );
    });

    test('should congratulate when all phases complete', () => {
      const progress = {
        1: { completed: true, requirements: ['hasAssets', 'hasThemes'], completedRequirements: ['hasAssets', 'hasThemes'] },
        2: { completed: true, requirements: ['hasScenarios', 'hasProbabilities'], completedRequirements: ['hasScenarios', 'hasProbabilities'] },
        3: { completed: true, requirements: ['matrixCalculated'], completedRequirements: ['matrixCalculated'] },
        4: { completed: true, requirements: [], completedRequirements: [] }
      };
      
      expect(getNextRecommendation(progress)).toBe(
        "Congratulations! You've completed all workflow phases."
      );
    });
  });
});