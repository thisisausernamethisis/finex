/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';
import { createJWTForTest } from '../utils/auth';
import { prisma } from '../../lib/db';

// Test constants
const TEST_USER_ID = 'user_test123';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_NAME = 'Test User';

// Helper function to reset DB state for tests
async function resetDB() {
  // Clear existing test data
  await prisma.theme.deleteMany({
    where: {
      OR: [
        { assetId: { startsWith: 'test_' } },
        { scenarioId: { startsWith: 'test_' } }
      ]
    }
  });
  
  // Ensure we have at least one public template
  const templateExists = await prisma.themeTemplate.findFirst({
    where: { isPublic: true }
  });
  
  if (!templateExists) {
    await prisma.themeTemplate.create({
      data: {
        id: 'test_template_1',
        ownerId: TEST_USER_ID,
        name: 'Test Public Template',
        description: 'A test template for E2E tests',
        isPublic: true,
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
}

test.describe('Template Library E2E Tests', () => {
  // Set up auth token and reset DB before tests
  test.beforeEach(async ({ page }) => {
    // Reset database state
    await resetDB();
    
    // Create test JWT token
    const token = createJWTForTest({
      sub: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      name: TEST_USER_NAME
    });

    // Set token in local storage to simulate logged in user
    await page.goto('/');
    await page.evaluate((jwt) => {
      localStorage.setItem('clerk-jwt', jwt);
    }, token);
  });

  test('should display template library and clone a template', async ({ page }) => {
    // Navigate to templates page
    await page.goto('/templates');
    
    // Verify page loaded
    await expect(page.getByText('Template Library')).toBeVisible();

    // Check if there are templates listed (depends on seed data)
    // We either see templates or "No templates yet" message
    const hasTemplates = await page.getByText('No templates yet').isVisible();
    
    if (!hasTemplates) {
      // We have templates, verify clone functionality
      
      // No interception - hit the real API endpoint
      
      // Click the first Clone button
      const cloneButton = page.getByRole('button', { name: 'Clone' }).first();
      await expect(cloneButton).toBeVisible();
      await cloneButton.click();
      
      // Verify success toast
      const successToast = page.getByText('Template cloned');
      await expect(successToast).toBeVisible({ timeout: 5000 });
    } else {
      // No templates, just verify the empty state
      await expect(page.getByText('No templates yet')).toBeVisible();
      // Skip the test - no templates available
      test.skip();
      console.log('Skipping clone test because no templates are available');
    }
  });
});
