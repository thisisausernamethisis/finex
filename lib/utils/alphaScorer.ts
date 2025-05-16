/**
 * This file serves as a facade for the alphaHeuristic module,
 * exposing only the public API functions needed by other modules.
 * 
 * All implementation details are kept in alphaHeuristic.ts
 */

// Re-export specific functions from alphaHeuristic
export {
  pickAlpha,
  scoreMerge,
  calculateAlpha,
  calculateHeuristicAlpha
} from './alphaHeuristic';
