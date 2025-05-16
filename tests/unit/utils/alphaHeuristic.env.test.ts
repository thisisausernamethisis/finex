import { describe, it, expect, afterEach, vi } from 'vitest';

describe('alphaCache env tunables', async () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    // reload module fresh
    vi.resetModules();
  });

  it('honours ALPHA_CACHE_MAX', () => {
    process.env.ALPHA_CACHE_MAX = '3';
    const { alphaCache } = require('../../../lib/utils/alphaHeuristic');
    alphaCache.clear();
    for (let i = 0; i < 4; i++) alphaCache.set(`k${i}`, { alpha: 0.1, ts: Date.now() });
    expect(alphaCache.size).toBe(3);
  });
});
