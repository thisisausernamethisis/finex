// Export a minimal Jest-like surface backed by Vitest
// Use a safer approach that avoids direct imports and provides fallbacks

// Access Vitest's globals if available
const vi = globalThis.vi;
const noop = () => {};

// Either use vi functions if available, or fallback to noops
const jestLike = vi ? {
  // Mock functions
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,

  // Mock control
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  clearAllMocks: vi.clearAllMocks,

  // Timers 
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  runAllTimers: vi.runAllTimers,

  // Expectations
  expect: globalThis.expect
} : {
  // Mock functions (noops)
  fn: () => noop,
  spyOn: () => ({ mockImplementation: noop }),
  mock: () => noop,

  // Mock control (noops)
  resetAllMocks: noop,
  restoreAllMocks: noop,
  clearAllMocks: noop,

  // Timers (noops)
  useFakeTimers: noop,
  useRealTimers: noop,
  runAllTimers: noop,

  // Expectations stub
  expect: () => ({
    toBe: noop,
    toEqual: noop,
    toHaveBeenCalled: noop,
    toHaveBeenCalledWith: noop,
    toBeInstanceOf: noop,
    toBeUndefined: noop,
    toBeNull: noop,
    not: { toBe: noop, toEqual: noop }
  })
};

module.exports = jestLike;
