/**
 * Jest auto-mock for lib/rateLimit
 */

export interface RateLimiter {
  limit: () => Promise<true>;
  check: () => true;
}

/**
 * Always-green mock: every call to rateLimiter.limit() resolves to true,
 * and rateLimiter.check() returns true synchronously.
 */
export const createRateLimiter = () => ({
  limit: async () => true,
  check: () => true
});

/**
 * Mock implementation for checkRateLimit that always returns non-limited
 */
export const checkRateLimit = () => ({
  isLimited: false,
  remaining: 100,
  retryAfter: 0,
  headers: {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '100',
    'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60)
  }
});
