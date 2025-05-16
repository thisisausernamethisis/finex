import type { TestUser } from './user';
import { DEFAULT_ADMIN_USER } from './user';

/** Registers a deterministic user on the test global. */
export function setupDeterministicAuth(user: TestUser = DEFAULT_ADMIN_USER) {
  (globalThis as any).__TEST_USER__ = user;
}
/** Returns the deterministic user for use in mocks. */
export function currentTestUser(): TestUser {
  return (globalThis as any).__TEST_USER__ ?? DEFAULT_ADMIN_USER;
}
