/**
 * Vitest Setup File
 * 
 * This file is executed before running tests in Vitest.
 * It configures the Vitest environment and ensures proper cleanup.
 */

import { afterAll, vi } from 'vitest';
import { disconnectPrisma } from './tests/_setup/prismaTestEnv';

// Mock the repositories to use the mock implementations
vi.mock('./lib/repositories', () => {
  return {
    ThemeTemplateRepository: vi.fn(() => ({
      listTemplates: vi.fn(),
      getTemplateById: vi.fn(),
      createTemplate: vi.fn(),
      templateExists: vi.fn(),
      deleteTemplate: vi.fn(),
    })),
    AssetRepository: vi.fn(() => ({
      listAssets: vi.fn(),
      getAssetById: vi.fn(),
      createAsset: vi.fn(),
      updateAsset: vi.fn(),
      deleteAsset: vi.fn(),
      assetExists: vi.fn(),
    })),
    ScenarioRepository: vi.fn(() => ({
      listScenarios: vi.fn(),
      getScenarioById: vi.fn(),
      createScenario: vi.fn(),
      updateScenario: vi.fn(),
      deleteScenario: vi.fn(),
    })),
    ThemeRepository: vi.fn(() => ({
      getThemeById: vi.fn(),
      createTheme: vi.fn(),
      updateTheme: vi.fn(),
      deleteTheme: vi.fn(),
    })),
    CardRepository: vi.fn(() => ({
      listCards: vi.fn(),
      getCardById: vi.fn(),
      createCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
    })),
    MatrixRepository: vi.fn(() => ({
      getMatrix: vi.fn(),
      updateMatrix: vi.fn(),
    })),
  };
});

// Ensure Prisma client is properly closed after all Vitest tests
// This is important because Vitest tests bypass Jest's globalTeardown
afterAll(disconnectPrisma);
