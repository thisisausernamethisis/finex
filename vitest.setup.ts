import { vi, describe, it, beforeEach, afterEach, expect, afterAll } from 'vitest';
import { disconnectPrisma } from './tests/_setup/prismaTestEnv';

// Mock Prisma client with our unified mock
vi.mock('@prisma/client', () => require('./__mocks__/@prisma/client'));

/**
 * Vitest ≥0.34 exposes globals when `globals:true`.
 * Older specs written for Jest still `expect` them, so
 * we register fall-backs here.  TypeScript complains
 * because they're not in the standard lib – use
 * `// @ts-ignore` to keep the setup file noise-free.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.vi ??= vi;
// @ts-ignore
globalThis.describe ??= describe;
// @ts-ignore
globalThis.it ??= it;
// @ts-ignore
globalThis.beforeEach ??= beforeEach;
// @ts-ignore
globalThis.afterEach ??= afterEach;
// @ts-ignore
globalThis.expect ??= expect;

// Ensure Prisma client is properly closed after all Vitest tests
// This is important because Vitest tests bypass Jest's globalTeardown
afterAll(disconnectPrisma);
