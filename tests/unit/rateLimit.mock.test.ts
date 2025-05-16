import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter } from '../../__mocks__/lib/rateLimit';

/**
 * Tests for the rate-limit mock implementation
 * 
 * This test ensures our mock implementation matches the interface
 * of the real rate limiter and behaves predictably in tests.
 * 
 * Part of T-244: fix(mock): rate-limit parity
 */
describe('Rate Limit Mock', () => {
  it('sets correct headers and returns success with default limit', () => {
    // Create a mock Headers object to test with
    const headers = new Headers();
    
    // Create the rate limiter with default settings
    const limiter = createRateLimiter();
    
    // Call the limit method
    const result = limiter.limit({ headers });
    
    // Verify the result indicates success
    expect(result.success).toBe(true);
    
    // Verify the expected headers were set
    expect(headers.get('X-RateLimit-Limit')).toBe('10');
    expect(headers.get('X-RateLimit-Remaining')).toBe('9');
  });
  
  it('sets correct headers with custom limit value', () => {
    // Create a mock Headers object to test with
    const headers = new Headers();
    
    // Create the rate limiter with a custom limit
    const customLimit = 50;
    const limiter = createRateLimiter(customLimit);
    
    // Call the limit method
    const result = limiter.limit({ headers });
    
    // Verify the expected headers match the custom limit
    expect(headers.get('X-RateLimit-Limit')).toBe('50');
    expect(headers.get('X-RateLimit-Remaining')).toBe('49');
  });
  
  it('always returns success regardless of request frequency', () => {
    // Create a mock Headers object to test with
    const headers = new Headers();
    
    // Create the rate limiter with a limit of 1
    const limiter = createRateLimiter(1);
    
    // First call should succeed
    const result1 = limiter.limit({ headers });
    expect(result1.success).toBe(true);
    
    // Second call should also succeed even though we'd be over the limit
    // in the real implementation
    const result2 = limiter.limit({ headers });
    expect(result2.success).toBe(true);
  });
});
