import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { logger } from '../logger';
import { badRequest, notFound } from './http';

// Read from env with fallbacks
export const DEFAULT_PAGE_SIZE = parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10);
export const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE || '50', 10);

/**
 * Validate that a string is a valid CUID and the resource exists
 * 
 * @param id - The ID to validate
 * @param existsCheck - Function that checks if the resource exists
 * @param resourceName - Name of the resource for error messages
 * @param logger - Logger instance
 * @returns Object with validation result and error response if validation failed
 */
export async function validateCuid(
  id: string,
  existsCheck: (id: string) => Promise<boolean>,
  resourceName: string = 'Resource',
  routeLogger = logger
): Promise<{ valid: boolean; error?: NextResponse }> {
  // Validate ID format
  const idParse = z.string().cuid().safeParse(id);
  if (!idParse.success) {
    return { 
      valid: false, 
      error: badRequest(idParse.error, routeLogger)
    };
  }
  
  // Check if resource exists
  const exists = await existsCheck(id);
  if (!exists) {
    return { 
      valid: false, 
      error: notFound(`${resourceName} not found`, routeLogger)
    };
  }
  
  return { valid: true };
}

/**
 * Wrap repository function with standardized pagination
 * 
 * @param params - Query parameters containing page and limit
 * @param repoFn - Repository function that fetches paginated data
 * @returns Paginated result or error response
 */
export async function withPagination<T>(
  params: { page?: string | null; limit?: string | null; search?: string | null },
  repoFn: (page: number, limit: number, search?: string) => Promise<{ items: T[]; total: number }>,
  routeLogger = logger
): Promise<{ 
  result?: { items: T[]; total: number; hasMore: boolean }; 
  error?: NextResponse 
}> {
  const page = parseInt(params.page || '1', 10);
  const requestedLimit = parseInt(params.limit || DEFAULT_PAGE_SIZE.toString(), 10);
  const search = params.search || undefined;
  
  // If requested limit exceeds MAX_PAGE_SIZE, return 400 with Retry-After header
  if (requestedLimit > MAX_PAGE_SIZE) {
    routeLogger.warn('Requested page size exceeds maximum', { 
      requestedLimit, 
      maxPageSize: MAX_PAGE_SIZE 
    });
    
    const response = NextResponse.json(
      { 
        error: 'ValidationError',
        details: [{
          path: 'limit',
          message: `Page size exceeds maximum allowed (${MAX_PAGE_SIZE})`
        }]
      },
      { status: 400 }
    );
    
    // Add Retry-After header to provide client with throttling guidance
    response.headers.set('Retry-After', '60');
    return { error: response };
  }
  
  const limit = requestedLimit;
  
  try {
    const result = await repoFn(page, limit, search);
    const offset = (page - 1) * limit;
    
    return { 
      result: {
        items: result.items,
        total: result.total,
        hasMore: offset + result.items.length < result.total
      }
    };
  } catch (error) {
    routeLogger.error('Error fetching paginated data', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      page,
      limit,
      search
    });
    throw error;
  }
}

/**
 * Normalize a search term by trimming and handling empty strings
 * 
 * @param search - The search term to normalize
 * @returns Normalized search term or undefined if empty
 */
export function normalizeSearchTerm(search?: string | null): string | undefined {
  if (!search) return undefined;
  
  const trimmed = search.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Format query options from request URL
 * 
 * @param url - The request URL containing query parameters
 * @returns Formatted query options
 */
export function getQueryOptions(url: URL): {
  page: string | null;
  limit: string | null;
  search: string | null;
} {
  return {
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
    search: url.searchParams.get('search')
  };
}

/**
 * Validate a schema using zod and return a standardized response
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param routeLogger - Logger instance
 * @returns Validation result object
 */
export function validateSchema<T extends object>(
  schema: z.ZodType<T>,
  data: unknown,
  routeLogger = logger
): { 
  success: boolean; 
  data: T; 
  error?: NextResponse 
} {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return { 
      success: false,
      data: {} as T, // Empty object to satisfy the TypeScript requirement
      error: badRequest(result.error, routeLogger)
    };
  }
  
  return { success: true, data: result.data };
}
