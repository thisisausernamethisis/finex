import { prisma } from "../db";
import { logger } from '../logger';
import { AccessRole, hasAssetAccess } from "./accessControlService";
import { ThemeRepository } from '../repositories/themeRepository';
import { ThemeTemplateRepository } from '../repositories/themeTemplateRepository';
import { ThemeTemplate } from "@prisma/client";

// Create a service-specific logger
const serviceLogger = logger.child({ service: 'TemplateService' });

/**
 * Check if a user has access to a template
 * 
 * @param userId The ID of the user requesting access
 * @param templateId The ID of the template to check access for
 * @param role The minimum required access role
 * @returns Promise resolving to a boolean indicating if the user has sufficient access
 */
export async function hasTemplateAccess(
  userId: string, 
  templateId: string, 
  role: AccessRole
): Promise<boolean> {
  serviceLogger.debug('Checking template access', { userId, templateId, role });
  
  // Get the template
  const template = await prisma.themeTemplate.findUnique({
    where: { id: templateId },
    select: { ownerId: true, isPublic: true }
  });
  
  if (!template) {
    serviceLogger.debug('Template not found', { templateId });
    return false;
  }
  
  // Template owner has full access
  if (template.ownerId === userId) {
    serviceLogger.debug('User is template owner, access granted', { userId, templateId });
    return true;
  }
  
  // For public templates, anyone has VIEWER access
  if (template.isPublic && role === AccessRole.VIEWER) {
    serviceLogger.debug('Template is public, VIEWER access granted', { userId, templateId });
    return true;
  }
  
  // For any other case, deny access
  serviceLogger.debug('Access denied', { userId, templateId, role });
  return false;
}

/**
 * Clone an asset from template
 * 
 * @param templateId The ID of the template asset to clone
 * @param userId The ID of the user who will own the clone
 * @returns The ID of the newly created asset
 */
export async function cloneAssetFromTemplate(
  templateId: string,
  userId: string
): Promise<string> {
  serviceLogger.debug('Cloning asset from template', { templateId, userId });
  
  // Check if template exists and is of kind TEMPLATE
  const template = await prisma.asset.findUnique({
    where: { 
      id: templateId,
      kind: 'TEMPLATE'
    },
    include: {
      themes: {
        include: {
          cards: true
        }
      }
    }
  });
  
  if (!template) {
    throw new Error(`Asset with ID ${templateId} is not a template`);
  }
  
  // Check access - owner, public, or shares
  if (template.userId !== userId && !template.isPublic) {
    // Check if user has access through sharing
    const hasAccess = await hasAssetAccess(userId, templateId, AccessRole.VIEWER);
    if (!hasAccess) {
      throw new Error('No access to template');
    }
  }
  
  // Create new asset with deep copy of themes and cards
  const newAsset = await prisma.asset.create({
    data: {
      name: `${template.name} (Copy)`,
      description: template.description,
      user: { connect: { id: userId } },
      kind: 'REGULAR',
      sourceTemplateId: template.id,
      isPublic: false,
      // Clone themes and their cards
      themes: {
        create: template.themes.map((theme: any) => ({
          name: theme.name,
          description: theme.description,
          category: theme.category,
          themeType: theme.themeType,
          manualValue: theme.manualValue,
          useManualValue: theme.useManualValue,
          // Clone cards for each theme
          cards: {
            create: theme.cards.map((card: any) => ({
              title: card.title,
              content: card.content,
              importance: card.importance,
              source: card.source
              // Note: Chunks are not copied here as they would need reprocessing
            }))
          }
        }))
      }
    },
    select: { id: true }
  });
  
  return newAsset.id;
}

/**
 * Clone a theme template into an asset
 * 
 * @param templateId The ID of the theme template to clone
 * @param assetId The ID of the asset to add the cloned theme to
 * @param userId The ID of the user performing the clone
 * @returns The ID of the newly created theme
 */
export async function cloneThemeTemplate(
  templateId: string, 
  assetId: string, 
  userId: string
): Promise<string> {
  serviceLogger.debug('Cloning theme template', { templateId, assetId, userId });
  
  const themeRepo = new ThemeRepository();
  
  // Check template access first
  const hasAccess = await hasTemplateAccess(userId, templateId, AccessRole.VIEWER);
  if (!hasAccess) {
    throw new Error('No access to template');
  }
  
  // Get the template payload
  const template = await prisma.themeTemplate.findUnique({
    where: { id: templateId },
    select: { payload: true }
  });
  
  if (!template || !template.payload) {
    throw new Error('Template payload is missing');
  }
  
  // Extract theme and cards from payload
  const themeData = (template.payload as any).theme;
  const cardsData = (template.payload as any).cards || [];
  
  // Create theme
  const theme = await themeRepo.createTheme({
    name: themeData.name,
    description: themeData.description,
    category: themeData.category,
    themeType: themeData.themeType,
    assetId: assetId
  });
  
  // Create cards for the theme
  for (const cardData of cardsData as any[]) {
    await prisma.card.create({
      data: {
        title: cardData.title,
        content: cardData.content,
        importance: cardData.importance,
        source: cardData.source,
        themeId: theme.id
      }
    });
  }
  
  return theme.id;
}

/**
 * Toggle the visibility (public/private) of a theme template
 * 
 * @param templateId The ID of the theme template
 * @param userId The ID of the user attempting to toggle visibility
 * @param isPublic The new visibility state
 * @returns The updated theme template
 * @throws Error if the user is not the owner or the template doesn't exist
 */
export async function toggleVisibility(
  templateId: string,
  userId: string,
  isPublic: boolean
): Promise<ThemeTemplate> {
  serviceLogger.debug('Toggling template visibility', { templateId, userId, isPublic });
  
  // Get the template
  const template = await prisma.themeTemplate.findUnique({
    where: { id: templateId }
  });
  
  if (!template) {
    const error = new Error(`Template with ID ${templateId} not found`);
    serviceLogger.error('Template not found', { error, templateId });
    throw error;
  }
  
  // Verify ownership
  if (template.ownerId !== userId) {
    const error = new Error('Only the template owner can toggle visibility');
    serviceLogger.error('Unauthorized visibility toggle attempt', { error, templateId, userId });
    throw error;
  }
  
  // Toggle visibility
  const updatedTemplate = await prisma.themeTemplate.update({
    where: { id: templateId },
    data: { isPublic }
  });
  
  serviceLogger.info('Template visibility toggled', { 
    templateId, 
    userId, 
    isPublic, 
    result: `Template is now ${isPublic ? 'public' : 'private'}`
  });
  
  return updatedTemplate;
}
