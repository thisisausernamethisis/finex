// Export a minimal Jest-like surface backed by Vitest
// Use a stub object since vitest can't be required directly in CJS
// The actual implementations will be provided at runtime by Vitest

/* Export a minimal Jest-like surface that will be filled in by Vitest at runtime */
const jestLike = {
  // Mock functions
  fn: () => {},
  spyOn: () => {},
  mock: () => {},

  // Mock control
  resetAllMocks: () => {},
  restoreAllMocks: () => {},
  clearAllMocks: () => {},

  // Timers 
  useFakeTimers: () => {},
  useRealTimers: () => {},
  runAllTimers: () => {},

  // Expectations stub
  expect: () => ({
    toBe: () => {},
    toEqual: () => {},
    toHaveBeenCalled: () => {},
    toHaveBeenCalledWith: () => {}
  })
};

// This is just a stub that will be overridden at runtime
module.exports = jestLike;
