// Reset rate limiter before each test
import { createRateLimiter } from '../../lib/rateLimit';

(global as any).__testRL = createRateLimiter(100);

beforeEach(() => {
  (global as any).__testRL.__reset();
});
