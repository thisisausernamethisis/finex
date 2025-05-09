import { ThemeTemplate } from '@prisma/client';

// Mock implementation of listTemplates similar to actual repository
export function listTemplates(
  opts: {
    page: number;
    limit: number;
    userId: string;
    q?: string | null;
    mine?: boolean;
  }
) {
  // Simulate database of templates
  const allTemplates: (ThemeTemplate & { isCurrentUserOwner: boolean })[] = [
    {
      id: '1',
      ownerId: 'user1',
      name: 'Supply Chain Analysis',
      description: 'Template for analyzing supply chain risks',
      payload: {},
      isPublic: true,
      isCurrentUserOwner: false,
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
      isCurrentUserOwner: false,
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
      isCurrentUserOwner: false,
      createdAt: new Date('2025-03-10'),
      updatedAt: new Date('2025-03-10'),
    },
  ];

  // Mark templates owned by current user
  const templatesWithOwnership = allTemplates.map(t => ({
    ...t,
    isCurrentUserOwner: t.ownerId === opts.userId,
  }));

  // Apply filters
  let filtered = [...templatesWithOwnership];

  // Filter by search query
  if (opts.q) {
    const qLower = opts.q.toLowerCase();
    filtered = filtered.filter(
      t =>
        t.name.toLowerCase().includes(qLower) ||
        (t.description ?? '').toLowerCase().includes(qLower)
    );
  }

  // Filter by ownership
  if (opts.mine) {
    filtered = filtered.filter(t => t.ownerId === opts.userId);
  }

  // Apply pagination
  const paginatedItems = filtered.slice(
    (opts.page - 1) * opts.limit,
    opts.page * opts.limit
  );

  return {
    items: paginatedItems,
    total: filtered.length,
    page: opts.page,
    limit: opts.limit,
    totalPages: Math.ceil(filtered.length / opts.limit),
  };
}

// Mock implementation of the themeTemplateRepository
export class ThemeTemplateRepository {
  public listTemplates    = jest.fn();
  public getTemplateById  = jest.fn();
  public createTemplate   = jest.fn();
  public templateExists   = jest.fn();
  public deleteTemplate   = jest.fn();
  public cloneTemplate    = jest.fn();
}

// Mock implementation of other repositories as needed
export class AssetRepository {
  public listAssets   = jest.fn();
  public getAssetById = jest.fn();
  public createAsset  = jest.fn();
  public updateAsset  = jest.fn();
  public deleteAsset  = jest.fn();
  public cloneAsset   = jest.fn();
}

export const CardRepository = jest.fn().mockImplementation(() => {
  return {
    listCards: jest.fn(),
    getCardById: jest.fn(),
    createCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
  };
});

export const ScenarioRepository = jest.fn().mockImplementation(() => {
  return {
    listScenarios: jest.fn(),
    getScenarioById: jest.fn(),
    createScenario: jest.fn(),
    updateScenario: jest.fn(),
    deleteScenario: jest.fn(),
  };
});

export const MatrixRepository = jest.fn().mockImplementation(() => {
  return {
    listMatrixResults: jest.fn(),
    getMatrixResult: jest.fn(),
    queueMatrixAnalysis: jest.fn(),
    matrixResultExists: jest.fn(),
  };
});

export const ThemeRepository = jest.fn().mockImplementation(() => {
  return {
    listThemes: jest.fn(),
    getThemeById: jest.fn(),
    createTheme: jest.fn(),
    updateTheme: jest.fn(),
    deleteTheme: jest.fn(),
  };
});
