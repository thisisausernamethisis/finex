import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '../logger';
import { Logger } from 'winston';
import { AuthMonitor } from '../monitoring/authMonitor';

/**
 * Format ZodError for consistent API error responses
 * 
 * @param error - The ZodError to format 
 * @returns A formatted error object that matches the API contract
 */
export function formatZodError(error: ZodError) {
  return {
    error: 'ValidationError',
    details: error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }))
  };
}

/**
 * Create a 400 Bad Request response
 * 
 * @param error - Zod validation error or custom message
 * @param routeLogger - Optional logger instance to log the error
 * @returns A NextResponse with 400 status and validation error details
 */
export function badRequest(error: any, routeLogger = logger) {
  let message = 'Bad Request';
  let details: any[] = [];

  if (error?.issues) {
    // Zod validation error
    message = 'Validation Error';
    details = error.issues.map((issue: any) => ({
      field: issue.path?.join('.') || 'unknown',
      message: issue.message,
    }));
  } else if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = error.message;
  }

  routeLogger.warn('Bad request', { message, details });
  
  return NextResponse.json(
    { 
      error: 'ValidationError', 
      message,
      ...(details.length > 0 && { details })
    },
    { status: 400 }
  );
}

/**
 * Create a 403 Forbidden response with auth monitoring
 * 
 * @param message - Optional custom message
 * @param routeLogger - Optional logger instance to log the error
 * @param authContext - Optional authentication context for monitoring
 * @returns A NextResponse with 403 status and error
 */
export function forbidden(
  message = 'Forbidden', 
  routeLogger = logger,
  authContext?: { userId?: string; route?: string; requiredPermission?: string }
) {
  routeLogger.warn('Access forbidden', { message, ...authContext });
  
  // Log permission denied event if we have auth context
  if (authContext?.userId && authContext?.route && authContext?.requiredPermission) {
    AuthMonitor.logPermissionDenied(
      authContext.userId,
      authContext.route,
      authContext.requiredPermission
    );
  }
  
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Create a 404 Not Found response
 * 
 * @param message - Optional custom message
 * @param routeLogger - Optional logger instance to log the error
 * @returns A NextResponse with 404 status and error
 */
export function notFound(message = 'Not Found', routeLogger = logger) {
  routeLogger.warn('Resource not found', { message });
  return NextResponse.json({ error: 'NotFoundError', message }, { status: 404 });
}

/**
 * Create a 500 Internal Server Error response
 * 
 * @param error - Error object or message
 * @param routeLogger - Optional logger instance to log the error
 * @returns A NextResponse with 500 status and error message
 */
export function serverError(error: Error | string, routeLogger = logger) {
  const message = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;
  
  routeLogger.error('Server error', { message, stack });
  
  return NextResponse.json(
    { error: 'ServerError', message: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Create a 401 Unauthorized response with auth monitoring
 * 
 * @param message - Optional custom message
 * @param routeLogger - Optional logger instance to log the error
 * @param authContext - Optional authentication context for monitoring
 * @returns A NextResponse with 401 status and error
 */
export function unauthorized(
  message = 'Unauthorized', 
  routeLogger = logger,
  authContext?: { route?: string; method?: string }
) {
  routeLogger.warn('Unauthorized access attempt', { message, ...authContext });
  
  // Log unauthorized access attempt
  if (authContext?.route) {
    AuthMonitor.logUnauthorizedAccess(authContext.route, {
      route: authContext.route,
      method: authContext.method
    });
  }
  
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create a success response with optional auth event logging
 * 
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @param authContext - Optional context for auth event logging
 * @returns A NextResponse with success data
 */
export function success<T>(
  data: T, 
  status = 200,
  authContext?: { userId?: string; route?: string; action?: string }
) {
  // Log successful authenticated operations for audit trail
  if (authContext?.userId && authContext?.route && authContext?.action) {
    AuthMonitor.logEvent(
      'auth:operation_success' as any, // Custom event type
      {
        userId: authContext.userId,
        route: authContext.route,
        metadata: { action: authContext.action }
      }
    );
  }
  
  return NextResponse.json(data, { status });
}
