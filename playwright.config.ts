import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: { 
    baseURL: 'http://localhost:3000' 
  },
  projects: [
    { 
      name: 'chromium', 
      use: { ...devices['Desktop Chrome'] } 
    }
  ],
});
