import { prisma } from '../../../lib/db';

// Test constants
export const TEST_USER_ID = 'user_test123';
export const TEST_USER_EMAIL = 'test@example.com';
export const TEST_USER_NAME = 'Test User';
export const TEST_TEMPLATE_NAME = 'Visibility Test Template';

// Helper function to reset DB state for tests
export async function resetDB() {
  // Clear existing test data
  await prisma.themeTemplate.deleteMany({
    where: {
      name: {
        startsWith: 'Visibility Test'
      }
    }
  });
  
  // Create a private template owned by the test user
  await prisma.themeTemplate.create({
    data: {
      id: 'visibility_test_template',
      ownerId: TEST_USER_ID,
      name: TEST_TEMPLATE_NAME,
      description: 'A private template for visibility testing',
      isPublic: false,
      payload: {
        theme: {
          name: 'Test Theme',
          description: 'Test Description',
          category: 'Test'
        },
        cards: [
          {
            title: 'Test Card',
            content: 'Test Content',
            importance: 1
          }
        ]
      }
    }
  });
}
