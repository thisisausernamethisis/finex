import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface ErrorHandlerOptions {
  title?: string;
  description?: string;
  showToast?: boolean;
  logError?: boolean;
  context?: string;
}

export interface StandardError extends Error {
  status?: number;
  code?: string;
  context?: string;
}

/**
 * Custom hook for standardized error handling across the application
 */
export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((
    error: Error | StandardError,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      title,
      description,
      showToast = true,
      logError = true,
      context
    } = options;

    // Log error for debugging
    if (logError) {
      const errorContext = context || (error as StandardError).context || 'Unknown';
      console.error(`[${errorContext}] Error:`, error);
    }

    // Determine error message based on error type
    const getErrorMessage = (err: Error | StandardError): string => {
      // Network errors
      if (err.message.includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
      }

      // API errors with status codes
      if ('status' in err && err.status) {
        switch (err.status) {
          case 400:
            return 'Invalid request. Please check your input and try again.';
          case 401:
            return 'Authentication required. Please sign in and try again.';
          case 403:
            return 'Access denied. You do not have permission to perform this action.';
          case 404:
            return 'Resource not found. The requested item may have been deleted.';
          case 409:
            return 'Conflict detected. The resource may have been modified by another user.';
          case 429:
            return 'Too many requests. Please wait a moment and try again.';
          case 500:
            return 'Server error. Please try again later.';
          case 503:
            return 'Service temporarily unavailable. Please try again later.';
          default:
            return err.message || 'An unexpected error occurred.';
        }
      }

      // Validation errors
      if (err.message.toLowerCase().includes('validation')) {
        return err.message;
      }

      // Generic fallback
      return err.message || 'An unexpected error occurred. Please try again.';
    };

    // Show toast notification
    if (showToast) {
      toast({
        title: title || 'Error',
        description: description || getErrorMessage(error),
        variant: 'destructive',
      });
    }

    // TODO: Send to error reporting service in production
    // Example: reportError(error, { context, userAgent: navigator.userAgent });

    return {
      message: getErrorMessage(error),
      status: (error as StandardError).status,
      code: (error as StandardError).code
    };
  }, [toast]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, options);
      return null;
    }
  }, [handleError]);

  const createErrorFromResponse = useCallback(async (
    response: Response,
    context?: string
  ): Promise<StandardError> => {
    let message = `Request failed with status ${response.status}`;
    let errorData: any = {};

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
        message = errorData.message || errorData.error || message;
      } else {
        message = await response.text() || message;
      }
    } catch {
      // If parsing fails, use default message
    }

    const error = new Error(message) as StandardError;
    error.status = response.status;
    error.code = errorData.code;
    error.context = context;

    return error;
  }, []);

  return {
    handleError,
    handleAsyncError,
    createErrorFromResponse
  };
}

// Utility function for API error handling
export async function handleApiResponse<T>(
  response: Response,
  context?: string
): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let errorData: any = {};

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
        message = errorData.message || errorData.error || message;
      } else {
        message = await response.text() || message;
      }
    } catch {
      // If parsing fails, use default message
    }

    const error = new Error(message) as StandardError;
    error.status = response.status;
    error.code = errorData.code;
    error.context = context;

    throw error;
  }

  return response.json();
}