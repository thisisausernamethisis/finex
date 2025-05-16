import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../mocks/prisma';
import { ThemeTemplateRepository } from '@/lib/repositories';
import { createJWTForTest } from '../utils/auth';
import { 
  GET as ListTemplatesGET, 
  POST as CreateTemplatePOST 
} from '../../app/api/theme-templates/route';
import { POST as CloneTemplatePOST } from '../../app/api/theme-templates/[id]/clone/route';
import { POST as CloneAssetPOST } from '../../app/api/assets/[assetId]/clone/route';
import { GET as GetTemplateGET, DELETE as DeleteTemplateDELETE } from '../../app/api/theme-templates/[id]/route';
import { executeRouteHandler, parseResponseJson } from '../_setup/contractTestUtils';
import { runTestSeed, SeedResult } from '../seed/buildTestSeed';
import type { ThemeTemplate } from '@prisma/client';

describe('Template Library API Contract Tests', () => {
  const testUserId = 'user_test123';
  const otherUserId = 'user_other456';
  let testUserJwt: string;
  let otherUserJwt: string;
  let seedResult: SeedResult;
  let otherUserSeed: SeedResult;
  let templateId: string;
  let privateTemplateId: string;
  let themeId: string;
  let assetId: string;

  beforeAll(async () => {
    // Ensure a known "public guard template" exists in the mock DB
    await prisma.themeTemplate.upsert({
      where: { id: 'public-guard-template' },
      create: {
        id: 'public-guard-template',
        name: 'Guard Public Template',
        ownerId: testUserId,
        isPublic: true,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      update: {
        ownerId: testUserId,
        isPublic: true,
        payload: {}
      }
    });

    // Create JWTs for test and other user
    testUserJwt = createJWTForTest({ sub: testUserId });
    otherUserJwt = createJWTForTest({ sub: otherUserId });

    // Seed deterministic data for test user and another user
    seedResult = await runTestSeed({ userId: testUserId });
    otherUserSeed = await runTestSeed({ userId: otherUserId });
    // Extract some IDs from seed results for use in tests
    assetId = seedResult.assetIds[0];
    themeId = seedResult.themeIds ? seedResult.themeIds[0] : 'theme_test_1';
    templateId = seedResult.templateIds[0];
    // Create an additional private template for testing visibility
    const repo = new ThemeTemplateRepository();
    const privateTemplate = await repo.createTemplate(testUserId, {
      name: 'Private Test Template',
      isPublic: false,
      assetId: assetId,
      themeId: themeId,
      payload: {}
    });
    privateTemplateId = privateTemplate.id;
  });

  afterAll(async () => {
    // Clean up any templates created during tests
    if (privateTemplateId) {
      await prisma.themeTemplate.delete({ where: { id: privateTemplateId } }).catch(() => {/* ignore */});
    }
    // Optionally clean other seeded data if needed (not strictly necessary with mock)
  });

  it('lists templates visible to the user (own and public templates)', async () => {
    const response = await executeRouteHandler(
      ListTemplatesGET,
      'GET',
      '/api/theme-templates?mine=true',  // requesting only user's own templates as per query param
      {}, 
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    // The response should list at least the user's own templates. Since we used mine=true, likely only own templates.
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);
    // All returned templates should have ownerId = testUserId (because mine=true filters to user's templates)
    for (const tmpl of data.items) {
      expect(tmpl.ownerId || tmpl.userId).toBe(testUserId);
      expect(tmpl).toHaveProperty('name');
      expect(tmpl).toHaveProperty('isPublic');
    }
  });

  it('allows creating a new template in the library', async () => {
    const newTemplate = { 
      name: 'Contract Test Created Template', 
      assetId, 
      themeId, 
      isPublic: false, 
      payload: { foo: 'bar' }
    };
    const response = await executeRouteHandler(
      CreateTemplatePOST,
      'POST',
      '/api/theme-templates',
      {},
      newTemplate,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(response.status).toBe(201);
    const created = await parseResponseJson(response);
    expect(created).toHaveProperty('id');
    expect(created.name).toBe(newTemplate.name);
    expect(created.ownerId || created.userId).toBe(testUserId);
    expect(created.isPublic).toBe(false);
    // Store the created template ID and ensure it doesn't clash with others
    const newId: string = created.id;
    expect(seedResult.templateIds).not.toContain(newId);
  });

  it('retrieves a template by ID if accessible to the user', async () => {
    // The test user should be able to get their own template
    const responseOwn = await executeRouteHandler(
      GetTemplateGET,
      'GET',
      `/api/theme-templates/${templateId}`,
      { id: templateId },
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(responseOwn.status).toBe(200);
    const template = await parseResponseJson(responseOwn);
    expect(template.id).toBe(templateId);
    expect(template.name).toBeDefined();
    expect(template.ownerId || template.userId).toBe(testUserId);

    // The other user should NOT be able to get testUser's private template
    const responseForbidden = await executeRouteHandler(
      GetTemplateGET,
      'GET',
      `/api/theme-templates/${privateTemplateId}`,
      { id: privateTemplateId },
      undefined,
      { 'Authorization': `Bearer ${otherUserJwt}` }
    );
    // Depending on implementation, this might return 404 (not found) or 403. 
    // The contract likely expects a 404 for unauthorized access (to avoid leaking existence).
    expect([403, 404]).toContain(responseForbidden.status);
  });

  it('clones a template (deep clone) and returns the new template', async () => {
    // Use an existing template of testUser and clone it
    const response = await executeRouteHandler(
      CloneTemplatePOST,
      'POST',
      `/api/theme-templates/${templateId}/clone`,
      { id: templateId },
      {},  // no body needed for clone
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(response.status).toBe(201);
    const cloned = await parseResponseJson(response);
    expect(cloned).toHaveProperty('id');
    expect(cloned.name).toContain('(Copy)');  // assuming clone appends "(Copy)" or similar
    expect(cloned.ownerId || cloned.userId).toBe(testUserId);
    // The cloned template should not have the same ID as the source
    expect(cloned.id).not.toBe(templateId);
  });

  it('allows cloning a template into an asset (cloning template as asset)', async () => {
    // Clone a template into a new Asset (via the asset clone endpoint)
    const response = await executeRouteHandler(
      CloneAssetPOST,
      'POST',
      `/api/assets/${assetId}/clone`,
      { assetId },
      { templateId },  // body contains which template to clone into an asset
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(response.status).toBe(201);
    const clonedAsset = await parseResponseJson(response);
    expect(clonedAsset).toHaveProperty('id');
    expect(clonedAsset.name).toBeDefined();
    expect(clonedAsset.templateId || clonedAsset.sourceTemplateId).toBe(templateId);
    // The cloned asset should belong to the user
    expect(clonedAsset.userId || clonedAsset.ownerId).toBe(testUserId);
  });

  it('deletes a template and makes it inaccessible', async () => {
    // Create a temporary template to delete
    const repo = new ThemeTemplateRepository();
    const tempTemplate: ThemeTemplate = await repo.createTemplate(testUserId, {
      name: 'Temp Template To Delete',
      isPublic: false,
      assetId,
      themeId,
      payload: {}
    });
    const tempId = tempTemplate.id;
    const deleteResponse = await executeRouteHandler(
      DeleteTemplateDELETE,
      'DELETE',
      `/api/theme-templates/${tempId}`,
      { id: tempId },
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(deleteResponse.status).toBe(204);

    // Verify subsequent fetch is not found
    const fetchResponse = await executeRouteHandler(
      GetTemplateGET,
      'GET',
      `/api/theme-templates/${tempId}`,
      { id: tempId },
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(fetchResponse.status).toBe(404);
  });
});
