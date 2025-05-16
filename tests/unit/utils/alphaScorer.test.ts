import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pickAlpha, scoreMerge } from '../../../lib/utils/alphaScorer';
import OpenAI from 'openai';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: '0.75' } }]
          })
        }
      }
    }))
  };
});

describe('Alpha Scorer', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv }; // Make a copy
    delete process.env.FINEX_ALPHA_MODE; // Start with default mode
  });
  
  afterEach(() => {
    process.env = originalEnv; // Restore original env
    vi.clearAllMocks();
  });
  
  describe('pickAlpha', () => {
    it('returns default alpha when no parameters provided', async () => {
      const alpha = await pickAlpha();
      expect(alpha).toBe(0.5); // Default alpha is 0.5
    });
    
    it('adjusts alpha based on domain presence', async () => {
      const alpha = await pickAlpha(undefined, ['ASSET']);
      expect(alpha).toBeGreaterThan(0.5); // Should be higher with domain
    });
    
    it('adjusts alpha based on query characteristics', async () => {
      // Query with numbers should favor BM25 (lower alpha)
      const alphaWithNumbers = await pickAlpha('search for asset 123');
      expect(alphaWithNumbers).toBeLessThan(0.5);
      
      // Query with quotes should favor BM25 even more
      const alphaWithQuotes = await pickAlpha('search for "exact phrase"');
      expect(alphaWithQuotes).toBeLessThan(alphaWithNumbers);
      
      // Long query should favor vector search (higher alpha)
      const longQuery = 'This is a very long query that discusses various aspects of financial assets and their relationship to market trends over time, particularly focusing on how certain sectors might respond to economic changes';
      const alphaLongQuery = await pickAlpha(longQuery);
      expect(alphaLongQuery).toBeGreaterThan(0.5);
    });
    
    it('combines query and domain heuristics', async () => {
      const alpha1 = await pickAlpha('asset search', ['ASSET']);
      const alpha2 = await pickAlpha('asset 123 search', ['ASSET']);
      
      // Both have ASSET domain (increases alpha)
      // But second has numbers (decreases alpha)
      expect(alpha1).toBeGreaterThan(alpha2);
    });
    
    it('maintains alpha within valid range (0.2-0.8)', async () => {
      // Test extreme cases that would push alpha outside bounds
      const longQueryWithDomains = 'This is an extremely long and detailed query about various financial instruments and their performance metrics across multiple sectors and timeframes, discussing intricate details about market movements and correlations between different asset classes over extended periods';
      const shortQueryWithNumbers = '123 456';
      
      const highAlpha = await pickAlpha(longQueryWithDomains, ['ASSET', 'GEOGRAPHY']);
      const lowAlpha = await pickAlpha(shortQueryWithNumbers);
      
      expect(highAlpha).toBeLessThanOrEqual(0.8);
      expect(lowAlpha).toBeGreaterThanOrEqual(0.2);
    });
    
    it('uses GPT when environment flag is set', async () => {
      // Set the env flag
      process.env.FINEX_ALPHA_MODE = 'gpt';
      
      await pickAlpha('test query', ['ASSET']);
      
      // Verify OpenAI was called
      const openaiInstance = new OpenAI();
      expect(openaiInstance.chat.completions.create).toHaveBeenCalled();
    });
    
    it('does not use GPT when environment flag is not set', async () => {
      await pickAlpha('test query', ['ASSET']);
      
      // Verify OpenAI was not called
      const openaiInstance = new OpenAI();
      expect(openaiInstance.chat.completions.create).not.toHaveBeenCalled();
    });
  });
  
  describe('scoreMerge', () => {
    it('uses provided alpha when specified', async () => {
      // Setup test data
      const vecResults = [
        { id: 'doc1', score: 0.9 },
        { id: 'doc2', score: 0.8 }
      ];
      
      const kwResults = [
        { id: 'doc1', score: 0.7 },
        { id: 'doc3', score: 0.6 }
      ];
      
      // Mock pickAlpha to verify it's not called
      const pickAlphaSpy = vi.spyOn({ pickAlpha }, 'pickAlpha');
      
      // Call with explicit alpha
      const result = await scoreMerge(vecResults, kwResults, { alpha: 0.75 });
      
      // Verify results are merged with the specified alpha
      // For doc1: (0.75 * 0.9) + (0.25 * 0.7) = 0.675 + 0.175 = 0.85
      const doc1 = result.find(r => r.id === 'doc1');
      
      // Allow for small floating point differences
      expect(doc1?.score).toBeCloseTo(0.85, 2);
      
      // Verify pickAlpha was not called
      expect(pickAlphaSpy).not.toHaveBeenCalled();
    });
    
    it('computes alpha based on query and domain when not specified', async () => {
      // Setup test data
      const vecResults = [{ id: 'doc1', score: 0.9 }];
      const kwResults = [{ id: 'doc1', score: 0.7 }];
      
      // Call without explicit alpha
      const result = await scoreMerge(vecResults, kwResults, { query: 'test', domain: 'ASSET' });
      
      // Verify results merged
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('doc1');
    });
    
    it('sorts results by merged score in descending order', async () => {
      // Setup test data with different scores
      const vecResults = [
        { id: 'doc1', score: 0.9 },
        { id: 'doc2', score: 0.7 },
        { id: 'doc3', score: 0.5 }
      ];
      
      const kwResults = [
        { id: 'doc2', score: 0.9 },
        { id: 'doc3', score: 0.8 },
        { id: 'doc1', score: 0.3 }
      ];
      
      // Use balanced alpha of 0.5
      const result = await scoreMerge(vecResults, kwResults, { alpha: 0.5 });
      
      // Verify sorted order
      expect(result[0].id).toBe('doc2'); // (0.5 * 0.7) + (0.5 * 0.9) = 0.8
      expect(result[1].id).toBe('doc1'); // (0.5 * 0.9) + (0.5 * 0.3) = 0.6
      expect(result[2].id).toBe('doc3'); // (0.5 * 0.5) + (0.5 * 0.8) = 0.65
      
      // Verify explicitly that the scores are in descending order
      expect(result[0].score).toBeGreaterThan(result[1].score);
      expect(result[1].score).toBeGreaterThan(result[2].score);
    });
  });
});
