import { createRateLimiter as real } from 'lib/rateLimit';

export const createRateLimiter = (limit = 100) => {
  const rl = real(limit);
  return rl;             // interface identical
};
