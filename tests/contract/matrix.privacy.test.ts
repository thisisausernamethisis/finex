import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { executeRouteHandler, parseResponseJson } from '../_setup/contractTestUtils';
import { GET } from '../../app/api/matrix/[assetId]/[scenarioId]/route';

describe('Matrix API Privacy', () => {
  const prisma = new PrismaClient();

  it('should not include reasoning_steps in the matrix response', async () => {
    // Get a valid asset ID from the database
    const asset = await prisma.asset.findFirst();
    expect(asset).not.toBeNull();
    
    // Get a valid scenario ID from the database
    const scenario = await prisma.scenario.findFirst();
    expect(scenario).not.toBeNull();

    // Use executeRouteHandler to call the API with authentication
    const response = await executeRouteHandler(
      GET,
      'GET', 
      `/api/matrix/${asset?.id}/${scenario?.id}`,
      { assetId: asset?.id || '', scenarioId: scenario?.id || '' }
    );
    
    // Verify the response is successful
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    
    // Parse the response body
    const body = await response.json();
    
    // Test that reasoning_steps is not included in the response
    expect(body).not.toHaveProperty('reasoning_steps');
    
    // Check with explicit assertion on the response body variable
    expect(body).not.toHaveProperty('reasoning_steps');
    
    // Additionally verify no nested reasoning_steps exist
    const responseStr = JSON.stringify(body);
    expect(responseStr).not.toContain('reasoning_steps');
  });
});
