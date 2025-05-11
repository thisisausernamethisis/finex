/**
 * Mock implementation of rate limit functionality for tests
 */

// Shared mock limiter instance
let mockLimiter: ReturnType<typeof createRateLimiter>;

/**
 * Result of a rate limit check
 */
export interface RLResult {
  success: boolean;
  limit: number;
  remaining: number;
}

/**
 * Type for objects that have headers
 */
export type HasHeaders = { headers: Headers | Record<string, string> };

/**
 * Sets a header on an object that has headers
 */
export function setHeader(h: any, k: string, v: string) {
  'set' in h ? (h as Headers).set(k, v) : (h[k] = v);
  return h;
}

/**
 * Creates a mock rate limiter with a higher limit for tests
 */
export function createRateLimiter(LIMIT = 100) {
  const calls = new Map<string, number>();

  function check(key: string = 'GLOBAL'): RLResult {
    const used = (calls.get(key) ?? 0) + 1;
    calls.set(key, used);
    return { success: used <= LIMIT, limit: LIMIT, remaining: Math.max(0, LIMIT - used) };
  }

  function limit(res?: HasHeaders, key = 'GLOBAL'): RLResult {
    const r = check(key);
    if (res) {
      setHeader(res.headers, 'X-RateLimit-Limit', String(r.limit));
      setHeader(res.headers, 'X-RateLimit-Remaining', String(r.remaining));
    }
    return r;
  }

  function __reset() { calls.clear(); }

  return { check, limit, __reset };
}

/**
 * Get or create the global mock rate limiter
 */
export function getGlobalRateLimiter() {
  if (!mockLimiter) {
    mockLimiter = createRateLimiter();
  }
  return mockLimiter;
}

/**
 * Reset the global mock rate limiter
 */
export function __resetRateLimit() {
  if (mockLimiter) {
    mockLimiter.__reset();
  } else {
    mockLimiter = createRateLimiter();
  }
}

// Initialize mock limiter on module load
mockLimiter = createRateLimiter();
