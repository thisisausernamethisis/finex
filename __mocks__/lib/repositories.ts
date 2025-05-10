import { vi } from 'vitest';
import crypto from 'crypto';

// Define ThemeTemplate type if not imported from elsewhere
type ThemeTemplate = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  isPublic: boolean;
  payload: any;
  createdAt: Date;
  updatedAt: Date;
};

const PAGE_SIZE = 10;
// Template store for easier reference in the user instructions
const templateStore: ThemeTemplate[] = [
  {
    id: 'tpl_pub_1',
    ownerId: 'user_test123',
    name: 'Public template A',
    description: 'Demo',
    isPublic: true,
    payload: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tpl_priv_1',
    ownerId: 'user_other456',
    name: 'Private template B',
    description: 'Demo',
    isPublic: false,
    payload: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

function paginate<T>(items: T[], page = 1, pageSize = PAGE_SIZE) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const slice = items.slice(start, end);
  return { items: slice, total: items.length, hasMore: end < items.length };
}

function rawListTemplates(
  { page = 1, pageSize = 10, mine = false, q = '', ownerId = undefined } = {}
) {
  let items = [...templateStore];
  if (ownerId) items = items.filter(t => t.ownerId === ownerId);
  if (q) items = items.filter(t =>
    t.name.includes(q) || (t.description ?? '').includes(q));

  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);

  return {
    items: slice,
    total: items.length,
    hasMore: start + pageSize < items.length
  };
}

export class ThemeTemplateRepository {
  listTemplates(userIdOrOpts: any, opts?: any) {
    if (typeof userIdOrOpts === 'string') {
      return rawListTemplates({ ownerId: opts?.mine ? userIdOrOpts : undefined, ...opts });
    }
    return rawListTemplates(userIdOrOpts ?? {});
  }

  createTemplate = vi.fn(async (userId: string, data: { name: string; description?: string; themeId: string; isPublic?: boolean }) => {
    const { name, description = '', themeId, isPublic = false } = data;
    
    // Create a mock payload based on themeId
    const payload = {
      theme: {
        name: `Theme from ${themeId}`,
        description: 'Auto-generated theme for mock',
        category: 'mock',
        themeType: 'standard'
      },
      cards: [
        {
          title: 'Sample Card 1',
          content: 'This is sample content',
          importance: 'high',
          source: 'mock'
        }
      ]
    };
    const tpl: ThemeTemplate = {
      id: crypto.randomUUID(),
      ownerId: userId,
      name,
      description,
      payload,
      isPublic,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    templateStore.push(tpl);
    return tpl;
  });

  getTemplateById = vi.fn(async (id: string) => templateStore.find(t => t.id === id) ?? null);

  updateTemplate = vi.fn(async (id: string, data: Partial<Omit<ThemeTemplate, 'id'>>) => {
    const idx = templateStore.findIndex(t => t.id === id);
    if (idx === -1) return null;
    templateStore[idx] = { ...templateStore[idx], ...data, updatedAt: new Date() };
    return templateStore[idx];
  });

  deleteTemplate = vi.fn(async (id: string) => {
    const idx = templateStore.findIndex(t => t.id === id);
    if (idx === -1) return false;
    templateStore.splice(idx, 1);
    return true;
  });

  // Add missing methods
  templateExists = vi.fn(async (id: string) => {
    return templateStore.some(t => t.id === id);
  });

  cloneTemplate = vi.fn(async (templateId: string, userId: string, options: { name?: string; isPublic?: boolean } = {}) => {
    const template = templateStore.find(t => t.id === templateId);
    if (!template) return null;

    const newTemplate: ThemeTemplate = {
      id: crypto.randomUUID(),
      ownerId: userId,
      name: options.name || `Copy of ${template.name}`,
      description: template.description,
      payload: JSON.parse(JSON.stringify(template.payload)), // Deep copy
      isPublic: options.isPublic !== undefined ? options.isPublic : false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    templateStore.push(newTemplate);
    return newTemplate;
  });
}

export const CardRepository = vi.fn();      // keep stubs for other tests
export const AssetRepository = vi.fn();
export const ScenarioRepository = vi.fn();  // Add other repositories
export const ThemeRepository = vi.fn();
