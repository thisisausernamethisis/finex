/**
 * Cache Service Tests
 * 
 * These tests verify the functionality of the Redis cache service
 * using a mocked Redis client.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Redis from 'ioredis';
import { cacheGet, cacheSet, makeCacheKey, cacheDelete, cacheTtl, cacheFlush } from '../../../lib/services/cacheService';

// Mock ioredis
vi.mock('ioredis', () => {
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    ttl: vi.fn(),
    flushdb: vi.fn(),
    on: vi.fn(),
  };
  return {
    default: vi.fn(() => mockRedis)
  };
});

// Mock metrics
vi.mock('../../../lib/metrics', () => ({
  ragCacheHits: { inc: vi.fn() },
  ragCacheMisses: { inc: vi.fn() },
  ragCacheLatency: { set: vi.fn() },
}));

describe('Cache Service', () => {
  let mockRedis: any;
  
  beforeEach(() => {
    // Get the mock instance
    mockRedis = new Redis();
    
    // Reset all mock implementations
    vi.resetAllMocks();
    
    // Setup default Redis mock behavior
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(300);
    mockRedis.flushdb.mockResolvedValue('OK');
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('makeCacheKey', () => {
    test('generates consistent key for the same input', () => {
      const key1 = makeCacheKey('test query', { filter: 'value' });
      const key2 = makeCacheKey('test query', { filter: 'value' });
      
      expect(key1).toBe(key2);
    });
    
    test('generates different keys for different queries', () => {
      const key1 = makeCacheKey('query1', {});
      const key2 = makeCacheKey('query2', {});
      
      expect(key1).not.toBe(key2);
    });
    
    test('generates different keys for same query with different metadata', () => {
      const key1 = makeCacheKey('test query', { filter1: 'value' });
      const key2 = makeCacheKey('test query', { filter2: 'value' });
      
      expect(key1).not.toBe(key2);
    });
    
    test('always prefixes keys with "hs:"', () => {
      const key = makeCacheKey('any query', {});
      
      expect(key.startsWith('hs:')).toBe(true);
    });
  });
  
  describe('cacheGet', () => {
    test('returns null when key not found', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const result = await cacheGet('test-key');
      
      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });
    
    test('parses and returns cached JSON data', async () => {
      const mockData = { results: [{ id: '1', score: 0.9 }] };
      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));
      
      const result = await cacheGet('test-key');
      
      expect(result).toEqual(mockData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });
    
    test('handles Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      
      const result = await cacheGet('test-key');
      
      expect(result).toBeNull();
    });
    
    test('records cache hit metrics', async () => {
      const { ragCacheHits } = await import('../../../lib/metrics');
      mockRedis.get.mockResolvedValue('{"data":"value"}');
      
      await cacheGet('test-key');
      
      expect(ragCacheHits.inc).toHaveBeenCalledWith({ type: 'get' });
    });
    
    test('records cache miss metrics', async () => {
      const { ragCacheMisses } = await import('../../../lib/metrics');
      mockRedis.get.mockResolvedValue(null);
      
      await cacheGet('test-key');
      
      expect(ragCacheMisses.inc).toHaveBeenCalledWith({ type: 'get' });
    });
  });
  
  describe('cacheSet', () => {
    test('stores serialized data with default TTL', async () => {
      const data = { results: [{ id: '1', score: 0.9 }] };
      
      await cacheSet('test-key', data);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key', 
        JSON.stringify(data), 
        'EX', 
        300
      );
    });
    
    test('uses custom TTL when provided', async () => {
      const data = { value: 'test' };
      const customTtl = 600;
      
      await cacheSet('test-key', data, customTtl);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key', 
        JSON.stringify(data), 
        'EX', 
        customTtl
      );
    });
    
    test('handles Redis errors gracefully', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));
      const data = { value: 'test' };
      
      // Should complete without throwing
      await cacheSet('test-key', data);
      
      // We expect it to try the operation
      expect(mockRedis.set).toHaveBeenCalled();
    });
    
    test('records latency metrics', async () => {
      const { ragCacheLatency } = await import('../../../lib/metrics');
      const data = { value: 'test' };
      
      await cacheSet('test-key', data);
      
      expect(ragCacheLatency.set).toHaveBeenCalled();
      // Type assertion to handle the mock property
      const mockedSet = ragCacheLatency.set as unknown as jest.Mock;
      expect(mockedSet.mock.calls[0][0]).toEqual({ operation: 'set' });
      expect(typeof mockedSet.mock.calls[0][1]).toBe('number');
    });
  });
  
  describe('cacheDelete', () => {
    test('returns true when key was deleted', async () => {
      mockRedis.del.mockResolvedValue(1);
      
      const result = await cacheDelete('test-key');
      
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });
    
    test('returns false when key did not exist', async () => {
      mockRedis.del.mockResolvedValue(0);
      
      const result = await cacheDelete('test-key');
      
      expect(result).toBe(false);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });
    
    test('handles Redis errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis connection failed'));
      
      const result = await cacheDelete('test-key');
      
      expect(result).toBe(false);
    });
  });
  
  describe('cacheTtl', () => {
    test('returns remaining TTL when key exists', async () => {
      mockRedis.ttl.mockResolvedValue(42);
      
      const result = await cacheTtl('test-key');
      
      expect(result).toBe(42);
      expect(mockRedis.ttl).toHaveBeenCalledWith('test-key');
    });
    
    test('returns -2 when key does not exist', async () => {
      mockRedis.ttl.mockResolvedValue(-2);
      
      const result = await cacheTtl('test-key');
      
      expect(result).toBe(-2);
    });
    
    test('returns -1 when key exists but has no TTL', async () => {
      mockRedis.ttl.mockResolvedValue(-1);
      
      const result = await cacheTtl('test-key');
      
      expect(result).toBe(-1);
    });
    
    test('handles Redis errors gracefully', async () => {
      mockRedis.ttl.mockRejectedValue(new Error('Redis connection failed'));
      
      const result = await cacheTtl('test-key');
      
      expect(result).toBe(-2);
    });
  });
  
  describe('cacheFlush', () => {
    test('returns true when flush was successful', async () => {
      mockRedis.flushdb.mockResolvedValue('OK');
      
      const result = await cacheFlush();
      
      expect(result).toBe(true);
      expect(mockRedis.flushdb).toHaveBeenCalled();
    });
    
    test('handles Redis errors gracefully', async () => {
      mockRedis.flushdb.mockRejectedValue(new Error('Redis connection failed'));
      
      const result = await cacheFlush();
      
      expect(result).toBe(false);
    });
  });
});
