/**
 * Mock implementation of @clerk/nextjs/server for Vitest and Jest tests
 */

import { vi } from 'vitest';

// For user roles in tests
enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

// Default users for testing
const DEFAULT_ADMIN_USER = {
  id: 'user_admin123',
  username: 'admin_user',
  firstName: 'Admin',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'admin@example.com' }]
};

const DEFAULT_EDITOR = {
  id: 'user_editor456',
  username: 'editor_user',
  firstName: 'Editor',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'editor@example.com' }]
};

const DEFAULT_VIEWER = {
  id: 'user_viewer789',
  username: 'viewer_user',
  firstName: 'Viewer',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'viewer@example.com' }]
};

// Helper for getting a user by role
const getUserByRole = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return DEFAULT_ADMIN_USER;
    case UserRole.EDITOR:
      return DEFAULT_EDITOR;
    case UserRole.VIEWER:
      return DEFAULT_VIEWER;
    default:
      return DEFAULT_ADMIN_USER;
  }
};

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
    
    // For other tokens, return default
    return DEFAULT_ADMIN_USER.id;
  } catch (e) {
    return DEFAULT_ADMIN_USER.id; // Default if token parsing fails
  }
};

// Mock auth function
const auth = vi.fn((req: any) => {
  const userId = getUserFromRequest(req);
  return { userId };
});

// Mock currentUser function that can be mocked further in tests
// Use vi.fn() to ensure it has mockImplementation methods
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

// Provide test auth context
const getTestAuthCtx = (role: UserRole) => {
  const user = getUserByRole(role);
  return {
    auth: {
      userId: user.id
    }
  };
};

// Export everything to make it accessible in tests
export {
  auth,
  currentUser,
  clerkClient,
  UserRole,
  DEFAULT_ADMIN_USER,
  DEFAULT_EDITOR,
  DEFAULT_VIEWER,
  getUserByRole,
  getTestAuthCtx
};

// For Next.js auth() function
export const getAuth = vi.fn(() => getTestAuthCtx(UserRole.ADMIN));
