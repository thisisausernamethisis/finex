// Disable Redis for development - use memory cache only
// This prevents build issues during development
let Redis: any = null;

// Cache configuration
const CACHE_CONFIG = {
  defaultTTL: 300, // 5 minutes
  matrixTTL: 600, // 10 minutes for matrix calculations
  insightsTTL: 180, // 3 minutes for portfolio insights
  categorizesTTL: 900, // 15 minutes for categorizations
  scenariosTTL: 1800, // 30 minutes for scenarios
};

// In-memory fallback cache
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired items periodically
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now > item.expires) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Initialize cache instances
let redisClient: any = null;
const memoryCache = new MemoryCache();

// Cleanup memory cache every 5 minutes
setInterval(() => memoryCache.cleanup(), 5 * 60 * 1000);

// Initialize Redis connection (optional - falls back to memory)
async function initRedis(): Promise<any> {
  if (redisClient) return redisClient;
  
  try {
    // Temporarily disable Redis for development
    console.log('Redis disabled for development, using memory cache only');
    return null;
    
    // Only initialize if Redis URL is provided
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (!redisUrl) {
      console.log('No Redis URL configured, using memory cache');
      return null;
    }

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      commandTimeout: 5000,
    });

    redisClient.on('error', (error: any) => {
      console.error('Redis connection error:', error);
      redisClient = null;
    });

    await redisClient.ping();
    console.log('✅ Redis cache initialized');
    return redisClient;
  } catch (error) {
    console.warn('Redis initialization failed, using memory cache:', error);
    redisClient = null;
    return null;
  }
}

// Cache service interface
export class CacheService {
  private static redis: any = null;
  private static initialized = false;

  static async init(): Promise<void> {
    if (this.initialized) return;
    this.redis = await initRedis();
    this.initialized = true;
  }

  // Generic get method
  static async get<T>(key: string): Promise<T | null> {
    await this.init();

    try {
      // Try Redis first
      if (this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value);
        }
      }

      // Fallback to memory cache
      return memoryCache.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return memoryCache.get(key);
    }
  }

  // Generic set method
  static async set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
    await this.init();
    const ttl = ttlSeconds || CACHE_CONFIG.defaultTTL;

    try {
      // Set in Redis if available
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(data));
      }

      // Always set in memory cache as backup
      memoryCache.set(key, data, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
      // Ensure memory cache is set even if Redis fails
      memoryCache.set(key, data, ttl);
    }
  }

  // Delete method
  static async delete(key: string): Promise<void> {
    await this.init();

    try {
      if (this.redis) {
        await this.redis.del(key);
      }
      memoryCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      memoryCache.delete(key);
    }
  }

  // Clear all cache
  static async clear(): Promise<void> {
    await this.init();

    try {
      if (this.redis) {
        await this.redis.flushdb();
      }
      memoryCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
      memoryCache.clear();
    }
  }

  // Domain-specific cache methods
  static async getMatrixCalculation(assetIds: string[], scenarioIds: string[]): Promise<any | null> {
    const key = `matrix:${assetIds.sort().join(',')}:${scenarioIds.sort().join(',')}`;
    return this.get(key);
  }

  static async setMatrixCalculation(assetIds: string[], scenarioIds: string[], data: any): Promise<void> {
    const key = `matrix:${assetIds.sort().join(',')}:${scenarioIds.sort().join(',')}`;
    await this.set(key, data, CACHE_CONFIG.matrixTTL);
  }

  static async getPortfolioInsights(portfolioHash: string): Promise<any | null> {
    const key = `insights:${portfolioHash}`;
    return this.get(key);
  }

  static async setPortfolioInsights(portfolioHash: string, data: any): Promise<void> {
    const key = `insights:${portfolioHash}`;
    await this.set(key, data, CACHE_CONFIG.insightsTTL);
  }

  static async getAssetCategorization(assetName: string): Promise<any | null> {
    const key = `categorize:${assetName.toLowerCase()}`;
    return this.get(key);
  }

  static async setAssetCategorization(assetName: string, data: any): Promise<void> {
    const key = `categorize:${assetName.toLowerCase()}`;
    await this.set(key, data, CACHE_CONFIG.categorizesTTL);
  }

  static async getTechnologyScenarios(): Promise<any | null> {
    const key = 'scenarios:technology';
    return this.get(key);
  }

  static async setTechnologyScenarios(data: any): Promise<void> {
    const key = 'scenarios:technology';
    await this.set(key, data, CACHE_CONFIG.scenariosTTL);
  }

  // Cache invalidation methods
  static async invalidateMatrixCache(): Promise<void> {
    await this.init();

    try {
      if (this.redis) {
        const keys = await this.redis.keys('matrix:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Clear memory cache matrix entries
      for (const key of Array.from(memoryCache['cache'].keys())) {
        if (key.startsWith('matrix:')) {
          memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Matrix cache invalidation error:', error);
    }
  }

  static async invalidateInsightsCache(): Promise<void> {
    await this.init();

    try {
      if (this.redis) {
        const keys = await this.redis.keys('insights:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Clear memory cache insights entries
      for (const key of Array.from(memoryCache['cache'].keys())) {
        if (key.startsWith('insights:')) {
          memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Insights cache invalidation error:', error);
    }
  }

  // Performance monitoring
  static async getCacheStats(): Promise<{ redis: any; memory: any }> {
    await this.init();

    const memoryStats = {
      size: memoryCache['cache'].size,
      keys: Array.from(memoryCache['cache'].keys()),
    };

    let redisStats = null;
    try {
      if (this.redis) {
        redisStats = await this.redis.info('memory');
      }
    } catch (error) {
      console.error('Redis stats error:', error);
    }

    return { redis: redisStats, memory: memoryStats };
  }
}

// Utility function to generate cache keys
export function generateCacheKey(prefix: string, ...params: (string | number)[]): string {
  return `${prefix}:${params.join(':')}`;
}

// Cache warming utilities
export class CacheWarmer {
  static async warmMatrixCache(commonAssets: string[], scenarios: string[]): Promise<void> {
    console.log('🔥 Warming matrix cache...');
    
    // Pre-calculate common combinations
    const combinations = [
      commonAssets.slice(0, 3), // Top 3 assets
      commonAssets.slice(0, 5), // Top 5 assets
      commonAssets, // All assets
    ];

    for (const assets of combinations) {
      try {
        const cached = await CacheService.getMatrixCalculation(assets, scenarios);
        if (!cached) {
          // This would trigger actual calculation and caching
          console.log(`Cache miss for ${assets.length} assets, triggering calculation...`);
        }
      } catch (error) {
        console.error('Cache warming error:', error);
      }
    }
  }

  static async warmInsightsCache(portfolioHashes: string[]): Promise<void> {
    console.log('🔥 Warming insights cache...');
    
    for (const hash of portfolioHashes) {
      try {
        const cached = await CacheService.getPortfolioInsights(hash);
        if (!cached) {
          console.log(`Cache miss for portfolio ${hash}, triggering calculation...`);
        }
      } catch (error) {
        console.error('Insights cache warming error:', error);
      }
    }
  }
}

export default CacheService; 