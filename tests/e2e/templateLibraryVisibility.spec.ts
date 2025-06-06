/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';
import { createJWTForTest } from '../utils/auth';
import { prisma } from '../../lib/db';

// Test constants
const TEST_USER_ID = 'user_test123';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_NAME = 'Test User';
const TEST_TEMPLATE_NAME = 'Visibility Test Template';

// Helper function to reset DB state for tests
async function resetDB() {
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

test.describe('Template Library Visibility E2E Tests', () => {
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

  test('should publish a private template and show visibility badge', async ({ page }) => {
    // Navigate to templates page
    await page.goto('/templates');
    
    // Verify page loaded
    await expect(page.getByText('Template Library')).toBeVisible();

    // Find the private template
    const templateCard = page.getByText(TEST_TEMPLATE_NAME).first();
    await expect(templateCard).toBeVisible();
    
    // Verify initial state shows "Private" badge
    const privateBadgeSelector = page.locator('div', { hasText: TEST_TEMPLATE_NAME })
      .locator('span', { hasText: 'Private' });
    await expect(privateBadgeSelector).toBeVisible();
    
    // Find the "Publish" button only visible to the owner
    const publishButton = page.getByRole('button', { name: 'Publish' });
    await expect(publishButton).toBeVisible();
    
    // Click the Publish button
    await publishButton.click();
    
    // Verify success toast
    const successToast = page.getByText('Template published');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    
    // Wait for page refresh (initiated by handleToggleVisibility in TemplateCard.tsx)
    await page.waitForURL('/templates');
    
    // Verify the template now shows "Public" badge
    const publicBadgeSelector = page.locator('div', { hasText: TEST_TEMPLATE_NAME })
      .locator('span', { hasText: 'Public' });
    await expect(publicBadgeSelector).toBeVisible();
    
    // Verify "Unpublish" button is now visible
    const unpublishButton = page.getByRole('button', { name: 'Unpublish' });
    await expect(unpublishButton).toBeVisible();
  });
  
  test('should unpublish a public template and show visibility badge', async ({ page }) => {
    // First make the template public for this test
    await prisma.themeTemplate.update({
      where: { id: 'visibility_test_template' },
      data: { isPublic: true }
    });
    
    // Navigate to templates page
    await page.goto('/templates');
    
    // Verify page loaded
    await expect(page.getByText('Template Library')).toBeVisible();

    // Find the public template
    const templateCard = page.getByText(TEST_TEMPLATE_NAME).first();
    await expect(templateCard).toBeVisible();
    
    // Verify initial state shows "Public" badge
    const publicBadgeSelector = page.locator('div', { hasText: TEST_TEMPLATE_NAME })
      .locator('span', { hasText: 'Public' });
    await expect(publicBadgeSelector).toBeVisible();
    
    // Find the "Unpublish" button
    const unpublishButton = page.getByRole('button', { name: 'Unpublish' });
    await expect(unpublishButton).toBeVisible();
    
    // Click the Unpublish button
    await unpublishButton.click();
    
    // Verify success toast
    const successToast = page.getByText('Template unpublished');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    
    // Wait for page refresh
    await page.waitForURL('/templates');
    
    // Verify the template now shows "Private" badge
    const privateBadgeSelector = page.locator('div', { hasText: TEST_TEMPLATE_NAME })
      .locator('span', { hasText: 'Private' });
    await expect(privateBadgeSelector).toBeVisible();
    
    // Verify "Publish" button is now visible
    const publishButton = page.getByRole('button', { name: 'Publish' });
    await expect(publishButton).toBeVisible();
  });
});
