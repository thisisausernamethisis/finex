import { prisma } from "../db";

/**
 * Updates the growth value of an asset based on its growth theme
 * 
 * @param assetId The ID of the asset to update
 * @returns Promise resolving when the update is complete
 */
export async function updateAssetGrowthValue(assetId: string): Promise<void> {
  // Find the growth theme for this asset
  const growthTheme = await prisma.theme.findFirst({
    where: {
      assetId,
      themeType: 'GROWTH'
    }
  });
  
  if (!growthTheme) {
    return;
  }
  
  // Determine which value to use
  const growthValue = growthTheme.useManualValue && growthTheme.manualValue !== null 
    ? growthTheme.manualValue 
    : growthTheme.calculatedValue;
    
  if (growthValue === null) {
    return;
  }
  
  // Update the asset with the growth value
  await prisma.asset.update({
    where: { id: assetId },
    data: { growthValue }
  });
}
