import type { TestUser } from './helpers/user';
import '@testing-library/jest-dom/extend-expect';

declare global {
  var __TEST_USER__: TestUser | undefined; // eslint-disable-line no-var
}
export {};
