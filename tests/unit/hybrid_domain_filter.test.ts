import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { hybridSearch } from '../../lib/services/searchService';
import * as vectorClient from '../../lib/clients';
import * as cacheService from '../../lib/services/cacheService';

// Mock the dependencies
vi.mock('../../lib/clients', () => ({
  similaritySearch: vi.fn()
}));

vi.mock('../../lib/services/cacheService', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  makeCacheKey: vi.fn().mockImplementation((query, metadata) => `${query}:${JSON.stringify(metadata)}`)
}));

vi.mock('../../lib/db', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([]),
    card: {
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}));

vi.mock('../../lib/metrics', () => ({
  searchLatency: {
    set: vi.fn()
  },
  searchQueriesTotal: {
    inc: vi.fn()
  }
}));

// Define the Domain enum to match the schema
enum Domain {
  ASSET = 'ASSET',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  GEOGRAPHY = 'GEOGRAPHY',
  OTHER = 'OTHER'
}

describe('Hybrid Search with Domain Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cacheService.cacheGet).mockResolvedValue(null); // Always cache miss for testing
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('passes domain filter to vectorClient.similaritySearch', async () => {
    // Mock the vectorClient to return some results
    vi.mocked(vectorClient.similaritySearch).mockResolvedValue([
      { id: 'card1', similarity: 0.9 },
      { id: 'card2', similarity: 0.8 }
    ]);

    // Perform a search with domain filter
    await hybridSearch({
      query: 'test query',
      domain: [Domain.ASSET]
    });

    // Verify the domain was passed to the vectorClient
    expect(vectorClient.similaritySearch).toHaveBeenCalledWith(
      'test query',
      20, // default limit
      [Domain.ASSET]
    );
  });

  it('includes domain in cache key', async () => {
    // Mock the vectorClient to return some results
    vi.mocked(vectorClient.similaritySearch).mockResolvedValue([
      { id: 'card1', similarity: 0.9 }
    ]);

    // Perform a search with domain filter
    await hybridSearch({
      query: 'test query',
      domain: [Domain.GEOGRAPHY]
    });

    // Verify domain is included in the cache key
    expect(cacheService.makeCacheKey).toHaveBeenCalledWith(
      'test query',
      expect.objectContaining({
        domain: [Domain.GEOGRAPHY]
      })
    );

    // Verify the cache was checked and set
    expect(cacheService.cacheGet).toHaveBeenCalled();
    expect(cacheService.cacheSet).toHaveBeenCalled();
  });

  it('works correctly without a domain filter', async () => {
    // Mock the vectorClient to return some results
    vi.mocked(vectorClient.similaritySearch).mockResolvedValue([
      { id: 'card1', similarity: 0.9 }
    ]);

    // Perform a search without domain filter
    await hybridSearch({ query: 'test query' });

    // Verify the domain was not passed to the vectorClient
    expect(vectorClient.similaritySearch).toHaveBeenCalledWith(
      'test query',
      20, // default limit
      undefined // no domain
    );
  });

  it('fuses results from text and vector search correctly', async () => {
    // Mock a text result and a vector result
    vi.mocked(vectorClient.similaritySearch).mockResolvedValue([
      { id: 'card1', similarity: 0.9 }
    ]);

    // Mock the queryRaw to return text search results
    const db = await import('../../lib/db');
    vi.mocked(db.prisma.$queryRaw).mockResolvedValue([
      { id: 'card2', rank: 0.8 }
    ]);

    // Perform a search with a domain filter
    const results = await hybridSearch({
      query: 'test query',
      domain: [Domain.ASSET]
    });

    // Verify results are fused from both sources
    expect(results.length).toBe(2);
    expect(results.map(r => r.id).sort()).toEqual(['card1', 'card2'].sort());
  });
});
