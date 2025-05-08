/**
 * Test to verify that Jest automatic mocking is properly configured
 * 
 * This test ensures that when code imports from '@/lib/repositories',
 * Jest correctly substitutes our manual mocks from __mocks__/lib/repositories.
 * This protects against future moduleNameMapper drift that could cause tests to use
 * real implementations unexpectedly.
 */

import { describe, it, expect } from '@jest/globals';
import { 
  ThemeTemplateRepository,
  AssetRepository,
  ScenarioRepository,
  ThemeRepository,
  CardRepository,
  MatrixRepository
} from '@/lib/repositories';

describe('Jest Repository Mocking', () => {
  it('should properly mock ThemeTemplateRepository', () => {
    const repo = new ThemeTemplateRepository();
    expect(jest.isMockFunction(repo.listTemplates)).toBe(true);
    expect(jest.isMockFunction(repo.getTemplateById)).toBe(true);
    expect(jest.isMockFunction(repo.createTemplate)).toBe(true);
    expect(jest.isMockFunction(repo.templateExists)).toBe(true);
    expect(jest.isMockFunction(repo.deleteTemplate)).toBe(true);
  });

  it('should properly mock AssetRepository', () => {
    const repo = new AssetRepository();
    expect(jest.isMockFunction(repo.listAssets)).toBe(true);
    expect(jest.isMockFunction(repo.getAssetById)).toBe(true);
    expect(jest.isMockFunction(repo.createAsset)).toBe(true);
    expect(jest.isMockFunction(repo.updateAsset)).toBe(true);
    expect(jest.isMockFunction(repo.deleteAsset)).toBe(true);
    expect(jest.isMockFunction(repo.assetExists)).toBe(true);
  });

  it('should properly mock other repositories', () => {
    const scenarioRepo = new ScenarioRepository();
    const themeRepo = new ThemeRepository();
    const cardRepo = new CardRepository();
    const matrixRepo = new MatrixRepository();
    
    // Verify a few methods to make sure these are also mocked
    expect(jest.isMockFunction(themeRepo.getThemeById)).toBe(true);
    expect(jest.isMockFunction(cardRepo.listCards)).toBe(true);
  });
});
