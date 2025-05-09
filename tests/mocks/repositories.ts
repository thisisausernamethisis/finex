import { jest } from '@jest/globals';

// Mock template data for testing
const mockTemplates = [
  {
    id: 'mock-theme-template-1',
    name: 'Financial Analysis',
    description: 'Template for financial analysis',
    ownerId: 'user_test123',
    isPublic: true,
    createdAt: new Date('2025-04-01'),
    updatedAt: new Date('2025-04-01')
  },
  {
    id: 'mock-theme-template-2',
    name: 'Risk Assessment',
    description: 'Template for risk assessment',
    ownerId: 'different_user',
    isPublic: true,
    createdAt: new Date('2025-04-02'),
    updatedAt: new Date('2025-04-02')
  },
  {
    id: 'mock-theme-template-3',
    name: 'Solar Energy Investment',
    description: 'Template for solar energy investments',
    ownerId: 'different_user',
    isPublic: true,
    createdAt: new Date('2025-04-03'),
    updatedAt: new Date('2025-04-03')
  },
  {
    id: 'mock-theme-template-4',
    name: 'Private Template',
    description: 'This is private',
    ownerId: 'user_test123',
    isPublic: false,
    createdAt: new Date('2025-04-04'),
    updatedAt: new Date('2025-04-04')
  },
  {
    id: 'mock-theme-template-5',
    name: 'No solar here',
    description: 'But it mentions solar energy in the description',
    ownerId: 'different_user',
    isPublic: true,
    createdAt: new Date('2025-04-05'),
    updatedAt: new Date('2025-04-05')
  }
];

// Mock ThemeTemplateRepository class
export class ThemeTemplateRepository {
  public async listTemplates(
    userId: string,
    opts: {
      page?: number;
      limit?: number;
      q?: string;
      mine?: boolean;
      publicOnly?: boolean;
    } = {}
  ) {
    console.log('Mock ThemeTemplateRepository.listTemplates called with:', { userId, opts });
    
    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const skip = (page - 1) * limit;
    
    // Start with all templates
    let filtered = [...mockTemplates];
    
    // Filter by search query (in name OR description)
    if (opts.q) {
      const qLower = opts.q.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(qLower) ||
          (t.description ?? '').toLowerCase().includes(qLower)
      );
    }
    
    // Filter by ownership (mine parameter)
    if (opts.mine) {
      filtered = filtered.filter(t => t.ownerId === userId);
    }
    
    // Filter by visibility (either public or owned by user)
    else if (opts.publicOnly) {
      filtered = filtered.filter(t => t.isPublic || t.ownerId === userId);
    } else {
      // Default behavior - show public templates plus user's own templates
      filtered = filtered.filter(t => t.isPublic || t.ownerId === userId);
    }
    
    // Calculate if there are more items
    const total = filtered.length;
    
    // Apply pagination
    const paginatedItems = filtered.slice(skip, skip + limit);
    const hasMore = skip + paginatedItems.length < total;
    
    return {
      items: paginatedItems,
      total,
      hasMore
    };
  }
  
  public async getTemplateById(id: string) {
    console.log('Mock ThemeTemplateRepository.getTemplateById called with:', { id });
    return mockTemplates.find(t => t.id === id) || null;
  }
  
  public async createTemplate(
    userId: string,
    data: {
      name: string;
      description?: string;
      themeId: string;
      isPublic?: boolean;
    }
  ) {
    console.log('Mock ThemeTemplateRepository.createTemplate called with:', { userId, data });
    
    const newTemplate = {
      id: `template-${Date.now()}`,
      ownerId: userId,
      name: data.name,
      description: data.description ?? '',  // Default to empty string to avoid undefined
      isPublic: data.isPublic ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockTemplates.push(newTemplate);
    return newTemplate;
  }
  
  public async deleteTemplate(id: string) {
    console.log('Mock ThemeTemplateRepository.deleteTemplate called with:', { id });
    const index = mockTemplates.findIndex(t => t.id === id);
    if (index !== -1) {
      mockTemplates.splice(index, 1);
      return true;
    }
    return false;
  }
  
  public async templateExists(id: string) {
    return mockTemplates.some(t => t.id === id);
  }
}

// Export other mock repositories as needed
export class ThemeRepository {
  public async getThemeById(id: string) {
    return {
      id,
      name: 'Mock Theme',
      description: 'This is a mock theme',
      themeType: 'STANDARD'
    };
  }
}

export class CardRepository {
  public async listCards(themeId: string) {
    return {
      items: [
        {
          title: 'Mock Card',
          content: 'This is a mock card',
          importance: 3,
          source: 'Mock Source'
        }
      ]
    };
  }
}
