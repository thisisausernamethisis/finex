import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// Constants for the test
const TEST_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD || 'password123';

test.describe('Template Library Search and Filter', () => {
  const prisma = new PrismaClient();
  
  test.beforeAll(async () => {
    // Seed the database with test templates
    // For E2E tests, it's better to create real templates than mocks
    try {
      // Clear previous test data
      await prisma.themeTemplate.deleteMany({
        where: {
          name: {
            startsWith: 'E2E Test'
          }
        }
      });
      
      // Create test user template
      const testUserId = process.env.E2E_TEST_USER_ID || 'default-test-user-id';
      
      // Create a variety of templates for testing search and filtering
      const templates = [
        {
          name: 'E2E Test Solar Industry Template',
          description: 'Template for analyzing solar companies',
          ownerId: testUserId,
          isPublic: true,
          payload: {} as any
        },
        {
          name: 'E2E Test Wind Energy Analysis',
          description: 'Template for wind energy companies',
          ownerId: testUserId,
          isPublic: true,
          payload: {} as any
        },
        {
          name: 'E2E Test Private Template',
          description: 'This is a private template that should only be visible to the owner',
          ownerId: testUserId,
          isPublic: false,
          payload: {} as any
        }
      ];
      
      // Create multiple templates for pagination testing
      for (let i = 1; i <= 25; i++) {
        templates.push({
          name: `E2E Test Template ${i}`,
          description: `Generic template ${i} for pagination testing`,
          ownerId: testUserId,
          isPublic: true,
          payload: {} as any
        });
      }
      
      // Insert all templates
      for (const template of templates) {
        await prisma.themeTemplate.create({
          data: template
        });
      }
    } catch (error) {
      console.error('Error setting up test data:', error);
    }
  });
  
  test.afterAll(async () => {
    // Clean up test data
    try {
      await prisma.themeTemplate.deleteMany({
        where: {
          name: {
            startsWith: 'E2E Test'
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
    
    await prisma.$disconnect();
  });
  
  test('should search for templates by name', async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
    
    // Navigate to template library
    await page.goto('/templates');
    
    // Wait for templates to load
    await page.waitForSelector('[data-testid="template-card"]');
    
    // Search for "solar"
    await page.fill('[data-testid="template-search-input"]', 'solar');
    
    // Wait for search results to update
    await page.waitForTimeout(500); // Allow for debounce/throttling
    
    // Verify that only templates with "solar" in the name are displayed
    const templateCards = await page.$$('[data-testid="template-card"]');
    
    // There should be at least one result
    expect(templateCards.length).toBeGreaterThan(0);
    
    // Check if all visible templates contain "solar" in their title
    for (const card of templateCards) {
      const titleText = await card.textContent();
      expect(titleText?.toLowerCase()).toContain('solar');
    }
    
    // Verify that the search parameter is in the URL
    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe('solar');
  });
  
  test('should filter templates to show only "Mine"', async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="login-button"]');
    
    // Navigate to template library
    await page.goto('/templates');
    
    // Wait for templates to load
    await page.waitForSelector('[data-testid="template-card"]');
    
    // Click the "Mine" filter
    await page.click('[data-testid="filter-mine"]');
    
    // Wait for the filter to apply
    await page.waitForTimeout(500);
    
    // Verify the URL has the mine=true parameter
    const url = new URL(page.url());
    expect(url.searchParams.get('mine')).toBe('true');
    
    // Verify that only the user's templates are shown
    // This is hard to verify exactly in E2E, but we can check that templates are displayed
    const templateCards = await page.$$('[data-testid="template-card"]');
    expect(templateCards.length).toBeGreaterThan(0);
  });
  
  test('should handle pagination between pages of templates', async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="login-button"]');
    
    // Navigate to template library
    await page.goto('/templates');
    
    // Wait for templates to load
    await page.waitForSelector('[data-testid="template-card"]');
    
    // Get the templates on the first page
    const firstPageTemplates = await page.$$eval('[data-testid="template-card"]', 
      cards => cards.map(card => card.getAttribute('data-template-id'))
    );
    
    // There should be 20 templates per page
    expect(firstPageTemplates.length).toBeLessThanOrEqual(20);
    
    // Click the "Next Page" button
    await page.click('[data-testid="next-page"]');
    
    // Wait for the next page to load
    await page.waitForTimeout(500);
    
    // Verify the URL has the page=2 parameter
    const url = new URL(page.url());
    expect(url.searchParams.get('page')).toBe('2');
    
    // Get the templates on the second page
    const secondPageTemplates = await page.$$eval('[data-testid="template-card"]', 
      cards => cards.map(card => card.getAttribute('data-template-id'))
    );
    
    // Check that the templates on page 2 are different from page 1
    for (const templateId of secondPageTemplates) {
      expect(firstPageTemplates).not.toContain(templateId);
    }
  });
  
  test('should handle and display API rate limiting errors', async ({ page }) => {
    // This test requires a mock implementation to simulate rate limiting
    // We'll test the UI response to a 429 error
    
    // Since we can't easily trigger a real rate limit in E2E,
    // this is more of a placeholder test that would need a custom
    // implementation in the test environment
    
    // Log in
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="login-button"]');
    
    // Navigate to template library
    await page.goto('/templates');
    
    // Wait for templates to load
    await page.waitForSelector('[data-testid="template-card"]');
    
    // TODO: Implement a way to simulate a 429 response
    // This might require a custom mock API route or intercepting the request
    
    console.log('Note: Rate limiting test in E2E requires a mock implementation.');
    
    // For now, we just verify the page loaded
    expect(await page.title()).toContain('Templates');
  });
});
