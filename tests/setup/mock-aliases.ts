import { vi } from 'vitest';
import '@/tests/setup/vitestJestShim';      // global jest helpers

/* centralised alias mocks */
vi.mock('@/lib/repositories');
vi.mock('@/lib/repositories/themeTemplateRepository');
vi.mock('lib/repositories');
vi.mock('lib/repositories/themeTemplateRepository');
vi.mock('@clerk/nextjs/server');

/* canonical single path for rate-limit util */
vi.mock('@/lib/rateLimit', async () => (await vi.importActual('@/lib/rateLimit')));

/* reset between tests */
beforeEach(async () => {
  try {
    const { __resetRateLimit } = await import('@/lib/rateLimit');
    __resetRateLimit?.();
  } catch (_) {
    /* ignore */
  }
  vi.restoreAllMocks();
});
