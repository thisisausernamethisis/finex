/**
 * Mock implementation of the rate-limit middleware
 * 
 * This mock matches the interface of the real implementation but
 * always allows requests through and sets standard headers.
 */

/**
 * Creates a rate limiter that mocks the behavior of the real implementation
 * 
 * @param limit The maximum number of requests allowed in the time window (default: 10)
 * @returns A mock rate limiter object with a limit method
 */
export const createRateLimiter = (limit = 10) => ({
  /**
   * Mock implementation that always allows requests and sets rate limit headers
   * 
   * @param options Object containing headers to modify
   * @returns Object with success status
   */
  limit: ({ headers }: { headers: Headers }) => {
    // Set the rate limit headers to match the real implementation
    headers.set('X-RateLimit-Limit', String(limit));
    headers.set('X-RateLimit-Remaining', String(limit - 1));
    
    // Always report success in tests
    return { success: true };
  }
});
