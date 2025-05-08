/**
 * Vitest Setup File
 * 
 * This file is executed before running tests in Vitest.
 * It configures the Vitest environment and ensures proper cleanup.
 */

import { afterAll } from 'vitest';
import { disconnectPrisma } from './tests/_setup/prismaTestEnv';

// Ensure Prisma client is properly closed after all Vitest tests
// This is important because Vitest tests bypass Jest's globalTeardown
afterAll(disconnectPrisma);
