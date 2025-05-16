/**
 * Lightweight helper for generating mock users in tests.
 * Duplicate string-literal case labels removed to silence Vite/esbuild
 * warnings while preserving original behaviour.
 */

/* ------------------------------------------------------------------ */
/*  Types & constants                                                 */
/* ------------------------------------------------------------------ */

export enum UserRole {
  ADMIN   = 'ADMIN',
  EDITOR  = 'EDITOR',
  VIEWER  = 'VIEWER',
  DEFAULT = 'DEFAULT',
}

export interface TestUser {
  id:    string;
  name:  string;
  role:  UserRole;
  email: string;
}

export const DEFAULT_ADMIN_USER: TestUser = {
  id:    'user_admin',
  name:  'Admin Test',
  role:  UserRole.ADMIN,
  email: 'admin@example.com',
};

const DEFAULT_EDITOR: TestUser = {
  id:    'user_editor',
  name:  'Editor Test',
  role:  UserRole.EDITOR,
  email: 'editor@example.com',
};

const DEFAULT_VIEWER: TestUser = {
  id:    'user_viewer',
  name:  'Viewer Test',
  role:  UserRole.VIEWER,
  email: 'viewer@example.com',
};

/* ------------------------------------------------------------------ */
/*  Helper                                                            */
/* ------------------------------------------------------------------ */

/**
 * Return a canned user object for the requested role.
 * Defaults to an admin user.
 */
export function mockUser(role: UserRole = UserRole.ADMIN): TestUser {
  switch (role) {
    case UserRole.ADMIN:
      return DEFAULT_ADMIN_USER;

    case UserRole.EDITOR:
      return DEFAULT_EDITOR;

    case UserRole.VIEWER:
      return DEFAULT_VIEWER;

    case UserRole.DEFAULT:
    default:
      return DEFAULT_ADMIN_USER;
  }
}

/**
 * Setup a deterministic auth context for tests
 * This ensures consistent user IDs in test runs
 */
export function setupDeterministicAuth(user: TestUser = DEFAULT_ADMIN_USER): void {
  // Store the user in a global context for tests
  // This is just a minimal implementation to make tests pass
  global.__TEST_USER__ = user;
}
