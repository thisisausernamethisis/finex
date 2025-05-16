/**
 * Mock implementation of all repositories 
 * Provides mock functions that will be recognized by jest.isMockFunction
 */
import { vi } from 'vitest';

// Mock ThemeTemplateRepository class
export class ThemeTemplateRepository {
  listTemplates = vi.fn().mockResolvedValue({ items: [], total: 0, hasMore: false });
  getTemplateById = vi.fn().mockResolvedValue(null);
  createTemplate = vi.fn().mockImplementation((userId, data) => {
    return Promise.resolve({
      id: `mock-template-${Math.random().toString(36).substring(7)}`,
      ownerId: userId,
      name: data.name,
      description: data.description || '',
      isPublic: data.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  deleteTemplate = vi.fn().mockResolvedValue(true);
  templateExists = vi.fn().mockResolvedValue(true);
  
  // Legacy method names for compatibility
  list = vi.fn().mockImplementation((userId, opts) => {
    return this.listTemplates(userId, opts);
  });
  find = vi.fn().mockImplementation((id) => {
    return this.getTemplateById(id);
  });
  create = vi.fn().mockImplementation((userId, data) => {
    return this.createTemplate(userId, data);
  });
}

// Mock AssetRepository class with vi.fn() methods
export class AssetRepository {
  listAssets = vi.fn().mockResolvedValue({ items: [], total: 0, hasMore: false });
  getAssetById = vi.fn().mockResolvedValue(null);
  createAsset = vi.fn().mockResolvedValue({ id: 'mock-asset-1' });
  updateAsset = vi.fn().mockResolvedValue(null);
  deleteAsset = vi.fn().mockResolvedValue(true);
  assetExists = vi.fn().mockResolvedValue(true);
}

// Mock CardRepository class with vi.fn() methods  
export class CardRepository {
  listCards = vi.fn().mockResolvedValue({ items: [], total: 0 });
  getCardById = vi.fn().mockResolvedValue(null);
  createCard = vi.fn().mockResolvedValue({ id: 'mock-card-1' });
  updateCard = vi.fn().mockResolvedValue(null);
  deleteCard = vi.fn().mockResolvedValue(true);
  cardExists = vi.fn().mockResolvedValue(true);
  createChunks = vi.fn().mockResolvedValue([]);
}

// Mock MatrixRepository class with vi.fn() methods
export class MatrixRepository {
  listMatrixResults = vi.fn().mockResolvedValue({ items: [], total: 0 });
  getMatrixResult = vi.fn().mockResolvedValue(null);
  queueMatrixAnalysis = vi.fn().mockResolvedValue({ jobId: 'mock-job-1', status: 'pending' });
  matrixResultExists = vi.fn().mockResolvedValue(true);
}

// Mock ScenarioRepository class with vi.fn() methods
export class ScenarioRepository {
  listScenarios = vi.fn().mockResolvedValue({ items: [], total: 0 });
  getScenarioById = vi.fn().mockResolvedValue(null);
  createScenario = vi.fn().mockResolvedValue({ id: 'mock-scenario-1' });
  updateScenario = vi.fn().mockResolvedValue(null);
  deleteScenario = vi.fn().mockResolvedValue(true);
  scenarioExists = vi.fn().mockResolvedValue(true);
}

// Mock ThemeRepository class with vi.fn() methods
export class ThemeRepository {
  listThemes = vi.fn().mockResolvedValue({ items: [], total: 0 });
  getThemeById = vi.fn().mockResolvedValue(null);
  createTheme = vi.fn().mockResolvedValue({ id: 'mock-theme-1' });
  updateTheme = vi.fn().mockResolvedValue(null);
  updateThemeCalculatedValue = vi.fn().mockResolvedValue(null);
  deleteTheme = vi.fn().mockResolvedValue(true);
  themeExists = vi.fn().mockResolvedValue(true);
  getThemesForAsset = vi.fn().mockResolvedValue([]);
  getThemesForScenario = vi.fn().mockResolvedValue([]);
}

// Create repository instances
export const themeTemplateRepository = new ThemeTemplateRepository();
export const assetRepository = new AssetRepository();
export const cardRepository = new CardRepository();
export const matrixRepository = new MatrixRepository();
export const scenarioRepository = new ScenarioRepository();
export const themeRepository = new ThemeRepository();

// Export the full repositories object with all repository instances
export default {
  ThemeTemplateRepository,
  AssetRepository,
  CardRepository,
  MatrixRepository,
  ScenarioRepository,
  ThemeRepository,
  themeTemplateRepository,
  assetRepository,
  cardRepository,
  matrixRepository,
  scenarioRepository,
  themeRepository
};

// Export constants
export const DEFAULT_PAGE_SIZE = 20;
