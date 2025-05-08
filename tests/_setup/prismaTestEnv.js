/**
 * Prisma Test Environment Utilities
 * 
 * Shared utilities for managing Prisma connections in test environments.
 * Used by both Jest (via globalTeardown.js) and Vitest (via setup).
 */

// ESM version - converted from CommonJS
import { prisma } from '../mocks/prisma.js';

/**
 * Safely disconnect from the Prisma client
 * This prevents connection leaks and hanging test processes
 */
async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('Successfully disconnected Prisma client');
  } catch (error) {
    console.error('Error disconnecting Prisma client:', error);
  }
}

// Export in ESM format
export { disconnectPrisma };
