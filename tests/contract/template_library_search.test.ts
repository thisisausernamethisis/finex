import { describe, expect, it, beforeAll } from '@jest/globals';
import { prisma } from '../mocks/prisma';
import { createJWTForTest } from '../utils/auth';
import { GET as ListTemplatesGET } from '../../app/api/theme-templates/route';
import { executeRouteHandler, parseResponseJson } from '../_setup/contractTestUtils';
import { runTestSeed, SeedResult } from '../seed/buildTestSeed';

describe('Template Library Search API Contract Tests', () => {
  const testUserId = 'user_test123';
  let testUserJwt: string;
  let seedResult: SeedResult;
  
  beforeAll(async () => {
    testUserJwt = createJWTForTest({ sub: testUserId });
    seedResult = await runTestSeed({ userId: testUserId, extraTemplates: [
      { name: 'Unique Search Template', isPublic: true, payload: {} }
    ]});
    // Ensure at least one unique-named template exists for search
    const uniqueTemplateName = 'Unique Search Template';
    const exists = seedResult.templateIds.length > 0;
    expect(exists).toBe(true);
    // If not exists for some reason, create one via repository
    if (!exists) {
      await prisma.themeTemplate.create({
        data: {
          id: 'search-temp-1',
          name: uniqueTemplateName,
          ownerId: testUserId,
          isPublic: true,
          payload: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  });

  it('returns templates matching a search query', async () => {
    const query = 'Unique Search';  // partial match of "Unique Search Template"
    const response = await executeRouteHandler(
      ListTemplatesGET,
      'GET',
      `/api/theme-templates?q=${encodeURIComponent(query)}`,
      {},
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(Array.isArray(data.items)).toBe(true);
    // All returned templates' names should contain the search query substring (case-insensitive)
    const lowerQuery = query.toLowerCase();
    for (const tmpl of data.items) {
      expect(typeof tmpl.name).toBe('string');
      expect(tmpl.name.toLowerCase()).toContain(lowerQuery);
    }
  });

  it('supports filtering by "mine" flag in search', async () => {
    // We use mine=true to filter to user's own templates
    const response = await executeRouteHandler(
      ListTemplatesGET,
      'GET',
      '/api/theme-templates?mine=true&q=Template',
      {},
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    for (const tmpl of data.items) {
      // Every template should belong to testUserId (since mine=true)
      expect(tmpl.ownerId || tmpl.userId).toBe(testUserId);
    }
    // Additionally, ensure the query filter still applies (all names contain "Template")
    for (const tmpl of data.items) {
      expect(tmpl.name.toLowerCase()).toContain('template');
    }
  });

  it('paginates search results correctly', async () => {
    // Ensure we have more than one template to test pagination (the seed likely created several)
    const responsePage1 = await executeRouteHandler(
      ListTemplatesGET,
      'GET',
      '/api/theme-templates?page=1&limit=1&q=Template',
      {},
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(responsePage1.status).toBe(200);
    const data1 = await parseResponseJson(responsePage1);
    expect(data1.items).toHaveLength(1);
    expect(data1.total).toBeGreaterThanOrEqual(1);
    expect(typeof data1.hasMore).toBe('boolean');

    const responsePage2 = await executeRouteHandler(
      ListTemplatesGET,
      'GET',
      '/api/theme-templates?page=2&limit=1&q=Template',
      {},
      undefined,
      { 'Authorization': `Bearer ${testUserJwt}` }
    );
    expect(responsePage2.status).toBe(200);
    const data2 = await parseResponseJson(responsePage2);
    // The second page should have at most 1 item, and it should be different from page1's item if total > 1.
    expect(data2.items).toHaveLength(1);
    if (data1.items[0] && data2.items[0]) {
      expect(data2.items[0].id).not.toBe(data1.items[0].id);
    }
  });
});
