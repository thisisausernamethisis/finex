import { vi } from 'vitest';
import { paginate, filterTemplates } from '../../shared/mockHelpers';
import { isOwner } from '../../../lib/rbac';

// Templates data for mocking
const templates = [
  {
    id: '1',
    ownerId: 'user1',
    name: 'Supply Chain Analysis',
    description: 'Template for analyzing supply chain risks',
    payload: {},
    isPublic: true,
    createdAt: new Date('2025-02-15'),
    updatedAt: new Date('2025-02-15'),
  },
  {
    id: '2',
    ownerId: 'user2',
    name: 'Market Expansion',
    description: 'Template for market expansion planning',
    payload: {},
    isPublic: true,
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-01'),
  },
  {
    id: '3',
    ownerId: 'user1',
    name: 'New Product Development',
    description: 'Template for product development risk assessment',
    payload: {},
    isPublic: false,
    createdAt: new Date('2025-03-10'),
    updatedAt: new Date('2025-03-10'),
  },
];

export class ThemeTemplateRepository {
  public listTemplates = vi.fn(
    async (opts: {
      page: number;
      limit: number;
      q?: string;          // search term
      mine?: boolean;      // filter current-user
      userId?: string;     // injected by contract tests
    }) => {
      // Ensure userId is always provided to filterTemplates
      const optsWithDefaults = {
        ...opts,
        userId: opts.userId || 'anonymous'
      };
      const filtered = filterTemplates(templates, optsWithDefaults);
      return paginate(filtered, opts.page, opts.limit);
    }
  );
  
  public getTemplateById = vi.fn(async (id: string, ownerId?: string) => {
    const template = templates.find(t => t.id === id);
    
    // Apply RBAC: return null if template not found or user doesn't have access
    if (!template) return null;
    if (ownerId && !template.isPublic && !isOwner(ownerId, template)) return null;
    
    return template;
  });
  
  public createTemplate = vi.fn();
  public templateExists = vi.fn();
  public deleteTemplate = vi.fn();
  public cloneTemplate = vi.fn();
}

// Mock implementation of other repositories as needed
export class AssetRepository {
  public listAssets = vi.fn();
  
  public getAssetById = vi.fn(async (id: string, ownerId?: string) => {
    // Mock asset data that might be returned
    const asset = {
      id,
      ownerId: 'user1', // Default owner
      name: 'Mock Asset',
      description: 'Mock asset for testing',
      isPublic: false, // Default to private
    };
    
    // Apply RBAC: return null if user doesn't have access
    if (ownerId && !asset.isPublic && !isOwner(ownerId, asset)) return null;
    
    return asset;
  });
  
  public createAsset = vi.fn();
  public updateAsset = vi.fn();
  public deleteAsset = vi.fn();
  public cloneAsset = vi.fn();
  public assetExists = vi.fn(async () => true); // Default to true for most tests
}

export const CardRepository = vi.fn().mockImplementation(() => {
  return {
    listCards: vi.fn(),
    getCardById: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
  };
});

export const ScenarioRepository = vi.fn().mockImplementation(() => {
  return {
    listScenarios: vi.fn(),
    getScenarioById: vi.fn(),
    createScenario: vi.fn(),
    updateScenario: vi.fn(),
    deleteScenario: vi.fn(),
  };
});

export const MatrixRepository = vi.fn().mockImplementation(() => {
  return {
    listMatrixResults: vi.fn(),
    getMatrixResult: vi.fn(),
    queueMatrixAnalysis: vi.fn(),
    matrixResultExists: vi.fn(),
  };
});

export const ThemeRepository = vi.fn().mockImplementation(() => {
  return {
    listThemes: vi.fn(),
    getThemeById: vi.fn(),
    createTheme: vi.fn(),
    updateTheme: vi.fn(),
    deleteTheme: vi.fn(),
  };
});
