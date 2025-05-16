/**
 * Shared test constants
 * Extracted to avoid circular dependencies between test setup modules
 */

// Auth constants
export const TEST_USER_ID = 'test-user-123';
export const TEST_TENANT_ID = 'test-tenant-456';
export const TEST_AUTH_TOKEN = 'test-token-abc123';
export const TEST_AUTH_HEADERS = {
  'Authorization': `Bearer ${TEST_AUTH_TOKEN}`
};

// Asset/Scenario constants
export const TEST_ASSET = {
  id: 'test-asset-id',
  name: 'Test Asset',
  description: 'Test asset description'
};

export const TEST_SCENARIO = {
  id: 'test-scenario-id',
  name: 'Test Scenario',
  description: 'Test scenario description'
};

// Time constants
export const TEST_DATE = new Date('2025-01-01T00:00:00Z');
