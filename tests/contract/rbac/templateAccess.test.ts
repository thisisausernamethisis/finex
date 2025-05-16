import { describe, it, expect, beforeEach } from 'vitest';
import { mockUser, UserRole } from '../../helpers/user';
import { ThemeTemplateRepository } from '../../../lib/repositories/themeTemplateRepository';
import { Container } from '../../../lib/container';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

// Mock environment setup
import '../../../lib/db'; // This sets up the DB connection
import { setupDeterministicAuth } from '../../helpers/auth';

// Define route patterns for testing
const templateRoutes = [
  { method: 'GET', path: '/api/theme-templates/{templateId}' },
  { method: 'PUT', path: '/api/theme-templates/{templateId}' },
  { method: 'DELETE', path: '/api/theme-templates/{templateId}' },
  { method: 'PATCH', path: '/api/theme-templates/{templateId}' }
];

// Helper to create JWT token for testing
function createAuthHeader(userId: string): { Authorization: string } {
  // In a real implementation, this would create a proper JWT
  // For our test purposes, we'll use a simpler format
  return { Authorization: `Bearer test_token_${userId}` };
}

describe('Template RBAC Contract Tests', () => {
  let ownerUser: ReturnType<typeof mockUser>;
  let otherUser: ReturnType<typeof mockUser>;
  let templateId: string;
  let templateRepo: ThemeTemplateRepository;
  
  // Setup before each test
  beforeEach(async () => {
    // Create our test users
    ownerUser = mockUser(UserRole.ADMIN);
    otherUser = mockUser(UserRole.VIEWER);
    
    // Set up deterministic auth with the owner user
    setupDeterministicAuth(ownerUser);
    
    // Get the PrismaClient (could be a mock in tests)
    const prisma = Container.get<PrismaClient>('PrismaClient');
    
    // Initialize the template repository
    templateRepo = new ThemeTemplateRepository(prisma);
    
    // Create a test template owned by ownerUser
    const template = await prisma.themeTemplate.create({
      data: {
        name: 'Test Template for RBAC',
        description: 'Template for testing RBAC',
        isPublic: false,
        ownerId: ownerUser.id,
        payload: {}, // Empty JSON payload
      }
    });
    
    templateId = template.id;
  });
  
  // Test each template route
  templateRoutes.forEach(route => {
    describe(`${route.method} ${route.path}`, () => {
      const path = route.path.replace('{templateId}', templateId);
      
      it('returns 401 when unauthenticated', async () => {
        // Set up request body for methods that need it
        const body = route.method === 'PATCH' 
          ? JSON.stringify({ isPublic: true }) 
          : route.method === 'PUT'
            ? JSON.stringify({ name: 'Updated Template' })
            : undefined;
            
        const response = await fetch(path, { 
          method: route.method,
          body,
          headers: body ? { 'Content-Type': 'application/json' } : undefined
        });
        expect(response.status).toBe(401);
      });
      
      it('returns 403 when authenticated as non-owner', async () => {
        // Set up auth with the non-owner
        setupDeterministicAuth(otherUser);
        
        // Set up request body for methods that need it
        const body = route.method === 'PATCH' 
          ? JSON.stringify({ isPublic: true }) 
          : route.method === 'PUT'
            ? JSON.stringify({ name: 'Updated Template' })
            : undefined;
            
        const headers = {
          ...createAuthHeader(otherUser.id),
          ...(body ? { 'Content-Type': 'application/json' } : {})
        };
        
        const response = await fetch(path, { 
          method: route.method,
          headers,
          body
        });
        expect(response.status).toBe(403);
      });
      
      it('returns 200/204 when authenticated as owner', async () => {
        // Set up auth with the owner
        setupDeterministicAuth(ownerUser);
        
        // Set up request body for methods that need it
        const body = route.method === 'PATCH' 
          ? JSON.stringify({ isPublic: true }) 
          : route.method === 'PUT'
            ? JSON.stringify({ name: 'Updated Template' })
            : undefined;
            
        const headers = {
          ...createAuthHeader(ownerUser.id),
          ...(body ? { 'Content-Type': 'application/json' } : {})
        };
        
        const response = await fetch(path, { 
          method: route.method,
          headers,
          body
        });
        expect([200, 204]).toContain(response.status);
      });
      
      // Add special test for public templates with GET requests
      if (route.method === 'GET') {
        it('allows access to public templates for non-owners', async () => {
          // Make the template public
          const prismaClient = Container.get<PrismaClient>('PrismaClient');
          await prismaClient.themeTemplate.update({
            where: { id: templateId },
            data: { isPublic: true }
          });
          
          // Set up auth with the non-owner
          setupDeterministicAuth(otherUser);
          
          const response = await fetch(path, { 
            method: 'GET',
            headers: createAuthHeader(otherUser.id)
          });
          expect(response.status).toBe(200);
        });
      }
    });
  });
});
