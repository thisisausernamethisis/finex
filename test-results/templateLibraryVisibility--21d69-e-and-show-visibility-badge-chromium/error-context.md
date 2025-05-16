# Test info

- Name: Template Library Visibility E2E Tests >> should publish a private template and show visibility badge
- Location: C:\finex_v3\tests\e2e\templateLibraryVisibility.spec.ts:33:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\bjgut\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | /// <reference types="@playwright/test" />
   2 | import { test, expect } from '@playwright/test';
   3 | import { createJWTForTest } from '../utils/auth';
   4 | import { prisma } from '../../lib/db';
   5 | import { 
   6 |   TEST_USER_ID, 
   7 |   TEST_USER_EMAIL, 
   8 |   TEST_USER_NAME, 
   9 |   TEST_TEMPLATE_NAME, 
   10 |   resetDB 
   11 | } from './helpers/templateHelpers';
   12 |
   13 | test.describe('Template Library Visibility E2E Tests', () => {
   14 |   // Set up auth token and reset DB before tests
   15 |   test.beforeEach(async ({ page }) => {
   16 |     // Reset database state
   17 |     await resetDB();
   18 |     
   19 |     // Create test JWT token
   20 |     const token = createJWTForTest({
   21 |       sub: TEST_USER_ID,
   22 |       email: TEST_USER_EMAIL,
   23 |       name: TEST_USER_NAME
   24 |     });
   25 |
   26 |     // Set token in local storage to simulate logged in user
   27 |     await page.goto('/');
   28 |     await page.evaluate((jwt) => {
   29 |       localStorage.setItem('clerk-jwt', jwt);
   30 |     }, token);
   31 |   });
   32 |
>  33 |   test('should publish a private template and show visibility badge', async ({ page }) => {
      |       ^ Error: browserType.launch: Executable doesn't exist at C:\Users\bjgut\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
   34 |     // Navigate to templates page
   35 |     await page.goto('/templates');
   36 |     
   37 |     // Verify page loaded
   38 |     await expect(page.getByText('Template Library')).toBeVisible();
   39 |
   40 |     // Find the private template
   41 |     const templateCard = page.getByText(TEST_TEMPLATE_NAME).first();
   42 |     await expect(templateCard).toBeVisible();
   43 |     
   44 |     // Verify initial state shows "Private" badge
   45 |     const privateBadgeSelector = page.locator('div', { hasText: TEST_TEMPLATE_NAME })
   46 |       .locator('span', { hasText: 'Private' });
   47 |     await expect(privateBadgeSelector).toBeVisible();
   48 |     
   49 |     // Find the "Publish" button only visible to the owner
   50 |     const publishButton = page.getByRole('button', { name: 'Publish' });
   51 |     await expect(publishButton).toBeVisible();
   52 |     
   53 |     // Click the Publish button
   54 |     await publishButton.click();
   55 |     
   56 |     // Verify success toast
   57 |     const successToast = page.getByText('Template published');
   58 |     await expect(successToast).toBeVisible({ timeout: 5000 });
   59 |     
   60 |     // Wait for page refresh (initiated by handleToggleVisibility in TemplateCard.tsx)
   61 |     await page.waitForURL('/templates');
   62 |     
   63 |     // Verify the template now shows "Public" badge
   64 |     const publicBadgeSelector = page.locator('div', { hasText: TEST_TEMPLATE_NAME })
   65 |       .locator('span', { hasText: 'Public' });
   66 |     await expect(publicBadgeSelector).toBeVisible();
   67 |     
   68 |     // Verify "Unpublish" button is now visible
   69 |     const unpublishButton = page.getByRole('button', { name: 'Unpublish' });
   70 |     await expect(unpublishButton).toBeVisible();
   71 |   });
   72 |   
   73 |   test('should unpublish a public template and show visibility badge', async ({ page }) => {
   74 |     // First make the template public for this test
   75 |     await prisma.themeTemplate.update({
   76 |       where: { id: 'visibility_test_template' },
   77 |       data: { isPublic: true }
   78 |     });
   79 |     
   80 |     // Navigate to templates page
   81 |     await page.goto('/templates');
   82 |     
   83 |     // Verify page loaded
   84 |     await expect(page.getByText('Template Library')).toBeVisible();
   85 |
   86 |     // Find the public template
   87 |     const templateCard = page.getByText(TEST_TEMPLATE_NAME).first();
   88 |     await expect(templateCard).toBeVisible();
   89 |     
   90 |     // Verify initial state shows "Public" badge
   91 |     const publicBadgeSelector = page.locator('div', { hasText: TEST_TEMPLATE_NAME })
   92 |       .locator('span', { hasText: 'Public' });
   93 |     await expect(publicBadgeSelector).toBeVisible();
   94 |     
   95 |     // Find the "Unpublish" button
   96 |     const unpublishButton = page.getByRole('button', { name: 'Unpublish' });
   97 |     await expect(unpublishButton).toBeVisible();
   98 |     
   99 |     // Click the Unpublish button
  100 |     await unpublishButton.click();
  101 |     
  102 |     // Verify success toast
  103 |     const successToast = page.getByText('Template unpublished');
  104 |     await expect(successToast).toBeVisible({ timeout: 5000 });
  105 |     
  106 |     // Wait for page refresh
  107 |     await page.waitForURL('/templates');
  108 |     
  109 |     // Verify the template now shows "Private" badge
  110 |     const privateBadgeSelector = page.locator('div', { hasText: TEST_TEMPLATE_NAME })
  111 |       .locator('span', { hasText: 'Private' });
  112 |     await expect(privateBadgeSelector).toBeVisible();
  113 |     
  114 |     // Verify "Publish" button is now visible
  115 |     const publishButton = page.getByRole('button', { name: 'Publish' });
  116 |     await expect(publishButton).toBeVisible();
  117 |   });
  118 | });
  119 |
```