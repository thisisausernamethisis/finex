# Test info

- Name: Template Library Search and Filter >> should filter templates to show only "Mine"
- Location: C:\finex_v3\tests\e2e\templateLibrarySearch.spec.ts:130:7

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
   30 |           name: 'E2E Test Solar Industry Template',
   31 |           description: 'Template for analyzing solar companies',
   32 |           ownerId: testUserId,
   33 |           isPublic: true,
   34 |           payload: {} as any
   35 |         },
   36 |         {
   37 |           name: 'E2E Test Wind Energy Analysis',
   38 |           description: 'Template for wind energy companies',
   39 |           ownerId: testUserId,
   40 |           isPublic: true,
   41 |           payload: {} as any
   42 |         },
   43 |         {
   44 |           name: 'E2E Test Private Template',
   45 |           description: 'This is a private template that should only be visible to the owner',
   46 |           ownerId: testUserId,
   47 |           isPublic: false,
   48 |           payload: {} as any
   49 |         }
   50 |       ];
   51 |       
   52 |       // Create multiple templates for pagination testing
   53 |       for (let i = 1; i <= 25; i++) {
   54 |         templates.push({
   55 |           name: `E2E Test Template ${i}`,
   56 |           description: `Generic template ${i} for pagination testing`,
   57 |           ownerId: testUserId,
   58 |           isPublic: true,
   59 |           payload: {} as any
   60 |         });
   61 |       }
   62 |       
   63 |       // Insert all templates
   64 |       for (const template of templates) {
   65 |         await prisma.themeTemplate.create({
   66 |           data: template
   67 |         });
   68 |       }
   69 |     } catch (error) {
   70 |       console.error('Error setting up test data:', error);
   71 |     }
   72 |   });
   73 |   
   74 |   test.afterAll(async () => {
   75 |     // Clean up test data
   76 |     try {
   77 |       await prisma.themeTemplate.deleteMany({
   78 |         where: {
   79 |           name: {
   80 |             startsWith: 'E2E Test'
   81 |           }
   82 |         }
   83 |       });
   84 |     } catch (error) {
   85 |       console.error('Error cleaning up test data:', error);
   86 |     }
   87 |     
   88 |     await prisma.$disconnect();
   89 |   });
   90 |   
   91 |   test('should search for templates by name', async ({ page }) => {
   92 |     // Log in
   93 |     await page.goto('/login');
   94 |     await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
   95 |     await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
   96 |     await page.click('[data-testid="login-button"]');
   97 |     
   98 |     // Wait for dashboard to load
   99 |     await page.waitForURL('/dashboard');
  100 |     
  101 |     // Navigate to template library
  102 |     await page.goto('/templates');
  103 |     
  104 |     // Wait for templates to load
  105 |     await page.waitForSelector('[data-testid="template-card"]');
  106 |     
  107 |     // Search for "solar"
  108 |     await page.fill('[data-testid="template-search-input"]', 'solar');
  109 |     
  110 |     // Wait for search results to update
  111 |     await page.waitForTimeout(500); // Allow for debounce/throttling
  112 |     
  113 |     // Verify that only templates with "solar" in the name are displayed
  114 |     const templateCards = await page.$$('[data-testid="template-card"]');
  115 |     
  116 |     // There should be at least one result
  117 |     expect(templateCards.length).toBeGreaterThan(0);
  118 |     
  119 |     // Check if all visible templates contain "solar" in their title
  120 |     for (const card of templateCards) {
  121 |       const titleText = await card.textContent();
  122 |       expect(titleText?.toLowerCase()).toContain('solar');
  123 |     }
  124 |     
  125 |     // Verify that the search parameter is in the URL
  126 |     const url = new URL(page.url());
  127 |     expect(url.searchParams.get('q')).toBe('solar');
  128 |   });
  129 |   
> 130 |   test('should filter templates to show only "Mine"', async ({ page }) => {
      |       ^ Error: browserType.launch: Executable doesn't exist at C:\Users\bjgut\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
  131 |     // Log in
  132 |     await page.goto('/login');
  133 |     await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
  134 |     await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
  135 |     await page.click('[data-testid="login-button"]');
  136 |     
  137 |     // Navigate to template library
  138 |     await page.goto('/templates');
  139 |     
  140 |     // Wait for templates to load
  141 |     await page.waitForSelector('[data-testid="template-card"]');
  142 |     
  143 |     // Click the "Mine" filter
  144 |     await page.click('[data-testid="filter-mine"]');
  145 |     
  146 |     // Wait for the filter to apply
  147 |     await page.waitForTimeout(500);
  148 |     
  149 |     // Verify the URL has the mine=true parameter
  150 |     const url = new URL(page.url());
  151 |     expect(url.searchParams.get('mine')).toBe('true');
  152 |     
  153 |     // Verify that only the user's templates are shown
  154 |     // This is hard to verify exactly in E2E, but we can check that templates are displayed
  155 |     const templateCards = await page.$$('[data-testid="template-card"]');
  156 |     expect(templateCards.length).toBeGreaterThan(0);
  157 |   });
  158 |   
  159 |   test('should handle pagination between pages of templates', async ({ page }) => {
  160 |     // Log in
  161 |     await page.goto('/login');
  162 |     await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
  163 |     await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
  164 |     await page.click('[data-testid="login-button"]');
  165 |     
  166 |     // Navigate to template library
  167 |     await page.goto('/templates');
  168 |     
  169 |     // Wait for templates to load
  170 |     await page.waitForSelector('[data-testid="template-card"]');
  171 |     
  172 |     // Get the templates on the first page
  173 |     const firstPageTemplates = await page.$$eval('[data-testid="template-card"]', 
  174 |       cards => cards.map(card => card.getAttribute('data-template-id'))
  175 |     );
  176 |     
  177 |     // There should be 20 templates per page
  178 |     expect(firstPageTemplates.length).toBeLessThanOrEqual(20);
  179 |     
  180 |     // Click the "Next Page" button
  181 |     await page.click('[data-testid="next-page"]');
  182 |     
  183 |     // Wait for the next page to load
  184 |     await page.waitForTimeout(500);
  185 |     
  186 |     // Verify the URL has the page=2 parameter
  187 |     const url = new URL(page.url());
  188 |     expect(url.searchParams.get('page')).toBe('2');
  189 |     
  190 |     // Get the templates on the second page
  191 |     const secondPageTemplates = await page.$$eval('[data-testid="template-card"]', 
  192 |       cards => cards.map(card => card.getAttribute('data-template-id'))
  193 |     );
  194 |     
  195 |     // Check that the templates on page 2 are different from page 1
  196 |     for (const templateId of secondPageTemplates) {
  197 |       expect(firstPageTemplates).not.toContain(templateId);
  198 |     }
  199 |   });
  200 |   
  201 |   test('should handle and display API rate limiting errors', async ({ page }) => {
  202 |     // This test requires a mock implementation to simulate rate limiting
  203 |     // We'll test the UI response to a 429 error
  204 |     
  205 |     // Since we can't easily trigger a real rate limit in E2E,
  206 |     // this is more of a placeholder test that would need a custom
  207 |     // implementation in the test environment
  208 |     
  209 |     // Log in
  210 |     await page.goto('/login');
  211 |     await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
  212 |     await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
  213 |     await page.click('[data-testid="login-button"]');
  214 |     
  215 |     // Navigate to template library
  216 |     await page.goto('/templates');
  217 |     
  218 |     // Wait for templates to load
  219 |     await page.waitForSelector('[data-testid="template-card"]');
  220 |     
  221 |     // TODO: Implement a way to simulate a 429 response
  222 |     // This might require a custom mock API route or intercepting the request
  223 |     
  224 |     console.log('Note: Rate limiting test in E2E requires a mock implementation.');
  225 |     
  226 |     // For now, we just verify the page loaded
  227 |     expect(await page.title()).toContain('Templates');
  228 |   });
  229 | });
  230 |
```