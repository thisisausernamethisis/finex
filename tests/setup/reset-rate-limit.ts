import { createRateLimiter } from '../../lib/rateLimit';

// Create a global rate limiter instance with a higher limit for tests
(global as any).__testRateLimiter = createRateLimiter(100);

// Reset the rate limiter before each test
beforeEach(() => (global as any).__testRateLimiter.__reset());
