import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createJWTForTest } from '../utils/auth';
import { TEST_USER_ID } from './constants';

// Create mock Prisma instance
const prisma = new PrismaClient();

// Mock Next.js authentication
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: TEST_USER_ID })),
  clerkClient: {
    users: {
      getUser: jest.fn(() => ({ id: TEST_USER_ID }))
    }
  }
}));

// Create a test JWT token
export const TEST_JWT = createJWTForTest({ 
  sub: TEST_USER_ID, 
  sid: 'test-session-id'
});

type RouteHandler = (
  req: NextRequest,
  context: { params: Record<string, string> }
) => Promise<Response>;

/**
 * Creates a context for testing route handlers
 * @param method HTTP method
 * @param pathname URL path
 * @param params Route parameters
 * @param body Request body (optional)
 * @param headers Request headers (optional)
 */
export function createRouteHandlerContext(
  method: string, 
  pathname: string, 
  params: Record<string, string> = {}, 
  body?: any,
  headers?: Record<string, string>,
  withAuth: boolean = true
) {
  const url = new URL(`http://localhost${pathname}`);
  
  // Create default headers with content type
  const defaultHeaders: Record<string, string> = { 
    'Content-Type': 'application/json' 
  };
  
  // Add auth header if needed
  if (withAuth) {
    defaultHeaders['Authorization'] = `Bearer ${TEST_JWT}`;
  }
  
  // Merge with custom headers
  const mergedHeaders = { ...defaultHeaders, ...headers };
  
  const requestInit = {
    method,
    headers: new Headers(mergedHeaders)
  } as any; // Cast to any to avoid type issues with NextRequest
  
  if (body) {
    requestInit.body = JSON.stringify(body);
  }
  
  const req = new NextRequest(url, requestInit);
  const context = { params };
  
  return { req, context };
}

/**
 * Executes a route handler with the given context
 * @param handler Route handler function
 * @param method HTTP method
 * @param pathname URL path
 * @param params Route parameters
 * @param body Request body (optional)
 * @param headers Request headers (optional)
 */
export async function executeRouteHandler(
  handler: RouteHandler,
  method: string, 
  pathname: string, 
  params: Record<string, string> = {}, 
  body?: any,
  headers?: Record<string, string>,
  withAuth: boolean = true
) {
  const { req, context } = createRouteHandlerContext(method, pathname, params, body, headers, withAuth);
  
  return await handler(req, context);
}

/**
 * Parses the response body as JSON
 * @param response Response object
 */
export async function parseResponseJson<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse response JSON: ${text}`);
  }
}
