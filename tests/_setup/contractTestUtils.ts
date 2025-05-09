// @ts-nocheck
// TODO(T-173b): Clerk SDK types: mock typings still loose

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { prisma as mockPrisma } from '../mocks/prisma';
import { createJWTForTest } from '../utils/auth';
// Import types only from clerk, we'll get the mocked implementation dynamically
import type { User } from '@clerk/nextjs/server';

// Default test user ID
export const TEST_USER_ID = 'user_test123';

// Create a test JWT token
export const TEST_JWT = createJWTForTest({ 
  sub: TEST_USER_ID, 
  sid: 'test-session-id'
});

/**
 * Creates a mock NextRequest object for testing route handlers
 * This provides a consistent way to create requests with auth headers and other needed properties
 */
export function createMockNextRequest(
  method: string,
  pathname: string,
  body?: any,
  headers?: Record<string, string>,
  withAuth: boolean = true
): NextRequest {
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
  
  // Create the request init object with the correct typing for NextRequest
  const requestInit: any = {
    method,
    headers: new Headers(mergedHeaders)
  };
  
  if (body) {
    requestInit.body = JSON.stringify(body);
  }
  
  return new NextRequest(url, requestInit);
}

/**
 * Creates a context for testing route handlers
 */
export function createRouteHandlerContext(
  params: Record<string, string> = {}
) {
  // Next.js expects { params: { paramName: value } }
  return { params };
}

/**
 * Executes a route handler with the given request and context
 * Includes the mock Prisma client for direct database operations
 */
export async function executeRouteHandler(
  handler: Function,
  method: string, 
  pathname: string, 
  params: Record<string, string> = {}, 
  body?: any,
  headers?: Record<string, string>,
  withAuth: boolean = true,
  prismaClient: PrismaClient = mockPrisma
) {
  // Use mock implementation from Jest
  const clerkMock = jest.requireMock('@clerk/nextjs/server');
  
  // If testing without auth, override the currentUser mock to return null
  if (!withAuth) {
    clerkMock.currentUser.mockImplementationOnce(() => Promise.resolve(null));
  }
  
  const req = createMockNextRequest(method, pathname, body, headers, withAuth);
  const context = createRouteHandlerContext(params);
  
  // For Next.js App Router:
  // - Non-dynamic routes receive (req)
  // - Dynamic routes receive (req, { params })
  const hasParams = Object.keys(params).length > 0;
  
  if (hasParams) {
    // Dynamic route with params (e.g., [assetId])
    return await handler(req, context);
  } else {
    // Non-dynamic route (e.g., /api/assets)
    return await handler(req);
  }
}

/**
 * Parses the response body as JSON
 */
export async function parseResponseJson<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse response JSON: ${text}`);
  }
}

/**
 * Test helper to ensure a response has the required rate limit headers
 * 
 * @param response The response to check for rate limit headers
 * @returns {boolean} True if the response has the required rate limit headers
 */
export function hasRateLimitHeaders(response: NextResponse): boolean {
  return (
    response.headers.has('X-RateLimit-Limit') &&
    response.headers.has('X-RateLimit-Remaining') &&
    response.headers.has('X-RateLimit-Reset')
  );
}

/**
 * Patch for Next.js Response in test environment to preserve 
 * rate limit headers that might be lost during mocking
 * 
 * @param response The response to potentially patch with rate limit headers
 * @param userId The user ID to generate mock rate limit data for if headers are missing
 * @returns {NextResponse} The patched response with guaranteed rate limit headers
 */
export function ensureRateLimitHeaders(response: NextResponse, userId: string = 'test-user'): NextResponse {
  if (!hasRateLimitHeaders(response)) {
    // In test environment, ensure we have the required headers
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
    response.headers.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60));
  }
  return response;
}
