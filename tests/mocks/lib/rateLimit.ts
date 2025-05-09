/**
 * Manual mock for lib/rateLimit module for tests
 */

export interface RateLimiter {
  limit: () => Promise<true>;
  check: () => true;
}

export const createRateLimiter = (): RateLimiter => ({
  limit: async () => true,
  check: () => true
});

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
