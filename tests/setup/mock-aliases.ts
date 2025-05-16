import { vi } from 'vitest';

// central alias mocks (hoisted before imports)
vi.mock('lib/repositories');
vi.mock('lib/repositories/themeTemplateRepository');
vi.mock('@/lib/repositories');
vi.mock('@/lib/repositories/themeTemplateRepository');
vi.mock('@clerk/nextjs/server');

// rate-limit mock – single canonical path
vi.mock('lib/rateLimit', async () => (await vi.importActual('lib/rateLimit')));

// Reset mocks before each test for isolation
beforeEach(async () => {
  try {
    // Directly import rateLimit to reset counter with both import paths
    // @ts-ignore - Path resolved at runtime
    const rateLimit = await import('@/lib/rateLimit');
    if (rateLimit && typeof rateLimit.__resetRateLimit === 'function') {
      rateLimit.__resetRateLimit();
    }
    
    // Also try with the non-prefixed path
    try {
      // @ts-ignore - Path resolved at runtime
      const rateLimitDirect = await import('lib/rateLimit');
      if (rateLimitDirect && typeof rateLimitDirect.__resetRateLimit === 'function') {
        rateLimitDirect.__resetRateLimit();
      }
    } catch (e) {
      // Ignore this error - one of the two imports should work
    }
  } catch (e) {
    console.warn('Failed to reset rate limit:', e);
  }
  
  // Restore all mocks after each test
  vi.restoreAllMocks();
});
