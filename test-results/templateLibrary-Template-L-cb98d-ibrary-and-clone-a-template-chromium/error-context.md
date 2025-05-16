# Test info

- Name: Template Library E2E Tests >> should display template library and clone a template
- Location: C:\finex_v3\tests\e2e\templateLibrary.spec.ts:75:7

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
   5 |
   6 | // Test constants
   7 | const TEST_USER_ID = 'user_test123';
   8 | const TEST_USER_EMAIL = 'test@example.com';
   9 | const TEST_USER_NAME = 'Test User';
   10 |
   11 | // Helper function to reset DB state for tests
   12 | async function resetDB() {
   13 |   // Clear existing test data
   14 |   await prisma.theme.deleteMany({
   15 |     where: {
   16 |       OR: [
   17 |         { assetId: { startsWith: 'test_' } },
   18 |         { scenarioId: { startsWith: 'test_' } }
   19 |       ]
   20 |     }
   21 |   });
   22 |   
   23 |   // Ensure we have at least one public template
   24 |   const templateExists = await prisma.themeTemplate.findFirst({
   25 |     where: { isPublic: true }
   26 |   });
   27 |   
   28 |   if (!templateExists) {
   29 |     await prisma.themeTemplate.create({
   30 |       data: {
   31 |         id: 'test_template_1',
   32 |         ownerId: TEST_USER_ID,
   33 |         name: 'Test Public Template',
   34 |         description: 'A test template for E2E tests',
   35 |         isPublic: true,
   36 |         payload: {
   37 |           theme: {
   38 |             name: 'Test Theme',
   39 |             description: 'Test Description',
   40 |             category: 'Test'
   41 |           },
   42 |           cards: [
   43 |             {
   44 |               title: 'Test Card',
   45 |               content: 'Test Content',
   46 |               importance: 1
   47 |             }
   48 |           ]
   49 |         }
   50 |       }
   51 |     });
   52 |   }
   53 | }
   54 |
   55 | test.describe('Template Library E2E Tests', () => {
   56 |   // Set up auth token and reset DB before tests
   57 |   test.beforeEach(async ({ page }) => {
   58 |     // Reset database state
   59 |     await resetDB();
   60 |     
   61 |     // Create test JWT token
   62 |     const token = createJWTForTest({
   63 |       sub: TEST_USER_ID,
   64 |       email: TEST_USER_EMAIL,
   65 |       name: TEST_USER_NAME
   66 |     });
   67 |
   68 |     // Set token in local storage to simulate logged in user
   69 |     await page.goto('/');
   70 |     await page.evaluate((jwt) => {
   71 |       localStorage.setItem('clerk-jwt', jwt);
   72 |     }, token);
   73 |   });
   74 |
>  75 |   test('should display template library and clone a template', async ({ page }) => {
      |       ^ Error: browserType.launch: Executable doesn't exist at C:\Users\bjgut\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
   76 |     // Navigate to templates page
   77 |     await page.goto('/templates');
   78 |     
   79 |     // Verify page loaded
   80 |     await expect(page.getByText('Template Library')).toBeVisible();
   81 |
   82 |     // Check if there are templates listed (depends on seed data)
   83 |     // We either see templates or "No templates yet" message
   84 |     const hasTemplates = await page.getByText('No templates yet').isVisible();
   85 |     
   86 |     if (!hasTemplates) {
   87 |       // We have templates, verify clone functionality
   88 |       
   89 |       // No interception - hit the real API endpoint
   90 |       
   91 |       // Click the first Clone button
   92 |       const cloneButton = page.getByRole('button', { name: 'Clone' }).first();
   93 |       await expect(cloneButton).toBeVisible();
   94 |       await cloneButton.click();
   95 |       
   96 |       // Verify success toast
   97 |       const successToast = page.getByText('Template cloned');
   98 |       await expect(successToast).toBeVisible({ timeout: 5000 });
   99 |     } else {
  100 |       // No templates, just verify the empty state
  101 |       await expect(page.getByText('No templates yet')).toBeVisible();
  102 |       // Skip the test - no templates available
  103 |       test.skip();
  104 |       console.log('Skipping clone test because no templates are available');
  105 |     }
  106 |   });
  107 | });
  108 |
```