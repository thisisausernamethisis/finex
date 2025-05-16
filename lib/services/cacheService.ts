/**
 * Cache Service
 *
 * Provides Redis-based caching functionality for hybrid search results
 * to improve response times for repeated queries.
 */

import Redis from 'ioredis';
import crypto from 'crypto';
import { performance } from 'node:perf_hooks';
import { logger } from '../logger';
import { ragCacheHits, ragCacheMisses, ragCacheLatency } from '../metrics';

// Logger for cache operations
const cacheLogger = logger.child({ component: 'CacheService' });

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

// Ensure Redis connection events are monitored
redis.on('error', (error) => {
  cacheLogger.error('Redis connection error', { 
    error: error.message, 
    stack: error.stack 
  });
});

redis.on('connect', () => {
  cacheLogger.info('Connected to Redis');
});

redis.on('reconnecting', () => {
  cacheLogger.info('Reconnecting to Redis');
});

/**
 * Creates a cache key from a query string and metadata object
 * 
 * @param query The search query
 * @param meta Additional metadata to include in the key (filters, etc.)
 * @returns A hashed cache key
 */
export function makeCacheKey(query: string, meta: unknown): string {
  // Normalize the query by trimming whitespace and converting to lowercase
  const normalizedQuery = query.trim().toLowerCase();
  
  // Convert metadata to a consistent string representation
  const metaString = JSON.stringify(meta || {});
  
  // Create a SHA-1 hash of the combined query + metadata
  return 'hs:' + crypto.createHash('sha1')
    .update(normalizedQuery + metaString)
    .digest('hex');
}

/**
 * Retrieves a value from cache if it exists
 * 
 * @param key The cache key
 * @returns The cached value or null if not found
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const startTime = performance.now();
  
  try {
    // Get value from Redis
    const raw = await redis.get(key);
    
    // Record cache latency
    const latency = (performance.now() - startTime) / 1000;
    ragCacheLatency.set({ operation: 'get' }, latency);
    
    if (raw) {
      // Cache hit
      ragCacheHits.inc({ type: 'get' });
      cacheLogger.debug('Cache hit', { key, latencyMs: latency * 1000 });
      
      // Parse the cached JSON value
      return JSON.parse(raw) as T;
    }
    
    // Cache miss
    ragCacheMisses.inc({ type: 'get' });
    cacheLogger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    // Log cache errors but don't fail the operation
    cacheLogger.error('Error retrieving from cache', {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Count as a cache miss
    ragCacheMisses.inc({ type: 'error' });
    return null;
  }
}

/**
 * Stores a value in cache with the specified TTL
 * 
 * @param key The cache key
 * @param value The value to store
 * @param ttlSec Time-to-live in seconds (default: 5 minutes)
 */
export async function cacheSet<T>(key: string, value: T, ttlSec = 300): Promise<void> {
  const startTime = performance.now();
  
  try {
    // Serialize value to JSON and store in Redis with expiration
    await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
    
    // Record cache latency
    const latency = (performance.now() - startTime) / 1000;
    ragCacheLatency.set({ operation: 'set' }, latency);
    
    cacheLogger.debug('Cache set', { key, ttlSec, latencyMs: latency * 1000 });
  } catch (error) {
    // Log cache errors but don't fail the operation
    cacheLogger.error('Error setting cache value', {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Removes a value from cache
 * 
 * @param key The cache key to invalidate
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const result = await redis.del(key);
    cacheLogger.debug('Cache key deleted', { key, result });
    return result > 0; // Returns true if at least one key was deleted
  } catch (error) {
    cacheLogger.error('Error deleting cache key', {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Gets the TTL (time-to-live) for a cache key in seconds
 * 
 * @param key The cache key
 * @returns TTL in seconds, -1 if key exists but has no TTL, or -2 if key doesn't exist
 */
export async function cacheTtl(key: string): Promise<number> {
  try {
    return await redis.ttl(key);
  } catch (error) {
    cacheLogger.error('Error getting cache TTL', {
      key,
      error: error instanceof Error ? error.message : String(error)
    });
    return -2; // Same as Redis' "key does not exist" response
  }
}

/**
 * Flushes all cache entries from the current database
 * Warning: This will remove ALL keys in the Redis database
 * 
 * @returns True if the flush was successful
 */
export async function cacheFlush(): Promise<boolean> {
  try {
    await redis.flushdb();
    cacheLogger.info('Cache flushed');
    return true;
  } catch (error) {
    cacheLogger.error('Error flushing cache', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Invalidates cache entries that match a pattern
 * 
 * @param pattern Redis key pattern to match
 */
export async function cacheInvalidatePattern(pattern: string): Promise<number> {
  try {
    // Use SCAN to find matching keys
    const keys = await scanKeys(pattern);
    
    if (keys.length > 0) {
      // Delete all matched keys
      await redis.del(...keys);
      cacheLogger.info(`Invalidated ${keys.length} cache entries`, { pattern });
      return keys.length;
    }
    
    return 0;
  } catch (error) {
    cacheLogger.error('Error invalidating cache pattern', {
      pattern,
      error: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}

/**
 * Helper function to scan Redis for keys matching a pattern
 */
async function scanKeys(pattern: string): Promise<string[]> {
  const allKeys: string[] = [];
  let cursor = '0';
  
  do {
    // Use SCAN to iterate through keys without blocking Redis
    const [nextCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      100
    );
    
    cursor = nextCursor;
    allKeys.push(...keys);
  } while (cursor !== '0');
  
  return allKeys;
}
