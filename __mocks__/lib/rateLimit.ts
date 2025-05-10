// Mock implementation of rate limit functionality
import * as real from '../../lib/rateLimit';

export const createRateLimiter = (limit = 100) => real.createRateLimiter(limit);

export function setHeader(h: any, k: string, v: string): real.RLResult {
  'set' in h ? (h as Headers).set(k, v) : (h[k] = v);
  return { success: true, limit: 0, remaining: 0 };
}

export interface RLResult {
  success: boolean;
  limit: number;
  remaining: number;
}
