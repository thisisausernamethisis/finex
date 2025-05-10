/**
 * Vitest to Jest compatibility shim
 * This provides Jest-compatible globals in a Vitest environment
 */

// Export basic Jest compatible functions that map to Vitest functions
module.exports = {
  // Mock functions
  jest: {
    fn: vi.fn,
    mock: vi.mock,
    spyOn: vi.spyOn,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
    clearAllMocks: vi.clearAllMocks,
  },
  
  // Global test functions
  describe,
  test,
  it: test,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  
  // Mock settings
  automock: false,
  
  // Common helpers
  mockFn: vi.fn,
  
  // Additional Jest-specific functions that map to Vitest equivalents
  useFakeTimers: () => vi.useFakeTimers(),
  useRealTimers: () => vi.useRealTimers(),
  runAllTimers: () => vi.runAllTimers(),
  runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
  advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms)
};
