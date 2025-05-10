const LIMIT = 1;              // first call allowed, second triggers 429
let counts: Record<string, number> = {};

export const createRateLimiter = () => ({
  check: (key: string = 'global') => {
    counts[key] = (counts[key] || 0) + 1;
    return counts[key] <= LIMIT;
  },
  limit: async (res: { headers: Headers }) => {
    res.headers.set('X-RateLimit-Limit', LIMIT.toString());
    const remaining = Math.max(0, LIMIT - (counts['global'] ?? 0));
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', (Date.now() + 60_000).toString());
    return counts['global'] > LIMIT;
  }
});

export function __resetRateLimit() {
  counts = {};
}

module.exports = { createRateLimiter, __resetRateLimit, default: { __resetRateLimit } };
