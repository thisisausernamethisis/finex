import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pickAlpha, calculateHeuristicAlpha, calculateAlpha } from '../../../lib/utils/alphaHeuristic';
import OpenAI from 'openai';

// Mock OpenAI and logger
vi.mock('openai', () => {
  const mockCompletionsCreate = vi.fn().mockResolvedValue({
    choices: [{ message: { content: '0.65' } }]
  });
  
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCompletionsCreate
        }
      }
    }))
  };
});

vi.mock('../../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    child: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn()
    })
  }
}));

// Mock cache service
vi.mock('../../../lib/services/cacheService', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(true)
}));

describe('alphaHeuristic', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.DYNAMIC_ALPHA_GPT = 'false';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('calculateHeuristicAlpha', () => {
    it('returns default alpha (0.5) for empty query and no domains', () => {
      const result = calculateHeuristicAlpha();
      expect(result).toBe(0.5);
    });
    
    it('increases alpha for long queries', () => {
      const shortQuery = 'simple query';
      const longQuery = 'This is a very detailed and complex query that contains multiple concepts and should be considered a semantic search rather than keyword matching because it has many words and nuanced meaning that requires understanding the context';
      
      const shortAlpha = calculateHeuristicAlpha(shortQuery);
      const longAlpha = calculateHeuristicAlpha(longQuery);
      
      expect(longAlpha).toBeGreaterThan(shortAlpha);
    });
    
    it('decreases alpha for queries with special characters and quoted phrases', () => {
      const normalQuery = 'search for documents about climate change';
      const specialQuery = 'search for "climate change" +impacts -mitigation';
      
      const normalAlpha = calculateHeuristicAlpha(normalQuery);
      const specialAlpha = calculateHeuristicAlpha(specialQuery);
      
      expect(specialAlpha).toBeLessThan(normalAlpha);
    });
    
    it('increases alpha for question-based queries', () => {
      const statementQuery = 'climate change impacts';
      const questionQuery = 'what are the major impacts of climate change?';
      
      const statementAlpha = calculateHeuristicAlpha(statementQuery);
      const questionAlpha = calculateHeuristicAlpha(questionQuery);
      
      expect(questionAlpha).toBeGreaterThan(statementAlpha);
    });
    
    it('adjusts alpha based on domain', () => {
      const noDomainsAlpha = calculateHeuristicAlpha('financial analysis');
      const financeDomainsAlpha = calculateHeuristicAlpha('financial analysis', ['FINANCE']);
      const techDomainsAlpha = calculateHeuristicAlpha('financial analysis', ['TECHNICAL']);
      
      expect(financeDomainsAlpha).toBeGreaterThan(noDomainsAlpha);
      expect(techDomainsAlpha).toBeLessThan(financeDomainsAlpha);
    });
    
    it('ensures alpha stays within bounds (0.2-0.8)', () => {
      // Create extreme cases to test bounds
      const lowestQuery = '"exact phrase" 12345 +requirement -exclusion';
      const highestQuery = 'What are the comprehensive implications of climate change on global ecosystems and how might these affect biodiversity in various regions over the next century?';
      
      const lowestAlpha = calculateHeuristicAlpha(lowestQuery, ['TECHNICAL', 'REGULATORY']);
      const highestAlpha = calculateHeuristicAlpha(highestQuery, ['ASSET', 'FINANCE']);
      
      expect(lowestAlpha).toBeGreaterThanOrEqual(0.2);
      expect(highestAlpha).toBeLessThanOrEqual(0.8);
  });
  
  it('evicts the oldest entry once cache exceeds MAX_CACHE_SIZE', async () => {
    const { alphaCache } = await import('../../../lib/utils/alphaHeuristic');
    alphaCache.clear();
    for (let i = 0; i < 51; i++) {
      alphaCache.set(`q${i}`, { alpha: 0.5, ts: Date.now() });
    }
    expect(alphaCache.size).toBe(50);
    expect(alphaCache.has('q0')).toBe(false);
  });
});
  
  describe('calculateAlpha and pickAlpha', () => {
    it('pickAlpha uses calculateAlpha with compatibility args', async () => {
      const query = 'test query';
      const domains = ['FINANCE'];
      
      const pickResult = await pickAlpha(query, domains);
      const calcResult = await calculateAlpha(query, { domain: domains });
      
      expect(pickResult).toBe(calcResult);
    });
    
    it('uses heuristic by default when GPT is disabled', async () => {
      process.env.DYNAMIC_ALPHA_GPT = 'false';
      const query = 'test query';
      
      const result = await calculateAlpha(query);
      
      // This should be close to the heuristic result
      expect(result).toBeCloseTo(calculateHeuristicAlpha(query), 5);
      
      // The OpenAI API should not have been called
      const openaiMock = await import('openai');
      expect(openaiMock.default).not.toHaveBeenCalled();
    });
    
    it('uses GPT when enabled by environment variable', async () => {
      process.env.DYNAMIC_ALPHA_GPT = 'true';
      
      const query = 'test query';
      await calculateAlpha(query);
      
      // Should call OpenAI's API
      const openai = new OpenAI();
      expect(openai.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining(query)
            })
          ])
        })
      );
    });
    
    it('returns GPT-determined alpha when available', async () => {
      process.env.DYNAMIC_ALPHA_GPT = 'true';
      
      // Mock OpenAI to return a specific value
      const openai = new OpenAI();
      vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
        choices: [{ message: { content: '0.75' } }]
      } as any);
      
      const result = await calculateAlpha('test query');
      
      expect(result).toBe(0.75);
    });
    
    it('falls back to heuristic when GPT call fails', async () => {
      process.env.DYNAMIC_ALPHA_GPT = 'true';
      
      // Mock OpenAI to throw an error
      const openai = new OpenAI();
      vi.mocked(openai.chat.completions.create).mockRejectedValueOnce(new Error('API error'));
      
      const query = 'test query';
      const result = await calculateAlpha(query);
      
      // Should be close to the heuristic result
      expect(result).toBeCloseTo(calculateHeuristicAlpha(query), 5);
    });
    
    it('accepts domain as string or array', async () => {
      const query = 'test query';
      
      const stringResult = await calculateAlpha(query, { domain: 'FINANCE' });
      const arrayResult = await calculateAlpha(query, { domain: ['FINANCE'] });
      
      expect(stringResult).toBe(arrayResult);
    });
  });
});
