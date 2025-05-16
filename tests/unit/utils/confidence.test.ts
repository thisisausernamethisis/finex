import { describe, it, expect } from 'vitest';
import { computeConfidence } from '../../../lib/utils/confidence';

describe('composite confidence', () => {
  it('outputs value 0-1', () => {
    const val = computeConfidence({ 
      llm: 0.8, 
      retrievalVariance: 0.6, 
      rankCorrelation: 0.5 
    });
    
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThanOrEqual(1);
  });
  
  it('handles all inputs at maximum', () => {
    const val = computeConfidence({ 
      llm: 1, 
      retrievalVariance: 1, 
      rankCorrelation: 1 
    });
    
    expect(val).toBe(1);
  });
  
  it('handles all inputs at minimum', () => {
    const val = computeConfidence({ 
      llm: 0, 
      retrievalVariance: 0, 
      rankCorrelation: 0 
    });
    
    expect(val).toBe(0);
  });
  
  it('handles values outside bounds', () => {
    const val = computeConfidence({ 
      llm: 1.2,               // Above maximum
      retrievalVariance: -0.1, // Below minimum
      rankCorrelation: 0.5    // Within bounds
    });
    
    // Should clamp values and not throw
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThanOrEqual(1);
    expect(() => computeConfidence({ 
      llm: 1.2, 
      retrievalVariance: -0.1, 
      rankCorrelation: 0.5 
    })).not.toThrow();
  });
  
  it('weights LLM confidence higher', () => {
    // LLM is high, others are low
    const highLLM = computeConfidence({ 
      llm: 1, 
      retrievalVariance: 0.2, 
      rankCorrelation: 0.2 
    });
    
    // LLM is low, others are high
    const lowLLM = computeConfidence({ 
      llm: 0.2, 
      retrievalVariance: 1, 
      rankCorrelation: 1 
    });
    
    // Given the weights (0.4 for LLM, 0.3 each for others),
    // the high LLM score should produce a higher composite
    expect(highLLM).toBeGreaterThan(lowLLM);
  });
  
  it('should produce expected output for given inputs', () => {
    const result = computeConfidence({ 
      llm: 0.8, 
      retrievalVariance: 0.6, 
      rankCorrelation: 0.5 
    });
    
    // Expected: 0.8^0.4 * 0.6^0.3 * 0.5^0.3 ≈ 0.653
    expect(result).toBeCloseTo(0.653, 3);
  });
});
