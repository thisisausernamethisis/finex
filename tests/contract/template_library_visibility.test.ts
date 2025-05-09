// @ts-nocheck
// TODO(T-173b): Clerk SDK typings and mock repository usage

import { describe, expect, it, beforeAll, afterAll, jest } from '@jest/globals';
import { prisma } from '../mocks/prisma';
import { ThemeTemplateRepository } from '../../lib/repositories';
import { createJWTForTest } from '../utils/auth';
import { PATCH as ToggleVisibilityPATCH } from '../../app/api/theme-templates/[id]/route';
import { executeRouteHandler, parseResponseJson } from '../_setup/contractTestUtils';
import { toggleVisibility } from '../../lib/services/templateService';

describe('Template Visibility API Contract Tests', () => {
  // User IDs for testing
  let testUserId = 'user_test123';
  let testUserJwt: string;
  let otherUserId = 'user_other456';
  let otherUserJwt: string;

  // Template IDs for testing
  let ownedTemplateId: string;
  let otherUserTemplateId: string;

  // Repository for creating test data
  let templateRepository: ThemeTemplateRepository;

  beforeAll(async () => {
    // Set up test data
    try {
      // Clean up any existing test templates
      await prisma.themeTemplate.deleteMany({
        where: {
          name: {
            startsWith: 'Visibility Test'
          }
        }
      });
    } catch (e) {
      // Ignore deletion errors
    }
    
    // Create test user JWTs
    testUserJwt = createJWTForTest({ sub: testUserId });
    otherUserJwt = createJWTForTest({ sub: otherUserId });
    
    // Initialize repository
    templateRepository = new ThemeTemplateRepository();
    
    // Create a template owned by the test user (initially private)
    const userTemplate = await templateRepository.createTemplate(
      testUserId,
      {
        name: 'Visibility Test User Template',
        description: 'Template owned by the test user',
        themeId: 'mock-theme-id',
        isPublic: false
      }
    );
    ownedTemplateId = userTemplate.id;
    
    // Create a template owned by another user
    const otherTemplate = await templateRepository.createTemplate(
      otherUserId,
      {
        name: 'Visibility Test Other User Template',
        description: 'Template owned by another user',
        themeId: 'mock-theme-id',
        isPublic: true
      }
    );
    otherUserTemplateId = otherTemplate.id;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.themeTemplate.deleteMany({
        where: {
          name: {
            startsWith: 'Visibility Test'
          }
        }
      });
    } catch (e) {
      // Ignore deletion errors
    }
  });

  describe('PATCH /api/theme-templates/{id}', () => {
    it('should allow owner to publish a private template', async () => {
      // Inject test template for the service call
      jest.spyOn(prisma.themeTemplate, 'findUnique')
        .mockResolvedValueOnce({
          id: ownedTemplateId,
          name: 'Visibility Test User Template',
          description: 'Template owned by the test user',
          ownerId: testUserId,
          isPublic: false,
          payload: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      // Mock the update response
      jest.spyOn(prisma.themeTemplate, 'update')
        .mockResolvedValueOnce({
          id: ownedTemplateId,
          name: 'Visibility Test User Template',
          description: 'Template owned by the test user',
          ownerId: testUserId,
          isPublic: true, // Now published
          payload: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      // Test making a private template public
      const response = await executeRouteHandler(
        ToggleVisibilityPATCH,
        'PATCH',
        `/api/theme-templates/${ownedTemplateId}`,
        { id: ownedTemplateId },
        { isPublic: true },
        { 'Authorization': `Bearer ${testUserJwt}` }
      );
      
      // Verify successful response
      expect(response.status).toBe(200);
      
      const data = await parseResponseJson(response);
      
      // Validate response schema
      expect(data).toHaveProperty('id');
      expect(data.id).toBe(ownedTemplateId);
      expect(data).toHaveProperty('isPublic');
      expect(data.isPublic).toBe(true);
      expect(data).toHaveProperty('ownerId');
      expect(data.ownerId).toBe(testUserId);
    });
    
    it('should allow owner to unpublish a public template', async () => {
      // Create a mock public template
      jest.spyOn(prisma.themeTemplate, 'findUnique')
        .mockResolvedValueOnce({
          id: ownedTemplateId,
          name: 'Visibility Test User Template',
          description: 'Template owned by the test user',
          ownerId: testUserId,
          isPublic: true,
          payload: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      // Mock the update response
      jest.spyOn(prisma.themeTemplate, 'update')
        .mockResolvedValueOnce({
          id: ownedTemplateId,
          name: 'Visibility Test User Template',
          description: 'Template owned by the test user',
          ownerId: testUserId,
          isPublic: false, // Now private
          payload: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      // Test making a public template private
      const response = await executeRouteHandler(
        ToggleVisibilityPATCH,
        'PATCH',
        `/api/theme-templates/${ownedTemplateId}`,
        { id: ownedTemplateId },
        { isPublic: false },
        { 'Authorization': `Bearer ${testUserJwt}` }
      );
      
      // Verify successful response
      expect(response.status).toBe(200);
      
      const data = await parseResponseJson(response);
      
      // Validate schema
      expect(data).toHaveProperty('isPublic');
      expect(data.isPublic).toBe(false);
    });
    
    it('should prevent non-owner from changing template visibility', async () => {
      // Mock the template ownership check
      jest.spyOn(prisma.themeTemplate, 'findUnique')
        .mockResolvedValueOnce({
          id: otherUserTemplateId,
          name: 'Visibility Test Other User Template',
          description: 'Template owned by another user',
          ownerId: otherUserId, // Owned by another user
          isPublic: true,
          payload: {} as any,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      // First mock the service
      const templateService = jest.requireActual('../../lib/services/templateService') as { 
        toggleVisibility: (templateId: string, userId: string, isPublic: boolean) => Promise<any> 
      };
      
      // Then create a spy that throws an error
      const toggleVisibilitySpy = jest.spyOn(templateService, 'toggleVisibility')
        .mockImplementation(() => {
          throw new Error('Only the template owner can toggle visibility');
        });
      
      // Test the RBAC enforcement
      const response = await executeRouteHandler(
        ToggleVisibilityPATCH,
        'PATCH',
        `/api/theme-templates/${otherUserTemplateId}`,
        { id: otherUserTemplateId },
        { isPublic: false },
        { 'Authorization': `Bearer ${testUserJwt}` }
      );
      
      // Should return forbidden (403)
      expect(response.status).toBe(403);
      
      // Verify the correct error structure
      const errorData = await parseResponseJson(response);
      expect(errorData).toHaveProperty('error');
      
      // Verify that the service was called with the correct parameters
      expect(toggleVisibilitySpy).toHaveBeenCalledWith(
        otherUserTemplateId,
        testUserId,
        false
      );
    });
    
    it('should validate the request body', async () => {
      // Test with invalid schema (missing isPublic)
      const response = await executeRouteHandler(
        ToggleVisibilityPATCH,
        'PATCH',
        `/api/theme-templates/${ownedTemplateId}`,
        { id: ownedTemplateId },
        { someOtherProperty: true }, // Invalid body - missing isPublic
        { 'Authorization': `Bearer ${testUserJwt}` }
      );
      
      // Should return bad request (400)
      expect(response.status).toBe(400);
      
      // Verify the error structure
      const errorData = await parseResponseJson(response);
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toBe('ValidationError');
    });
    
    it('should require authentication', async () => {
      // Test without providing a JWT
      const response = await executeRouteHandler(
        ToggleVisibilityPATCH,
        'PATCH',
        `/api/theme-templates/${ownedTemplateId}`,
        { id: ownedTemplateId },
        { isPublic: true },
        {}, // No Authorization header
        false // withAuth = false
      );
      
      // Should return unauthorized (401)
      expect(response.status).toBe(401);
    });
    
    it('should handle non-existent templates', async () => {
      // Mock the non-existent template
      jest.spyOn(prisma.themeTemplate, 'findUnique')
        .mockResolvedValueOnce(null);
      
      // Create a spy for the non-existent template case
      const templateService = jest.requireActual('../../lib/services/templateService') as { 
        toggleVisibility: (templateId: string, userId: string, isPublic: boolean) => Promise<any> 
      };
      const toggleVisibilitySpy = jest.spyOn(templateService, 'toggleVisibility')
        .mockImplementation(() => {
          throw new Error('Template with ID non-existent-id not found');
        });
      
      // Test with non-existent template ID
      const response = await executeRouteHandler(
        ToggleVisibilityPATCH,
        'PATCH',
        `/api/theme-templates/non-existent-id`,
        { id: 'non-existent-id' },
        { isPublic: true },
        { 'Authorization': `Bearer ${testUserJwt}` }
      );
      
      // Should return not found (404)
      expect(response.status).toBe(404);
      
      // Verify the service was called with the correct parameters
      expect(toggleVisibilitySpy).toHaveBeenCalledWith(
        'non-existent-id',
        testUserId,
        true
      );
    });
  });
});
