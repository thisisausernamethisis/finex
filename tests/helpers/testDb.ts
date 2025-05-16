/**
 * SQLite in-memory database shim for test environment (T-269c)
 * 
 * This module initializes an SQLite in-memory database for unit tests,
 * eliminating the need for a PostgreSQL server during CI.
 * 
 * Features:
 * - Creates an in-memory SQLite database
 * - Runs prisma migrations automatically
 * - Sets up the test environment with test data
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../../lib/logger';

// Promisified exec for running shell commands
const execAsync = promisify(exec);

// Logger for test DB operations
const log = logger.child({ component: 'TestDB' });

/**
 * Initialize the SQLite in-memory database for tests
 */
export async function setupTestDatabase() {
  try {
    log.info('Setting up SQLite in-memory test database');

    // Set DATABASE_URL environment variable for in-memory SQLite
    process.env.DATABASE_URL = 'file:memory:';
    process.env.TEST_DATABASE_URL = 'file:memory:';

    // Create migration directory if it doesn't exist
    const migrationDir = path.join(process.cwd(), 'prisma', 'migrations');
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }

    // Run migrations
    log.info('Running Prisma migrations on in-memory database');
    await execAsync('npx prisma migrate deploy');

    // Set up test seed data if needed
    await seedTestData();

    log.info('Test database setup complete');
    
    return true;
  } catch (error) {
    log.error('Failed to set up test database', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Seed the test database with minimal required data
 */
async function seedTestData() {
  log.info('Seeding test database with minimal data');
  
  // Add your minimal test data seeding here if needed
  // This could be inserted directly via prisma client
}

// Setup the database when this module is imported
setupTestDatabase()
  .then(() => {
    log.info('Test database initialized successfully');
  })
  .catch(err => {
    log.error('Failed to initialize test database', {
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  });
