// Export a minimal Jest-like surface backed by Vitest
const vitest = require('vitest');

/* Export a minimal Jest-like surface backed by Vitest */
const jestLike = {
  fn: vitest.vi.fn,
  spyOn: vitest.vi.spyOn,
  mock: vitest.vi.mock,

  /* mock-control */
  resetAllMocks: vitest.vi.resetAllMocks,
  restoreAllMocks: vitest.vi.restoreAllMocks,
  clearAllMocks: vitest.vi.clearAllMocks,

  /* timers */
  useFakeTimers: vitest.vi.useFakeTimers,
  useRealTimers: vitest.vi.useRealTimers,
  runAllTimers: vitest.vi.runAllTimers,

  /* expectations */
  expect: vitest.expect
};

module.exports = jestLike;
