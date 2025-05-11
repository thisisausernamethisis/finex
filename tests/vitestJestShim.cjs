const vi = globalThis.vi;
const noop = () => {};

const jestLike = vi ? {
  fn            : vi.fn,
  spyOn         : vi.spyOn,
  mock          : vi.mock,
  isMockFunction: vi.isMockFunction,
  requireMock   : vi.importMock || ((m) => require(m)),

  /* test helpers forwarded from Vitest globals */
  describe, it, test, beforeAll, afterAll, beforeEach, afterEach,
  expect
} : {
  fn            : () => noop,
  spyOn         : () => ({ mockImplementation: noop }),
  mock          : () => noop,
  isMockFunction: () => false,
  requireMock   : () => ({}),

  /* no-op fallbacks */
  describe: noop, it: noop, test: noop,
  beforeAll: noop, afterAll: noop, beforeEach: noop, afterEach: noop,
  expect: () => ({ not: {} })
};

jestLike.jest   = jestLike;
globalThis.jest = jestLike;
module.exports  = jestLike;
