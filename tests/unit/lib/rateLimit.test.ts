import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../../../lib/rateLimit';

describe('Rate Limiter', () => {
  it('rate limiter exposes two noop functions', () => {
    const rl = createRateLimiter();
    expect(typeof rl.limit).toBe('function');
    expect(typeof rl.check).toBe('function');
  });
  
  it('limit function resolves to success on first call, failure on second', async () => {
    const rl = createRateLimiter(1); // Set limit to 1 so second call fails
    const { success: first } = rl.limit();
    expect(first).toBe(true);
    
    const { success: second } = rl.limit();
    expect(second).toBe(false);
  });
  
  it('check function returns RLResult with success=true on first call', () => {
    const rl = createRateLimiter();
    const result = rl.check();
    expect(result.success).toBe(true);
    expect(result.limit).toBeGreaterThan(0);
    expect(typeof result.remaining).toBe('number');
  });
});
