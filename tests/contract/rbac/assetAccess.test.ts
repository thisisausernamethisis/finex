import { describe, it, expect, beforeEach } from 'vitest';
import { mockUser, UserRole } from '../../helpers/user';
import { AssetRepository } from '../../../lib/repositories/assetRepository';
import { Container } from '../../../lib/container';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

// Mock environment setup
import '../../../lib/db'; // This sets up the DB connection
import { setupDeterministicAuth } from '../../helpers/auth';

// Define route patterns for testing
const assetRoutes = [
  { method: 'PUT', path: '/api/assets/{assetId}' },
  { method: 'DELETE', path: '/api/assets/{assetId}' }
];

const assetFlatRoutes = [
  { method: 'DELETE', path: '/api/assets', query: (id: string) => `?id=${id}` }
];

// Helper to create JWT token for testing
function createAuthHeader(userId: string): { Authorization: string } {
  // In a real implementation, this would create a proper JWT
  // For our test purposes, we'll use a simpler format
  return { Authorization: `Bearer test_token_${userId}` };
}

describe('Asset RBAC Contract Tests', () => {
  let ownerUser: ReturnType<typeof mockUser>;
  let otherUser: ReturnType<typeof mockUser>;
  let assetId: string;
  let assetRepo: AssetRepository;
  
  // Setup before each test
  beforeEach(async () => {
    // Create our test users
    ownerUser = mockUser(UserRole.ADMIN);
    otherUser = mockUser(UserRole.VIEWER);
    
    // Set up deterministic auth with the owner user
    setupDeterministicAuth(ownerUser);
    
    // Get the PrismaClient (could be a mock in tests)
    const prisma = Container.get<PrismaClient>('PrismaClient');
    
    // Initialize the asset repository
    assetRepo = new AssetRepository(prisma);
    
    // Create a test asset owned by ownerUser
    const asset = await assetRepo.createAsset(ownerUser.id, {
      name: 'Test Asset for RBAC',
      description: 'Asset for testing RBAC',
      isPublic: false
    });
    
    assetId = asset.id;
  });
  
  // Test each asset route with path parameter
  assetRoutes.forEach(route => {
    describe(`${route.method} ${route.path}`, () => {
      const path = route.path.replace('{assetId}', assetId);
      
      it('returns 401 when unauthenticated', async () => {
        const response = await fetch(path, { 
          method: route.method 
        });
        expect(response.status).toBe(401);
      });
      
      it('returns 403 when authenticated as non-owner', async () => {
        // Set up auth with the non-owner
        setupDeterministicAuth(otherUser);
        
        const response = await fetch(path, { 
          method: route.method,
          headers: createAuthHeader(otherUser.id)
        });
        expect(response.status).toBe(403);
      });
      
      it('returns 200/204 when authenticated as owner', async () => {
        // Set up auth with the owner
        setupDeterministicAuth(ownerUser);
        
        const response = await fetch(path, { 
          method: route.method,
          headers: createAuthHeader(ownerUser.id)
        });
        expect([200, 204]).toContain(response.status);
      });
    });
  });
  
  // Test flat routes (with query parameters)
  assetFlatRoutes.forEach(route => {
    describe(`${route.method} ${route.path} with query ${route.query}`, () => {
      const path = `${route.path}${route.query(assetId)}`;
      
      it('returns 401 when unauthenticated', async () => {
        const response = await fetch(path, { 
          method: route.method 
        });
        expect(response.status).toBe(401);
      });
      
      it('returns 403 when authenticated as non-owner', async () => {
        // Set up auth with the non-owner
        setupDeterministicAuth(otherUser);
        
        const response = await fetch(path, { 
          method: route.method,
          headers: createAuthHeader(otherUser.id)
        });
        expect(response.status).toBe(403);
      });
      
      it('returns 200/204 when authenticated as owner', async () => {
        // Set up auth with the owner
        setupDeterministicAuth(ownerUser);
        
        const response = await fetch(path, { 
          method: route.method,
          headers: createAuthHeader(ownerUser.id)
        });
        expect([200, 204]).toContain(response.status);
      });
    });
  });
});
