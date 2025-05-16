// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hybridSearch, vectorSearch } from '../../lib/services/searchService';
import { prisma } from '../../lib/db';
import { cacheGet, cacheSet } from '../../lib/services/cacheService';
import { Prisma } from '@prisma/client';
import { generateDocEmbedding } from '../../lib/clients';
import { Domain } from '../../lib/types/domain';

// Mock generateDocEmbedding to return a fixed vector
vi.mock('../../lib/clients', () => ({
  generateDocEmbedding: vi.fn().mockResolvedValue(Array(1536).fill(0.1))
}));

// Mock cacheService
vi.mock('../../lib/services/cacheService', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(true),
  makeCacheKey: vi.fn().mockReturnValue('test-cache-key')
}));

// Mock prisma including PrismaPromise compatibility
vi.mock('../../lib/db', () => {
  // Create a PrismaPromise-compatible mock using a Proxy
  const createPrismaPromise = (data) => {
    const promise = Promise.resolve(data);
    return new Proxy(promise, {
      get(target, prop) {
        if (prop === Symbol.toStringTag) {
          return "PrismaPromise";
        }
        return target[prop];
      }
    });
  };

  const queryRawMock = vi.fn().mockImplementation((query) => {
    // The implementation will determine what data to return based on the query
    const sqlString = String(query);
    
    if (sqlString.includes('embedding IS NOT NULL')) {
      return createPrismaPromise([
        { id: 'vec1', similarity: 0.95 },
        { id: 'vec2', similarity: 0.85 },
        { id: 'vec3', similarity: 0.75 }
      ]);
    }
    
    if (sqlString.includes('ts_rank')) {
      return createPrismaPromise([
        { id: 'text1', rank: 0.9 },
        { id: 'text2', rank: 0.8 },
        { id: 'text3', rank: 0.7 }
      ]);
    }
    
    return createPrismaPromise([{ count: BigInt(10) }]);
  });
  
  return {
    prisma: {
      $queryRaw: queryRawMock,
      $executeRaw: vi.fn().mockReturnValue(createPrismaPromise({})),
      card: {
        findMany: vi.fn().mockReturnValue(createPrismaPromise([]))
      },
      chunk: {
        count: vi.fn().mockReturnValue(createPrismaPromise(100))
      },
      $disconnect: vi.fn()
    }
  };
});

describe('Search Service with Domain Filtering', () => {
  const mockVectorResults = [
    { id: 'vec1', similarity: 0.95 },
    { id: 'vec2', similarity: 0.85 },
    { id: 'vec3', similarity: 0.75 }
  ];
  
  const mockTextResults = [
    { id: 'text1', rank: 0.9 },
    { id: 'text2', rank: 0.8 },
    { id: 'text3', rank: 0.7 }
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock behavior for vector and text search results
    vi.mocked(prisma.$queryRaw).mockImplementation((query) => {
      // Check SQL query string (after template literal processing)
      const sqlString = String(query);
      
      // If it's a vector search
      if (sqlString.includes('embedding IS NOT NULL')) {
        return Promise.resolve(mockVectorResults);
      }
      
      // If it's a text search
      if (sqlString.includes('ts_rank')) {
        return Promise.resolve(mockTextResults);
      }
      
      // For count queries or other queries
      return Promise.resolve([{ count: BigInt(10) }]);
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('hybridSearch with domain filter', () => {
    it('adds domain filter to SQL queries when domain is provided', async () => {
      const testQuery = 'test query';
      const testDomain = 'financial';
      
      await hybridSearch({
        query: testQuery,
        assetId: 'asset123',
        domain: testDomain
      });
      
      // Check that domain filter is included in both vector and text searches
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
      
      // Get all calls to $queryRaw
      const calls = vi.mocked(prisma.$queryRaw).mock.calls;
      
      // Check that at least one call contains the domain filter SQL
      const hasVectorDomainFilter = calls.some(call => {
        const sql = String(call[0]);
        return sql.includes('embedding IS NOT NULL') && 
               sql.includes('domain = ') && 
               String(call).includes('financial');
      });
      
      const hasTextDomainFilter = calls.some(call => {
        const sql = String(call[0]);
        return sql.includes('ts_rank') && 
               sql.includes('domain = ') && 
               String(call).includes('financial');
      });
      
      expect(hasVectorDomainFilter).toBe(true);
      expect(hasTextDomainFilter).toBe(true);
    });
    
    it('passes domain as a single string value', async () => {
      const testQuery = 'test query';
      const testDomain = 'FINANCE';
      
      await hybridSearch({
        query: testQuery,
        scenarioId: 'scenario123',
        domain: testDomain
      });
      
      // Get all calls to $queryRaw
      const calls = vi.mocked(prisma.$queryRaw).mock.calls;
      
      // Check domain is included in the SQL query
      const sqlIncludesDomain = calls.some(call => {
        const callStr = String(call);
        return callStr.includes('FINANCE') && callStr.includes('domain = ');
      });
      
      expect(sqlIncludesDomain).toBe(true);
    });
    
    it('omits domain filter when domain is not provided', async () => {
      const testQuery = 'test query';
      
      await hybridSearch({
        query: testQuery,
        assetId: 'asset123'
      });
      
      // Get all calls to $queryRaw
      const calls = vi.mocked(prisma.$queryRaw).mock.calls;
      
      // Check that no call contains domain filter SQL
      const hasDomainFilter = calls.some(call => {
        const sql = String(call[0]);
        return sql.includes('domain = ANY');
      });
      
      expect(hasDomainFilter).toBe(false);
    });
    
    it('correctly passes empty array when domain is empty array', async () => {
      const testQuery = 'test query';
      
      await hybridSearch({
        query: testQuery,
        assetId: 'asset123',
        domain: []
      });
      
      // Get all calls to $queryRaw
      const calls = vi.mocked(prisma.$queryRaw).mock.calls;
      
      // Should not include domain filter for empty array
      const hasDomainFilter = calls.some(call => {
        const sql = String(call[0]);
        return sql.includes('domain = ANY');
      });
      
      expect(hasDomainFilter).toBe(false);
    });
  });
  
  describe('vectorSearch with domain filter', () => {
    it('adds domain filter when domain string is provided', async () => {
      await vectorSearch('test query', 10, 'FINANCE');
      
      // Check SQL query contains domain filter
      const calls = vi.mocked(prisma.$queryRaw).mock.calls;
      
      const hasDomainFilter = calls.some(call => {
        const sql = String(call[0]);
        return sql.includes('domain = $4') && String(call).includes('FINANCE');
      });
      
      expect(hasDomainFilter).toBe(true);
    });
    
    it('omits domain filter when domains is not provided', async () => {
      await vectorSearch('test query');
      
      // Get SQL query
      const calls = vi.mocked(prisma.$queryRaw).mock.calls;
      
      const hasDomainFilter = calls.some(call => {
        const sql = String(call[0]);
        return sql.includes('domain = ANY');
      });
      
      expect(hasDomainFilter).toBe(false);
    });
  });
  
  describe('integration with caching', () => {
    it('properly caches results with domain filter', async () => {
      const testQuery = 'test cache query';
      const testDomain = 'FINANCE';
      
      // First call - should miss cache
      await hybridSearch({
        query: testQuery,
        domain: testDomain
      });
      
      // Verify cache was checked with correct metadata
      expect(cacheGet).toHaveBeenCalledTimes(1);
      expect(cacheGet).toHaveBeenCalledWith(expect.any(String));
      
      // Verify results were cached with domain in metadata
      expect(cacheSet).toHaveBeenCalledTimes(1);
      const cacheSetCall = vi.mocked(cacheSet).mock.calls[0];
      expect(cacheSetCall[0]).toBe('test-cache-key');
      expect(cacheSetCall[1]).toEqual(expect.any(Array)); // Results array
      expect(cacheSetCall[2]).toBe(300); // TTL
      
      // Second call with same params - should use cached result
      vi.mocked(cacheGet).mockResolvedValueOnce([
        { id: 'cached1', score: 0.9 },
        { id: 'cached2', score: 0.8 }
      ]);
      
      const results = await hybridSearch({
        query: testQuery,
        domain: testDomain
      });
      
      // Verify cache was checked again
      expect(cacheGet).toHaveBeenCalledTimes(2);
      
      // Verify we got cached results
      expect(results).toEqual([
        { id: 'cached1', score: 0.9 },
        { id: 'cached2', score: 0.8 }
      ]);
      
      // Verify no new DB queries were made
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2); // Only the initial call
    });
    
    it('uses different cache keys for different domains', async () => {
      // Reset mock call counts
      vi.mocked(cacheGet).mockClear();
      vi.mocked(cacheSet).mockClear();
      
      const testQuery = 'domain test query';
      
      // Call with first domain
      await hybridSearch({
        query: testQuery,
        domain: 'FINANCE'
      });
      
      // Call with different domain
      await hybridSearch({
        query: testQuery,
        domain: 'ASSET'
      });
      
      // Call with no domain
      await hybridSearch({
        query: testQuery
      });
      
      // Should have 3 unique cache operations
      expect(cacheGet).toHaveBeenCalledTimes(3);
      expect(cacheSet).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('search result diagnostics', () => {
    it('attaches diagnostic metrics to search results', async () => {
      const results = await hybridSearch({
        query: 'diagnostic test',
        domain: 'FINANCE'
      });
      
      // Non-enumerable properties should exist
      expect(Object.getOwnPropertyDescriptor(results, 'retrievalVariance')).toBeDefined();
      expect(Object.getOwnPropertyDescriptor(results, 'rankCorrelation')).toBeDefined();
      
      // Also check legacy property names for backward compatibility
      expect(Object.getOwnPropertyDescriptor(results, 'retrievalVar')).toBeDefined();
      expect(Object.getOwnPropertyDescriptor(results, 'rankCorr')).toBeDefined();
    });
  });
});
