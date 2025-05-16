/**
 * RAGAS Smoke Tests
 * 
 * These tests verify the basic functionality of the RAGAS (Retrieval Augmented
 * Generation Assessment Score) calculation utilities.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateRAGASScore, RAGAS_THRESHOLD } from '../../../lib/utils/ragas';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      constructor() {
        return {
          chat: {
            completions: {
              create: vi.fn().mockResolvedValue({
                choices: [{ message: { content: JSON.stringify({ score: 0.85 }) } }]
              })
            }
          }
        };
      }
    }
  };
});

describe('RAGAS Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock implementation for environment variables
    process.env.OPENAI_API_KEY = 'mock-key';
  });
  
  afterEach(() => {
    vi.resetAllMocks();
    delete process.env.OPENAI_API_KEY;
  });
  
  describe('calculateRAGASScore', () => {
    test('should calculate score based on OpenAI responses', async () => {
      // Create mock context
      const context = [
        { 
          id: 'chunk1', 
          content: 'This is a test context about growth risk matrices.',
          score: 0.95 
        },
        { 
          id: 'chunk2', 
          content: 'Finex uses RAG to improve search results and analysis quality.',
          score: 0.82 
        }
      ];
      
      // Call the function
      const score = await calculateRAGASScore(
        'What is a growth risk matrix?',
        'A growth risk matrix helps analyze risks in relation to growth opportunities.',
        context
      );
      
      // Verify score is calculated correctly
      // In our mocked implementation, all metrics return 0.85
      expect(score).toBeCloseTo(0.85);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
    
    test('should return a default score when no context is provided', async () => {
      const score = await calculateRAGASScore(
        'What is a growth risk matrix?',
        'A growth risk matrix helps analyze risks in relation to growth opportunities.',
        []
      );
      
      // Expect default score for empty context
      expect(score).toBe(0.5);
    });
    
    test('should handle OpenAI errors gracefully', async () => {
      // Override mock to simulate OpenAI error
      const OpenAI = await import('openai');
      const mockOpenAI = new OpenAI.default({
        apiKey: 'mock-key'
      });
      
      // Force the mock to reject
      vi.mocked(mockOpenAI.chat.completions.create).mockRejectedValueOnce(
        new Error('OpenAI API error')
      );
      
      const context = [
        { 
          id: 'chunk1', 
          content: 'This is a test context.',
          score: 0.9 
        }
      ];
      
      const score = await calculateRAGASScore(
        'What is a growth risk matrix?',
        'A growth risk matrix helps analyze risks in relation to growth opportunities.',
        context
      );
      
      // Expect fallback score when errors occur
      expect(score).toBe(0.7);
    });
  });
  
  describe('RAGAS_THRESHOLD', () => {
    test('should be defined with appropriate value', () => {
      // Check that threshold exists and is within reasonable range
      expect(RAGAS_THRESHOLD).toBeDefined();
      expect(RAGAS_THRESHOLD).toBeGreaterThanOrEqual(0.7);
      expect(RAGAS_THRESHOLD).toBeLessThanOrEqual(1.0);
    });
  });
});
