import { test, expect } from '@playwright/test';

test('Matrix result shows confidence badge with correct styling', async ({ page }) => {
  await page.route('**/api/matrix/**', route => {
    if (route.request().url().includes('/preview/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          assetId: 'asset-123',
          scenarioId: 'scenario-123',
          impact: 'high',
          summary: 'Test summary',
          confidence: 0.9,
          status: 'completed',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });
    }
    return route.continue();
  });

  // Mock search results that should show the confidence badge
  await page.route('**/api/search**', route => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: '1',
            content: 'Test content',
            score: 0.95,
            confidence: 0.9 // High confidence
          },
          {
            id: '2',
            content: 'Another test',
            score: 0.85,
            confidence: 0.7 // Medium confidence
          },
          {
            id: '3',
            content: 'Low confidence example',
            score: 0.6,
            confidence: 0.55 // Low confidence
          }
        ]
      })
    });
  });

  // Visit a matrix page that would display search results
  await page.goto('/matrix?query=test');
  
  // Check for confidence badges
  const badges = await page.getByTestId('confidence-badge').all();
  
  // Verify at least one badge is found
  expect(badges.length).toBeGreaterThan(0);
  
  // Check a high confidence badge (first result)
  const highBadge = badges[0];
  await expect(highBadge).toHaveText('90%');
  await expect(highBadge).toHaveClass(/bg-emerald-600\/10/);
});
