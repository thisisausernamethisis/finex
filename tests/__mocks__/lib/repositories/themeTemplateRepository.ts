import { prisma } from '../../../mocks/prisma';
import { Paginated, ThemeTemplateDTO } from '../../../seed/types';

// Define the constant for re-export
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Mock implementation of ThemeTemplateRepository
 * 
 * Vitest uses alias in vitest.config.ts; Jest relies on __mocks__ directory
 */
export class ThemeTemplateRepository {
  /**
   * Lists templates with proper pagination and visibility filtering
   */
  async listTemplates(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      q?: string;
      mine?: boolean;
      publicOnly?: boolean;
    } = {}
  ): Promise<Paginated<ThemeTemplateDTO>> {
    // Set defaults and validate options
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, 50);
    const skip = (page - 1) * limit;

    // Get all templates from the mock DB
    const allTemplates = await prisma.themeTemplate.findMany();

    // Ensure consistent property mapping for all templates
    const mappedTemplates = allTemplates.map(template => ({
      ...template,
      /** TODO: remove once FE no longer expects `userId` on ThemeTemplate */
      userId: template.ownerId
    }));

    // Apply filtering based on options
    let filteredTemplates = [...mappedTemplates];

    // Apply search filter if provided
    if (options.q && options.q.trim()) {
      const searchTerm = options.q.trim().toLowerCase();

      // Search by name or description (case insensitive)
      filteredTemplates = filteredTemplates.filter(
        t =>
          t.name.toLowerCase().includes(searchTerm) ||
          (t.description ?? '').toLowerCase().includes(searchTerm)
      );
    }

    // Filter by ownership (mine) or visibility (isPublic)
    if (options.mine === true) {
      // Only show templates owned by the current user
      filteredTemplates = filteredTemplates.filter(
        t => t.ownerId === userId
      );
    } else {
      // Show public templates plus user's own templates
      filteredTemplates = filteredTemplates.filter(template => {
        const isOwned = String(template.ownerId) === String(userId);
        const isPublic = template.isPublic === true;
        return isOwned || isPublic;
      });
    }

    // Apply pagination
    const items = filteredTemplates.slice(skip, skip + limit);

    // Return paginated result with required metadata
    return {
      items: items || [],
      total: filteredTemplates.length,
      hasMore: filteredTemplates.length > skip + limit
    };
  }

  /**
   * Gets a template by ID
   */
  async getTemplateById(id: string): Promise<ThemeTemplateDTO | null> {
    return prisma.themeTemplate.findUnique({
      where: { id }
    });
  }

  /**
   * Creates a new theme template
   */
  async createTemplate(
    userId: string,
    data: { name: string; description?: string; themeId: string; isPublic?: boolean }
  ): Promise<ThemeTemplateDTO> {
    // Simple mock payload
    const payload = {
      theme: {
        name: data.name,
        description: data.description,
        category: "Default",
        themeType: "STANDARD"
      },
      cards: [
        {
          title: "Sample Card",
          content: "Sample content for the template",
          importance: 1
        }
      ]
    };

    // Create the template in the mock db
    const template = await prisma.themeTemplate.create({
      data: {
        id: `template-${Math.random().toString(36).substring(2, 10)}`,
        ownerId: userId,
        name: data.name,
        description: data.description,
        payload,
        isPublic: !!data.isPublic,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Add userId field for API compatibility
    return {
      ...template,
      /** TODO: remove once FE no longer expects `userId` on ThemeTemplate */
      userId: template.ownerId
    };
  }

  /**
   * Checks if a template exists
   */
  async templateExists(id: string): Promise<boolean> {
    const count = await prisma.themeTemplate.count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * Deletes a template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      await prisma.themeTemplate.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
