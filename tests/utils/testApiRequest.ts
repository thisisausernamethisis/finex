import { createJWTForTest } from './auth';

interface TestApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Test API request utility for contract tests
 * Makes direct requests to API endpoints with authentication
 */
export async function testApiRequest(
  url: string,
  options: TestApiRequestOptions = {}
): Promise<Response> {
  const {
    method = 'GET',
    headers = {},
    body
  } = options;

  const baseUrl = 'http://localhost:3000';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  // Add auth token if not provided
  if (!requestHeaders.Authorization) {
    requestHeaders.Authorization = `Bearer ${createJWTForTest({ sub: 'user_test123' })}`;
  }

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(fullUrl, requestInit);
    return response;
  } catch (error) {
    throw new Error(`Test API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 