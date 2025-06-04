/**
 * Test to verify that Vitest mocking is properly configured
 * 
 * This test ensures that when code imports from '@/lib/repositories',
 * Vitest correctly substitutes our manual mocks from __mocks__/lib/repositories.
 * This protects against future moduleNameMapper drift that could cause tests to use
 * real implementations unexpectedly.
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  ThemeTemplateRepository,
  AssetRepository,
  ScenarioRepository,
  ThemeRepository,
  CardRepository,
  MatrixRepository
} from '@/lib/repositories';

describe('Vitest Repository Mocking', () => {
  it('should properly mock ThemeTemplateRepository', () => {
    const repo = new ThemeTemplateRepository();
    expect(vi.isMockFunction(repo.listTemplates)).toBe(true);
    expect(vi.isMockFunction(repo.getTemplateById)).toBe(true);
    expect(vi.isMockFunction(repo.createTemplate)).toBe(true);
    expect(vi.isMockFunction(repo.templateExists)).toBe(true);
    expect(vi.isMockFunction(repo.deleteTemplate)).toBe(true);
  });

  it('should properly mock AssetRepository', () => {
    const repo = new AssetRepository();
    expect(vi.isMockFunction(repo.listAssets)).toBe(true);
    expect(vi.isMockFunction(repo.getAssetById)).toBe(true);
    expect(vi.isMockFunction(repo.createAsset)).toBe(true);
    expect(vi.isMockFunction(repo.updateAsset)).toBe(true);
    expect(vi.isMockFunction(repo.deleteAsset)).toBe(true);
    expect(vi.isMockFunction(repo.assetExists)).toBe(true);
  });

  it('should properly mock other repositories', () => {
    const scenarioRepo = new ScenarioRepository();
    const themeRepo = new ThemeRepository();
    const cardRepo = new CardRepository();
    const matrixRepo = new MatrixRepository();
    
    // Verify a few methods to make sure these are also mocked
    expect(vi.isMockFunction(themeRepo.getThemeById)).toBe(true);
    expect(vi.isMockFunction(cardRepo.listCards)).toBe(true);
  });
});
