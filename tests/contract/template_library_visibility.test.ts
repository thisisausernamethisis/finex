import { describe, expect, it, beforeAll } from '@jest/globals';
import { prisma } from '../mocks/prisma';
import { createJWTForTest } from '../utils/auth';
import { GET as ListTemplatesGET } from '../../app/api/theme-templates/route';
import { executeRouteHandler, parseResponseJson } from '../_setup/contractTestUtils';
import { runTestSeed, SeedResult } from '../seed/buildTestSeed';

describe('Template Library Visibility Contract Tests', () => {
  const testUserId = 'user_test123';
  const otherUserId = 'user_other456';
  let testUserJwt: string;
  let otherUserJwt: string;
  let seedResult: SeedResult;
  let otherSeed: SeedResult;
  let publicTemplateId: string;
  let privateTemplateId: string;

  beforeAll(async () => {
    testUserJwt = createJWTForTest({ sub: testUserId });
    otherUserJwt = createJWTForTest({ sub: otherUserId });
    seedResult = await runTestSeed({ userId: testUserId });
    otherSeed = await runTestSeed({ userId: otherUserId });
    // Ensure at least one public template exists for other user
    // Mark one of other user's templates as public via the mock
    publicTemplateId = otherSeed.templateIds[0];
    await prisma.themeTemplate.update({
      where: { id: publicTemplateId },
      data: { isPublic: true }
    });
    // Ensure at least one private template for other user (if not already)
    privateTemplateId = otherSeed.templateIds[1] || `temp-${otherUserId}-priv`;
    if (!otherSeed.templateIds[1]) {
      await prisma.themeTemplate.create({
        data: {
          id: privateTemplateId,
          name: 'Other User Private Template',
          ownerId: otherUserId,
          isPublic: false,
          payload: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  });

  it('shows public templates from other users in the listing', async () => {
    const response = await executeRouteHandler(
      ListTemplatesGET,
      'GET',
      '/api/theme-templates',
      {},
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    // The test user's library list should include the other user's public template
    const publicTemplate = data.items.find((tmpl: any) => tmpl.id === publicTemplateId);
    expect(publicTemplate).toBeDefined();
    if (publicTemplate) {
      expect(publicTemplate.isPublic).toBe(true);
      expect(publicTemplate.ownerId || publicTemplate.userId).toBe(otherUserId);
    }
  });

  it('does not show other users’ private templates', async () => {
    const response = await executeRouteHandler(
      ListTemplatesGET,
      'GET',
      '/api/theme-templates',
      {},
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    // Ensure that the other user's private template is not in test user's list
    const privateTemplate = data.items.find((tmpl: any) => tmpl.id === privateTemplateId);
    expect(privateTemplate).toBeUndefined();
  });

  it('allows a user to see their own private templates only', async () => {
    // When testUser requests with mine=true, they should see their private templates but not others'
    const responseMine = await executeRouteHandler(
      ListTemplatesGET,
      'GET',
      '/api/theme-templates?mine=true',
      {},
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(responseMine.status).toBe(200);
    const dataMine = await parseResponseJson(responseMine);
    for (const tmpl of dataMine.items) {
      // All templates should belong to testUser
      expect(tmpl.ownerId || tmpl.userId).toBe(testUserId);
    }

    // When otherUser requests their list, they should see their own (including the one we marked public and the private one)
    const responseOther = await executeRouteHandler(
      ListTemplatesGET,
      'GET',
      '/api/theme-templates?mine=true',
      {},
      undefined,
      { 'Authorization': `Bearer ${otherUserJwt}` }
    );
    expect(responseOther.status).toBe(200);
    const dataOther = await parseResponseJson(responseOther);
    const otherIds = dataOther.items.map((t: any) => t.id);
    expect(otherIds).toContain(publicTemplateId);    // their public (which they own)
    expect(otherIds).toContain(privateTemplateId);   // their private
    // And none of testUser's templates should be in other user's list
    for (const tmpl of dataOther.items) {
      if ((tmpl.ownerId || tmpl.userId) !== otherUserId) {
        // If any template is not owned by otherUser, fail
        fail(`Found template not owned by other user in their mine=true list: ${tmpl.id}`);
      }
    }
  });
});
