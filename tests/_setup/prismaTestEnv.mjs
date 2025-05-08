/**
 * ESM shim for prismaTestEnv.js
 * 
 * This is a thin ESM wrapper to re-export the disconnectPrisma function
 * from the original file, maintaining compatibility while we migrate.
 */

// Re-export disconnectPrisma from the original file
export { disconnectPrisma } from './prismaTestEnv.js';
