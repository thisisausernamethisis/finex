import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '../logger';
import { Logger } from 'winston';

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
 * Create a 400 Bad Request response with standardized format
 * 
 * @param errorOrMessage - Either a ZodError to format, or an error message
 * @param details - Optional details array when providing a message
 * @param routeLogger - Optional logger instance to log the error
 * @returns A NextResponse with 400 status and formatted error
 */
export function badRequest(
  errorOrMessage: ZodError | string,
  details?: string[] | Logger,
  routeLogger = logger
) {
  // Handle the case where details is actually the logger
  if (details && !Array.isArray(details) && 'warn' in details && 'error' in details) {
    routeLogger = details as Logger;
    details = undefined;
  }
  
  let responseBody: any;
  
  if (typeof errorOrMessage === 'string') {
    responseBody = {
      error: errorOrMessage,
      details: Array.isArray(details) ? details : undefined
    };
    routeLogger.warn('Bad request', { error: errorOrMessage, details });
  } else {
    responseBody = formatZodError(errorOrMessage);
    routeLogger.warn('Validation error', { error: responseBody });
  }
  
  return NextResponse.json(responseBody, { status: 400 });
}

/**
 * Create a 403 Forbidden response
 * 
 * @param message - Optional custom message
 * @param routeLogger - Optional logger instance to log the error
 * @returns A NextResponse with 403 status and error
 */
export function forbidden(message = 'Forbidden', routeLogger = logger) {
  routeLogger.warn('Access forbidden');
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Create a 404 Not Found response
 * 
 * @param message - Optional custom message
 * @param routeLogger - Optional logger instance to log the error
 * @returns A NextResponse with 404 status and error
 */
export function notFound(message = 'Not found', routeLogger = logger) {
  routeLogger.info('Resource not found');
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Create a 500 Internal Server Error response
 * 
 * @param error - The error that occurred
 * @param routeLogger - Optional logger instance to log the error
 * @returns A NextResponse with 500 status and error
 */
export function serverError(error: Error, routeLogger = logger) {
  routeLogger.error('Internal server error', { error: error.message, stack: error.stack });
  return NextResponse.json(
    { error: 'Internal server error' }, 
    { status: 500 }
  );
}

/**
 * Create a 401 Unauthorized response
 * 
 * @param message - Optional custom message
 * @param routeLogger - Optional logger instance to log the error
 * @returns A NextResponse with 401 status and error
 */
export function unauthorized(message = 'Unauthorized', routeLogger = logger) {
  routeLogger.warn('Unauthorized access attempt');
  return NextResponse.json({ error: message }, { status: 401 });
}
