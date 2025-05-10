// Mock implementation of repositories
import { vi } from 'vitest';

// Mock ThemeTemplateRepository class
export class ThemeTemplateRepository {
  list = vi.fn();
  find = vi.fn();
}

// Mock ThemeTemplateRepository instance
export const themeTemplateRepository = {
  list: vi.fn(),
  find: vi.fn()
};

// Export the full repositories object with all mocked repositories
export default {
  themeTemplateRepository,
  // Add other repositories as needed
};

// Export constants
export const DEFAULT_PAGE_SIZE = 20;
