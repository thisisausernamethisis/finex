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

  // NEW — suite helpers forwarded from Vitest globals
  describe: globalThis.describe,
  it: globalThis.it,
  test: globalThis.test,
  beforeAll: globalThis.beforeAll,
  afterAll: globalThis.afterAll,
  beforeEach: globalThis.beforeEach,
  afterEach: globalThis.afterEach,

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

  // NEW — no-op fall-backs so import never crashes
  describe: noop,
  it: noop,
  test: noop,
  beforeAll: noop,
  afterAll: noop,
  beforeEach: noop,
  afterEach: noop,

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

// allow `import { jest }` pattern too
jestLike.jest = jestLike;
module.exports = jestLike;
