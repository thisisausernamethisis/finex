/**
 * Utility to manage Prisma client mocking in test environments
 * 
 * This file is used by jest.setup.ts to mock the Prisma client when running tests
 * with NODE_ENV=test. It ensures that no actual database connections are made
 * during testing.
 */

import { PrismaClient } from '@prisma/client';

// Export the real PrismaClient in non-test environments
// In test environments, this will be mocked by jest.setup.ts
export const prismaClient = new PrismaClient();
