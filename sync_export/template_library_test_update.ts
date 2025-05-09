// Example test update showing how to replace dynamic ID expectations with deterministic ones
// File: tests/contract/template_library.test.ts

import { PrismaClient } from '@prisma/client';
import { createTestServer } from '../_setup/contractTestUtils';
import { AuthUtils } from '../utils/auth';

const prisma = new PrismaClient();

describe('GET /api/theme-templates', () => {
  let server;
  const userID = 'user_2cNBFqHGszn4Ko0CNLMiJ4JJ4ZJ';
  
  // Expected deterministic IDs from seeded data
  const expectedIds = {
    template1: 'tmpl_ehpicc4emkl73uy2gyyljkgm', // Deterministic ID from seed
    template2: 'tmpl_m8eq08cjgcqkbi9mioqp05dl',
    template3: 'tmpl_pvl7mfya66na3gv3p4q0uwzh',
    assetNvidia: 'asset_NVDA_8f5c20c760f9e6aab986',
    assetMicrosoft: 'asset_MSFT_92ae4522f6b48de9a427'
  };

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  test('should list available templates with pagination', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/theme-templates',
      headers: AuthUtils.getAuthHeader(userID),
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    
    expect(body).toEqual({
      items: [
        {
          id: expectedIds.template1, // Using deterministic ID instead of expect.any(String)
          name: 'Growth Analysis',
          description: 'Standard growth template',
          isPublic: true,
          ownerId: 'user_system',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        {
          id: expectedIds.template2, // Using deterministic ID instead of expect.any(String)
          name: 'Risk Assessment',
          description: 'Enterprise risk evaluation',
          isPublic: true,
          ownerId: 'user_system',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
      pageInfo: {
        hasNextPage: true,
        page: 1,
        pageSize: 2,
        totalItems: expect.any(Number),
      },
    });
  });

  test('should fetch a specific template by ID', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/theme-templates/${expectedIds.template1}`, // Using deterministic ID
      headers: AuthUtils.getAuthHeader(userID),
    });

    expect(response.statusCode).toBe(200);
    const template = JSON.parse(response.body);
    
    expect(template).toEqual({
      id: expectedIds.template1,
      name: 'Growth Analysis',
      description: 'Standard growth template',
      isPublic: true,
      ownerId: 'user_system',
      themes: [
        {
          id: expect.any(String),
          name: 'Default System Theme',
          config: expect.any(Object),
        }
      ],
      assets: [
        {
          id: expectedIds.assetNvidia,
          name: 'NVIDIA',
        },
        {
          id: expectedIds.assetMicrosoft,
          name: 'Microsoft',
        }
      ],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});
