import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../../../lib/rateLimit';

describe('Rate Limiter', () => {
  it('rate limiter exposes two noop functions', () => {
    const rl = createRateLimiter();
    expect(typeof rl.limit).toBe('function');
    expect(typeof rl.check).toBe('function');
  });
  
  it('limit function resolves to true', async () => {
    const rl = createRateLimiter();
    const result = await rl.limit();
    expect(result).toBe(true);
  });
  
  it('check function returns true', () => {
    const rl = createRateLimiter();
    const result = rl.check();
    expect(result).toBe(true);
  });
});
