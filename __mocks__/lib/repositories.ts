import { vi } from 'vitest';

// --- dummy data helpers ----------
export const fakeTemplates = [
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

// --- function exports ------------------------------------
export function listTemplates(
  opts: {
    page: number;
    limit: number;
    userId: string;
    q?: string | null;
    mine?: boolean;
  }
) {
  // Mark templates owned by current user
  const templatesWithOwnership = fakeTemplates.map(t => ({
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

// --- class mocks -----------------------------------------
export class ThemeTemplateRepository {
  public listTemplates = vi.fn();
  public getTemplateById = vi.fn();
  public createTemplate = vi.fn();
  public templateExists = vi.fn();
  public deleteTemplate = vi.fn();
  public cloneTemplate = vi.fn();
}

export class AssetRepository {
  public listAssets = vi.fn();
  public getAssetById = vi.fn();
  public createAsset = vi.fn();
  public updateAsset = vi.fn();
  public deleteAsset = vi.fn();
  public assetExists = vi.fn();
  public cloneAsset = vi.fn();
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
