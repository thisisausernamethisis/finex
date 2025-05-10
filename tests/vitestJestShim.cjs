import { vi, expect } from 'vitest';

/* Export a minimal Jest-like surface backed by Vitest */
const jestLike = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,

  /* mock-control */
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  clearAllMocks: vi.clearAllMocks,

  /* timers */
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  runAllTimers: vi.runAllTimers,

  /* expectations */
  expect
};

module.exports = jestLike;
