import { prisma } from "../db";
import { logger } from '../logger';
import { JobEvent } from '../events/eventEmitter';

// Define AccessRole enum to match Prisma schema
export enum AccessRole {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN'
}

// Create a service-specific logger
const accessLogger = logger.child({ service: 'AccessControlService' });

// Role hierarchy for permission checks
const roleHierarchy: Record<AccessRole, number> = {
  [AccessRole.ADMIN]: 3,
  [AccessRole.EDITOR]: 2,
  [AccessRole.VIEWER]: 1
};

/**
 * Checks if a user has the required access level for an asset
 * 
 * @param userId The ID of the user requesting access
 * @param assetId The ID of the asset to check access for
 * @param required The minimum required access role
 * @returns Promise resolving to a boolean indicating if the user has sufficient access
 */
export async function hasAssetAccess(
  userId: string, 
  assetId: string, 
  required: AccessRole
): Promise<boolean> {
  accessLogger.debug('Checking asset access', { userId, assetId, required });
  
  // Get the asset to check if the user is the owner
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { userId: true, isPublic: true }
  });
  
  if (!asset) {
    accessLogger.debug('Asset not found', { assetId });
    return false;
  }
  
  // Asset owner has full access
  if (asset.userId === userId) {
    accessLogger.debug('User is asset owner, access granted', { userId, assetId });
    return true;
  }
  
  // For public assets, anyone has VIEWER access
  if (asset.isPublic && required === AccessRole.VIEWER) {
    accessLogger.debug('Asset is public, VIEWER access granted', { userId, assetId });
    return true;
  }
  
  // Check explicit access grants
  const access = await prisma.assetAccess.findUnique({
    where: {
      assetId_userId: {
        assetId,
        userId
      }
    }
  });
  
  if (!access) {
    accessLogger.debug('No explicit access found', { userId, assetId });
    return false;
  }
  
  // Check if granted role is sufficient
  const hasAccess = roleHierarchy[access.role as AccessRole] >= roleHierarchy[required];
  accessLogger.debug('Explicit access check result', { 
    userId, 
    assetId, 
    required,
    granted: access.role,
    hasAccess
  });
  
  return hasAccess;
}

/**
 * Checks if a user has the required access level for a scenario
 * 
 * @param userId The ID of the user requesting access
 * @param scenarioId The ID of the scenario to check access for
 * @param required The minimum required access role
 * @returns Promise resolving to a boolean indicating if the user has sufficient access
 */
export async function hasScenarioAccess(
  userId: string, 
  scenarioId: string, 
  required: AccessRole
): Promise<boolean> {
  accessLogger.debug('Checking scenario access', { userId, scenarioId, required });
  
  // Get the scenario to check attributes
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    include: {
      // In a future version, this might include ScenarioAccess similar to AssetAccess
      // Currently using a simpler model where scenarios are globally accessible
    }
  });
  
  if (!scenario) {
    accessLogger.debug('Scenario not found', { scenarioId });
    return false;
  }
  
  // For now, all users have VIEWER access to all scenarios
  // This is a simplified access model that can be expanded later
  if (required === AccessRole.VIEWER) {
    return true;
  }
  
  // For EDITOR and ADMIN roles, only system admins have access for now
  // This would be replaced with proper scenario ownership/sharing in a future version
  const isAdmin = await checkUserIsAdmin(userId);
  accessLogger.debug('Admin check for scenario access', { 
    userId, 
    scenarioId, 
    required,
    isAdmin
  });
  
  return isAdmin;
}

/**
 * Checks if a user has the required access level for a theme
 * by resolving to its parent asset or scenario and checking access there
 * 
 * @param userId The ID of the user requesting access
 * @param themeId The ID of the theme to check access for
 * @param required The minimum required access role
 * @returns Promise resolving to a boolean indicating if the user has sufficient access
 */
export async function hasThemeAccess(
  userId: string, 
  themeId: string, 
  required: AccessRole
): Promise<boolean> {
  accessLogger.debug('Checking theme access', { userId, themeId, required });
  
  // Get the theme with its parent references
  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
    select: { assetId: true, scenarioId: true }
  });
  
  if (!theme) {
    accessLogger.debug('Theme not found', { themeId });
    return false;
  }
  
  // Check access based on parent type (asset or scenario)
  if (theme.assetId) {
    accessLogger.debug('Theme belongs to asset, checking asset access', { 
      themeId, 
      assetId: theme.assetId
    });
    return hasAssetAccess(userId, theme.assetId, required);
  }
  
  if (theme.scenarioId) {
    accessLogger.debug('Theme belongs to scenario, checking scenario access', { 
      themeId, 
      scenarioId: theme.scenarioId
    });
    return hasScenarioAccess(userId, theme.scenarioId, required);
  }
  
  // Theme has neither assetId nor scenarioId (should not happen due to DB constraint)
  accessLogger.warn('Theme has no parent reference', { themeId });
  return false;
}

/**
 * Checks if a user has the required access level for a card
 * by resolving to its parent theme and then to asset/scenario
 * 
 * @param userId The ID of the user requesting access
 * @param cardId The ID of the card to check access for
 * @param required The minimum required access role
 * @returns Promise resolving to a boolean indicating if the user has sufficient access
 */
export async function hasCardAccess(
  userId: string, 
  cardId: string, 
  required: AccessRole
): Promise<boolean> {
  accessLogger.debug('Checking card access', { userId, cardId, required });
  
  // Get the card with its theme reference
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { themeId: true }
  });
  
  if (!card) {
    accessLogger.debug('Card not found', { cardId });
    return false;
  }
  
  // Delegate to theme access check
  accessLogger.debug('Card belongs to theme, checking theme access', { 
    cardId, 
    themeId: card.themeId
  });
  return hasThemeAccess(userId, card.themeId, required);
}

/**
 * Checks if a user has the required access level for both an asset and a scenario
 * Useful for matrix results that link both
 * 
 * @param userId The ID of the user requesting access
 * @param assetId The ID of the asset to check access for
 * @param scenarioId The ID of the scenario to check access for
 * @param required The minimum required access role
 * @returns Promise resolving to a boolean indicating if the user has sufficient access to both
 */
export async function hasMatrixAccess(
  userId: string,
  assetId: string,
  scenarioId: string,
  required: AccessRole
): Promise<boolean> {
  accessLogger.debug('Checking matrix access', { userId, assetId, scenarioId, required });
  
  const [assetAccessResult, scenarioAccessResult] = await Promise.all([
    hasAssetAccess(userId, assetId, required),
    hasScenarioAccess(userId, scenarioId, required)
  ]);
  
  const hasAccess = assetAccessResult && scenarioAccessResult;
  accessLogger.debug('Matrix access check result', { 
    userId, 
    assetId,
    scenarioId,
    hasAccess
  });
  
  return hasAccess;
}

/**
 * Checks if a user has access to see a specific job event
 * This enforces RBAC on the SSE stream to prevent data leakage
 * 
 * @param userId The ID of the user to check access for
 * @param event The job event to check access for
 * @returns Promise resolving to a boolean indicating if the user has access to this event
 */
export async function userHasAccessToEvent(
  userId: string,
  event: JobEvent
): Promise<boolean> {
  // Extract assetId and scenarioId from event data
  const assetId = event.data?.assetId as string | undefined;
  const scenarioId = event.data?.scenarioId as string | undefined;

  accessLogger.debug('Checking event access', { 
    userId, 
    eventType: event.type,
    jobId: event.jobId,
    assetId,
    scenarioId
  });

  // If both assetId and scenarioId are present (matrix events)
  if (assetId && scenarioId) {
    return hasMatrixAccess(userId, assetId, scenarioId, AccessRole.VIEWER);
  }
  
  // If just assetId is present (asset-related events)
  if (assetId) {
    return hasAssetAccess(userId, assetId, AccessRole.VIEWER);
  }
  
  // If just scenarioId is present (scenario-related events)
  if (scenarioId) {
    return hasScenarioAccess(userId, scenarioId, AccessRole.VIEWER);
  }
  
  // For events without resource IDs (system events, connection events)
  // Allow all authenticated users to see these
  return true;
}

/**
 * Temporary helper function to check if a user is an admin
 * In a real implementation, this would check against a proper roles system
 * 
 * @param userId The ID of the user to check
 * @returns Promise resolving to whether the user is an admin
 */
async function checkUserIsAdmin(userId: string): Promise<boolean> {
  // In a real implementation, this would check against a proper roles system
  // For now, we'll use a simple check based on user ID
  // This is just a placeholder - implement proper admin checks in a real system
  return userId.startsWith('admin_');
}
