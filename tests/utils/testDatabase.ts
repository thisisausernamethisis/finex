import { prisma } from '../../lib/db';

/**
 * Sets up test database with initial data
 */
export async function setupTestDatabase(): Promise<void> {
  try {
    // Clear existing data (in reverse dependency order)
    await prisma.matrixAnalysisResult.deleteMany();
    await prisma.chunk.deleteMany();
    await prisma.card.deleteMany();
    await prisma.theme.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.scenario.deleteMany();

    console.log('Test database setup completed');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
}

/**
 * Cleans up test database after tests
 */
export async function cleanupTestDatabase(): Promise<void> {
  try {
    // Clear all test data (in reverse dependency order)
    await prisma.matrixAnalysisResult.deleteMany();
    await prisma.chunk.deleteMany();
    await prisma.card.deleteMany();
    await prisma.theme.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.scenario.deleteMany();

    console.log('Test database cleanup completed');
  } catch (error) {
    console.error('Test database cleanup failed:', error);
    throw error;
  }
}

/**
 * Creates a test user and returns auth token
 */
export async function createTestUser(email: string = 'test@example.com'): Promise<string> {
  // This would typically create a user in the database
  // For now, we'll just return a test token
  const { createJWTForTest } = await import('./auth');
  return createJWTForTest({ 
    sub: 'user_test123', 
    email,
    name: 'Test User'
  });
} 