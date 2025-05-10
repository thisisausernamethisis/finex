import { createRateLimiter } from '../../lib/rateLimit';

// Create a global rate limiter with a generous default limit for tests
(global as any).__testRL = createRateLimiter(100);

// Reset the rate limiter before each test
beforeEach(() => (global as any).__testRL.__reset());
