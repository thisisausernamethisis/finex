/**
 * Rate limiter implementation
 * 
 * This provides a consistent API for rate limiting across the application.
 * The factory approach allows for creating separate rate limiters for different
 * parts of the application with different limits.
 */

/**
 * Result of a rate limit check
 */
export interface RLResult {
  success: boolean;  // Whether the request should be allowed to proceed
  limit: number;     // The configured limit
  remaining: number; // How many requests remain in the current window
}

/**
 * Type for objects that have headers (Request, Response, etc.)
 */
export type HasHeaders = { headers: Headers | Record<string, string> };

/**
 * Sets a header on an object that has headers
 * Works with both Headers objects and plain record objects
 */
export function setHeader(h: HasHeaders['headers'], k: string, v: string) {
  'set' in h ? (h as Headers).set(k, v) : (h[k] = v);
  return h;
}

// Global instance of the rate limiter
let globalLimiter: ReturnType<typeof createRateLimiter> | null = null;

/**
 * Creates a new rate limiter
 * @param LIMIT The maximum number of requests allowed in the window
 * @returns A rate limiter object with check, limit, and reset methods
 */
export function createRateLimiter(LIMIT = Number(process.env.RL_LIMIT ?? 50)) {
  const calls = new Map<string, number>();

  /**
   * Check if a request should be allowed
   * @param key The key to use for rate limiting (e.g., IP address)
   * @returns Result with success flag and rate limit info
   */
  function check(key: string = 'GLOBAL'): RLResult {
    if (!calls.has(key)) {
    // New IP - initialize with one token already used
    const tokens = LIMIT - 1;
      calls.set(key, 1);
      return { success: true, limit: LIMIT, remaining: tokens };
    }
    
    // Existing IP - increment usage count
    const used = calls.get(key)! + 1;
    calls.set(key, used);
    return { success: used <= LIMIT, limit: LIMIT, remaining: Math.max(0, LIMIT - used) };
  }

  /**
   * Check rate limit and set headers on response
   * @param res The response object to set headers on
   * @param key The key to use for rate limiting
   * @returns Result with success flag and rate limit info
   */
  function limit(res?: HasHeaders, key = 'GLOBAL'): RLResult {
    const r = check(key);
    if (res) {
      setHeader(res.headers, 'X-RateLimit-Limit', String(r.limit));
      setHeader(res.headers, 'X-RateLimit-Remaining', String(r.remaining));
    }
    return r;
  }

  /**
   * Reset the rate limiter state (for testing)
   */
  function __reset() { calls.clear(); }

  return { check, limit, __reset };
}

/**
 * Get or create the global rate limiter
 */
export function getGlobalRateLimiter() {
  if (!globalLimiter) {
    globalLimiter = createRateLimiter();
  }
  return globalLimiter;
}

/**
 * Reset the global rate limiter (for testing)
 */
export function __resetRateLimit() {
  if (globalLimiter) {
    globalLimiter.__reset();
  }
}
