/**
 * Vitest to Jest compatibility shim
 * This provides Jest-compatible globals in a Vitest environment
 */

// Check if we're in a Vitest context
const isVitestEnv = typeof vi !== 'undefined';

// Create stubs that will work in both Vitest and Jest environments
const mockFn = isVitestEnv ? vi.fn : jest ? jest.fn : () => ({ mockReturnValue: () => ({}) });
const mockModule = isVitestEnv ? vi.mock : jest ? jest.mock : () => {};
const spyOn = isVitestEnv ? vi.spyOn : jest ? jest.spyOn : () => ({});

// Export basic Jest compatible functions that map to Vitest functions when available
module.exports = {
  // Mock functions
  jest: {
    fn: mockFn,
    mock: mockModule,
    spyOn: spyOn,
    resetAllMocks: isVitestEnv ? vi.resetAllMocks : jest ? jest.resetAllMocks : () => {},
    restoreAllMocks: isVitestEnv ? vi.restoreAllMocks : jest ? jest.restoreAllMocks : () => {},
    clearAllMocks: isVitestEnv ? vi.clearAllMocks : jest ? jest.clearAllMocks : () => {},
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
  useFakeTimers: () => isVitestEnv ? vi.useFakeTimers() : jest ? jest.useFakeTimers() : {},
  useRealTimers: () => isVitestEnv ? vi.useRealTimers() : jest ? jest.useRealTimers() : {},
  runAllTimers: () => isVitestEnv ? vi.runAllTimers() : jest ? jest.runAllTimers() : {},
  runOnlyPendingTimers: () => isVitestEnv ? vi.runOnlyPendingTimers() : jest ? jest.runOnlyPendingTimers() : {},
  advanceTimersByTime: (ms) => isVitestEnv ? vi.advanceTimersByTime(ms) : jest ? jest.advanceTimersByTime(ms) : {}
};
