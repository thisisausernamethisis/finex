import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';
import { logger } from '../../../lib/logger';
import { register } from '../../../lib/metrics';

const routeLogger = logger.child({ route: '/api/metrics' });

/**
 * Prometheus metrics endpoint
 * 
 * This endpoint exposes all registered metrics for Prometheus scraping.
 * It's protected by either:
 * 1. An authorization token (if METRICS_AUTH_TOKEN is set)
 * 2. Only available in non-production environments (if METRICS_ALLOW_ENV is set)
 */
export async function GET(request: Request) {
  const headersList = headers();
  const authHeader = headersList.get('authorization');
  const metricsAuthToken = process.env.METRICS_AUTH_TOKEN;
  const metricsAllowEnv = process.env.METRICS_ALLOW_ENV;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Determine if access is allowed based on configuration
  let accessAllowed = false;
  
  // If metrics auth token is set, require it
  if (metricsAuthToken) {
    if (authHeader === `Bearer ${metricsAuthToken}`) {
      accessAllowed = true;
    }
  } 
  // If metrics allow env is set, check if current env is in the allowed list
  else if (metricsAllowEnv) {
    const allowedEnvs = metricsAllowEnv.split(',').map(env => env.trim());
    if (allowedEnvs.includes(nodeEnv)) {
      accessAllowed = true;
    }
  } 
  // If authenticated as an admin user (fallback if no other auth methods are configured)
  else {
    try {
      const user = await currentUser();
      if (user?.id) {
        // Note: In a real implementation, you would check if user has admin rights
        // For now, we'll assume any authenticated user can see metrics in development
        accessAllowed = nodeEnv === 'development';
      }
    } catch (error) {
      routeLogger.error('Auth error accessing metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (!accessAllowed) {
    routeLogger.warn('Unauthorized metrics access attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get metrics in Prometheus format
    const metrics = await register.metrics();
    
    routeLogger.debug('Metrics accessed successfully');
    
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType
      }
    });
  } catch (error) {
    routeLogger.error('Error generating metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return new NextResponse('Error generating metrics', { status: 500 });
  }
}
