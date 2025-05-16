/**
 * Global Clerk Auth mock for Vitest/Jest tests
 */
import { vi } from 'vitest';
import { 
  getUserByRole, getTestAuthCtx, UserRole, 
  DEFAULT_ADMIN_USER, DEFAULT_EDITOR, DEFAULT_VIEWER 
} from '../helpers/user';

// Importing jsonwebtoken directly
import * as jwt from 'jsonwebtoken';

// Export a flexible mockAs utility function for use in tests
export function mockAs(roleOrUser: UserRole | { id?: string | null, [key: string]: any } | null | undefined) {
  // Handle null/undefined case
  if (!roleOrUser) {
    return { Authorization: `Bearer test-token-${DEFAULT_ADMIN_USER.id}` };
  }
  
  // Handle string role (ADMIN, EDITOR, VIEWER)
  if (typeof roleOrUser === 'string') {
    const user = getUserByRole(roleOrUser);
    return { Authorization: `Bearer test-token-${user.id}` };
  }
  
  // Handle user object with id
  if (typeof roleOrUser === 'object') {
    if ('id' in roleOrUser) {
      // If id is null/undefined/falsy, use default user
      if (!roleOrUser.id) {
        return { Authorization: `Bearer test-token-${DEFAULT_ADMIN_USER.id}` };
      }
      return { Authorization: `Bearer test-token-${roleOrUser.id}` };
    }
    
    // If no id property but has other properties, create a deterministic id from the object
    const objId = JSON.stringify(roleOrUser).slice(0, 20);
    return { Authorization: `Bearer test-token-custom-${objId}` };
  }
  
  // Default case, return admin
  return { Authorization: `Bearer test-token-${DEFAULT_ADMIN_USER.id}` };
}

// Mock @clerk/nextjs/server for tests
vi.mock('@clerk/nextjs/server', () => {
  // Extract user ID from request
  const getUserFromRequest = (req: any) => {
    // Extract the token from the Authorization header
    const authHeader = req?.headers?.get('Authorization');
    if (!authHeader) {
      return DEFAULT_ADMIN_USER.id; // Default admin user if no auth header
    }
    
    // Parse the token to get user ID format: 'test-token-{userId}'
    try {
      const token = authHeader.replace('Bearer ', '');
      
      // Check if it's one of our test tokens
      if (token.startsWith('test-token-')) {
        return token.replace('test-token-', '');
      }
      
      // Try to parse JWT if not our test token
      const decoded = jwt.decode(token);
      return decoded?.sub || DEFAULT_ADMIN_USER.id;
    } catch (e) {
      return DEFAULT_ADMIN_USER.id; // Default if token parsing fails
    }
  };
  
  // Mock auth function
  const auth = vi.fn((req: any) => {
    const userId = getUserFromRequest(req);
    return { userId };
  });
  
  // Mock currentUser function that can be mocked in tests
  // Wrap the function in vi.fn() so it has the mockImplementation methods
  const currentUser = vi.fn(async (req: any) => {
    const userId = getUserFromRequest(req);
    
    // Check if this is one of our known test users
    if (userId === DEFAULT_ADMIN_USER.id) {
      return DEFAULT_ADMIN_USER;
    } else if (userId === DEFAULT_EDITOR.id) {
      return DEFAULT_EDITOR;
    } else if (userId === DEFAULT_VIEWER.id) {
      return DEFAULT_VIEWER;
    }
    
    // For other user IDs, create a generic user
    return {
      id: userId,
      username: `user_${userId.substring(0, 6)}`,
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: `user_${userId.substring(0, 6)}@example.com` }]
    };
  });
  
  // Mock clerkClient
  const clerkClient = {
    users: {
      getUser: vi.fn((userId: string) => Promise.resolve({ 
        id: userId,
        username: `user_${userId.substring(0, 6)}`,
        firstName: 'Test',
        lastName: 'User'
      }))
    }
  };
  
  return {
    auth,
    currentUser,
    clerkClient,
    getAuth: vi.fn(() => getTestAuthCtx(UserRole.ADMIN))
  };
});
