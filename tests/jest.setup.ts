/**
 * Unified Jest-style setup that runs inside Vitest.
 * All vi.importActual calls are awaited & typed.
 */

import { vi } from 'vitest';
import '@/tests/setup/vitestJestShim';   // injects global `jest`

import { setupDeterministicAuth } from './helpers/auth';
import { DEFAULT_ADMIN_USER } from './helpers/user';

/* deterministic env */
process.env.RL_LIMIT   = '1';
process.env.TEST_SEED  = '42';

setupDeterministicAuth(DEFAULT_ADMIN_USER);

/* PrismaClient mock (only in test env) */
if (process.env.NODE_ENV === 'test') {
  vi.mock('@prisma/client', async () => {
    const { PrismaClient } = (await vi.importActual<any>('@prisma/client'));
    const { prisma, AssetKind, Prisma }  = (await vi.importActual<any>('./mocks/prisma'));
    return {
      PrismaClient: vi.fn().mockImplementation(() => prisma),
      AssetKind,
      Prisma
    };
  });

  /* Clerk mock */
  vi.mock('@clerk/nextjs/server', async () => {
    const jwt     = await vi.importActual<typeof import('jsonwebtoken')>('jsonwebtoken');
    const logger  = (await vi.importActual<any>('@/lib/logger')).logger;

    const getUserId = (req: any) => {
      const token = req?.headers?.get?.('Authorization')?.replace('Bearer ', '');
      return token ? (jwt.decode(token) as any)?.sub : 'user_test123';
    };

    return {
      auth: vi.fn(async (req: any) => ({ userId: getUserId(req) })),
      currentUser: vi.fn(async (req: any) => ({
        id: getUserId(req),
        username: 'testuser',
      })),
      clerkClient: { users: { getUser: vi.fn((id: string) => ({ id })) } },
    };
  });
}

/* other vi.importActual helpers can follow the same await pattern */
