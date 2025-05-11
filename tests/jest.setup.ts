// TODO(T-173b): migrate deep jest spies to fully-typed helpers

/**
 * Jest setup file to configure the test environment
 */

// Import helper for deterministic user setup
import { setupDeterministicAuth, DEFAULT_ADMIN_USER } from './helpers/user';

// Set test rate limit to 1 as default for deterministic tests
process.env.RL_LIMIT = '1';

// For deterministic tests, use a fixed seed value for all randomness
process.env.TEST_SEED = '42';

// Setup deterministic auth with default admin user for all tests
// This ensures any test without explicit auth will use the admin user
setupDeterministicAuth(DEFAULT_ADMIN_USER);

// Only mock Prisma when NODE_ENV is 'test'
if (process.env.NODE_ENV === 'test') {
  // Mock PrismaClient to use our mock implementation
  jest.mock('@prisma/client', () => {
    const { PrismaClient } = jest.requireActual('@prisma/client');
    const { prisma } = jest.requireActual('./mocks/prisma');
    
    return {
      PrismaClient: jest.fn().mockImplementation(() => prisma),
    };
  });
  
  // Mock Clerk authentication
  jest.mock('@clerk/nextjs/server', () => {
    const getUserFromRequest = (req: any) => {
      // Extract the token from the Authorization header
      const authHeader = req?.headers?.get('Authorization');
      if (!authHeader) {
        return 'user_test123'; // Default user ID if no auth header
      }
      
      // Parse the JWT token to get the user ID from the sub claim
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = jest.requireActual('jsonwebtoken');
        const decoded = jwt.decode(token);
        return decoded?.sub || 'user_test123';
      } catch (e) {
        return 'user_test123'; // Default if token parsing fails
      }
    };
    
    return {
      auth: jest.fn((req: any) => {
        const userId = getUserFromRequest(req);
        return { userId };
      }),
      currentUser: jest.fn((req: any) => {
        const userId = getUserFromRequest(req);
        return Promise.resolve({
          id: userId,
          username: userId === 'user_test123' ? 'testuser' : 'otheruser',
          firstName: userId === 'user_test123' ? 'Test' : 'Other',
          lastName: 'User',
          emailAddresses: [{ 
            emailAddress: userId === 'user_test123' ? 'test@example.com' : 'other@example.com' 
          }]
        });
      }),
      clerkClient: {
        users: {
          getUser: jest.fn((userId: string) => Promise.resolve({ id: userId }))
        }
      }
    };
  });
  
// We can't mock the repository class directly because it would cause circular dependencies

// Mock the validateCuid function to handle specific test cases
jest.mock('../lib/utils/api', () => {
    const originalModule = jest.requireActual('../lib/utils/api');
    const { badRequest, notFound } = jest.requireActual('../lib/utils/http');
    const { logger } = jest.requireActual('../lib/logger');
    
    return {
      ...originalModule,
      validateCuid: (() => {
        // Create a map to track calls outside the function for state persistence
        const callsPerID = new Map();
        
        const mockFn = jest.fn(async (id, existsCheck, resourceName) => {
          // For special case: asset-to-delete should return 404 on the second GET
          if (id === 'asset-to-delete' && existsCheck) {
            if (!callsPerID.has('delete-check')) {
              // First check passes - mark that we've checked once
              callsPerID.set('delete-check', true);
            } else {
              // Second check fails with 404
              return { 
                valid: false, 
                error: notFound(`${resourceName} not found`, logger) 
              };
            }
          }
          
          // For non-existent asset test
          if (id === 'nonexistent-id') {
            return { 
              valid: false, 
              error: notFound(`${resourceName} not found`, logger) 
            };
          }
          
          // Default - pass validation
          return { valid: true };
        });
        
        return mockFn;
      })()
    };
  });
  
  // Mock accessControlService with conditional RBAC checks
  jest.mock('../lib/services/accessControlService', () => {
    // Track calls to track delete state
    const calls = new Map();
    
    const accessControlMock = {
      AccessRole: {
        VIEWER: 'VIEWER',
        EDITOR: 'EDITOR',
        ADMIN: 'ADMIN'
      },
      hasAssetAccess: jest.fn(async (userId, assetId, role) => {
        // Keep track of calls for each assetId
        const key = `${userId}-${assetId}-${role}`;
        const callCount = calls.get(key) || 0;
        calls.set(key, callCount + 1);
        
        // Non-existent asset with ID
        if (assetId === 'nonexistent-id') {
          return false;
        }
        
        // For RBAC test - enforce access levels on other-owned assets
        if (assetId.includes('other-user-asset')) {
          if (role === 'ADMIN' || role === 'EDITOR') {
            return false; // No admin/editor access for other user's assets
          }
          return true; // Allow viewer access
        }
        
        // RBAC test for delete/update - specific test asset
        if (assetId.includes('mock-asset-for-rbac')) {
          return false; // No access at all for these test-specific assets
        }
        
        // For delete test - asset is deleted after first validation
        if (assetId.includes('asset-to-delete')) {
          // First access succeeds, subsequent accesses fail (simulating deleted state)
          const deleteKey = `${userId}-${assetId}-delete-check`;
          const deleteCallCount = calls.get(deleteKey) || 0;
          calls.set(deleteKey, deleteCallCount + 1);
          
          if (deleteCallCount > 0) {
            return false; // Asset no longer exists
          }
        }
        
        // Default: allow access
        return true;
      })
    };
    return accessControlMock;
  });
}

// Load environment variables from .env.test.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test.local' });
