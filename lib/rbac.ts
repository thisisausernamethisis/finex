/**
 * RBAC (Role-Based Access Control) helpers for Finex
 * Provides consistent access control across route handlers and repositories
 */

/**
 * Checks if a user has access to an asset
 * @param userId The ID of the user attempting to access the asset
 * @param asset The asset or asset-like object with ownerId and isPublic properties
 * @returns true if the user has access (is owner or asset is public), false otherwise
 */
export async function hasAssetAccess(
  userId: string,
  asset: { ownerId: string; isPublic: boolean }
): Promise<boolean> {
  return asset.isPublic || asset.ownerId === userId;
}

/**
 * Checks if a user has access to a template
 * @param userId The ID of the user attempting to access the template
 * @param template The template or template-like object with ownerId and isPublic properties
 * @returns true if the user has access (is owner or template is public), false otherwise
 */
export async function hasTemplateAccess(
  userId: string,
  template: { ownerId: string; isPublic: boolean }
): Promise<boolean> {
  return template.isPublic || template.ownerId === userId;
}

/**
 * Generic helper to check ownership of any resource
 * @param userId The ID of the user to check
 * @param resource The resource with an ownerId property
 * @returns true if the user is the owner of the resource, false otherwise
 */
export function isOwner(userId: string, resource: { ownerId: string }): boolean {
  return resource.ownerId === userId;
}
