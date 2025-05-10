/**
 * Vitest to Jest compatibility shim
 * This provides Jest-compatible globals in a Vitest environment
 */

// Check if we're in a Vitest context
const isVitestEnv = typeof vi !== 'undefined';

// Check if Jest exists in global scope
const hasJest = typeof jest !== 'undefined';

// Create stubs that will work in both Vitest and Jest environments
const mockFn = isVitestEnv ? vi.fn : hasJest ? jest.fn : () => ({ mockReturnValue: () => ({}) });
const mockModule = isVitestEnv ? vi.mock : hasJest ? jest.mock : () => {};
const spyOn = isVitestEnv ? vi.spyOn : hasJest ? jest.spyOn : () => ({});

// Export basic Jest compatible functions that map to Vitest functions when available
module.exports = {
  // Mock functions
  jest: {
    fn: mockFn,
    mock: mockModule,
    spyOn: spyOn,
    resetAllMocks: isVitestEnv ? vi.resetAllMocks : hasJest ? jest.resetAllMocks : () => {},
    restoreAllMocks: isVitestEnv ? vi.restoreAllMocks : hasJest ? jest.restoreAllMocks : () => {},
    clearAllMocks: isVitestEnv ? vi.clearAllMocks : hasJest ? jest.clearAllMocks : () => {},
  },
  
  // Global test functions - these should be available in both Jest and Vitest
  describe: globalThis.describe || (() => {}),
  test: globalThis.test || globalThis.it || (() => {}),
  it: globalThis.it || globalThis.test || (() => {}),
  expect: globalThis.expect || (() => ({ toBe: () => {}, toEqual: () => {} })),
  beforeEach: globalThis.beforeEach || (() => {}),
  afterEach: globalThis.afterEach || (() => {}),
  beforeAll: globalThis.beforeAll || (() => {}),
  afterAll: globalThis.afterAll || (() => {}),
  
  // Mock settings
  automock: false,
  
  // Common helpers
  mockFn,
  
  // Additional Jest-specific functions that map to Vitest equivalents
  useFakeTimers: () => isVitestEnv ? vi.useFakeTimers() : hasJest ? jest.useFakeTimers() : {},
  useRealTimers: () => isVitestEnv ? vi.useRealTimers() : hasJest ? jest.useRealTimers() : {},
  runAllTimers: () => isVitestEnv ? vi.runAllTimers() : hasJest ? jest.runAllTimers() : {},
  runOnlyPendingTimers: () => isVitestEnv ? vi.runOnlyPendingTimers() : hasJest ? jest.runOnlyPendingTimers() : {},
  advanceTimersByTime: (ms) => isVitestEnv ? vi.advanceTimersByTime(ms) : hasJest ? jest.advanceTimersByTime(ms) : {}
};
