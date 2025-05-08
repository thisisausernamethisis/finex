/**
 * Simple rate limiting utility
 * This is a placeholder implementation that would be replaced with a real
 * Redis-based rate limiter in production.
 */

interface RateLimitResponse {
  /**
   * Whether the request should be rate limited
   */
  isLimited: boolean;
  
  /**
   * Number of requests remaining in the current window
   */
  remaining: number;
  
  /**
   * Time in seconds to wait before making another request
   * (only meaningful if isLimited is true)
   */
  retryAfter?: number;
  
  /**
   * Headers to include in the response
   */
  headers: Record<string, string>;
}

/**
 * In-memory store for rate limiting
 * In production, this would use Redis or another distributed cache
 */
const rateLimitStore: Record<string, { count: number; resetAt: number }> = {};

/**
 * Simple rate limiter that returns remaining quota and retry-after values
 * 
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param maxRequests - Maximum number of requests in the window
 * @param windowSec - Time window in seconds
 * @returns RateLimitResponse with isLimited flag, remaining count, and headers to set on the response
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 100,
  windowSec = 60
): RateLimitResponse {
  const now = Math.floor(Date.now() / 1000);
  
  // Initialize or reset expired entry
  if (!rateLimitStore[identifier] || rateLimitStore[identifier].resetAt <= now) {
    rateLimitStore[identifier] = {
      count: 0,
      resetAt: now + windowSec
    };
  }
  
  // Increment counter
  rateLimitStore[identifier].count++;
  
  // Check if over limit
  const count = rateLimitStore[identifier].count;
  const isLimited = count > maxRequests;
  const remaining = Math.max(0, maxRequests - count);
  const resetAt = rateLimitStore[identifier].resetAt;
  const retryAfter = resetAt - now;
  
  // Prepare headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetAt.toString()
  };
  
  // Add retry-after header if limited
  if (isLimited) {
    headers['Retry-After'] = retryAfter.toString();
  }
  
  return {
    isLimited,
    remaining,
    retryAfter: isLimited ? retryAfter : undefined,
    headers
  };
}
