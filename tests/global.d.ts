import type { TestUser } from './helpers/user';

declare global {
  var __TEST_USER__: TestUser | undefined; // eslint-disable-line no-var
}
export {};
