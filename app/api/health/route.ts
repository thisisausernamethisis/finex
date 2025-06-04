import { NextRequest, NextResponse } from 'next/server';
import { ProductionMonitoringService } from '../../../lib/services/productionMonitoringService';
import { logger } from '../../../lib/logger';

// Create a route-specific logger
const routeLogger = logger.child({ route: 'GET /api/health' });

/**
 * GET /api/health
 * Comprehensive system health check and monitoring endpoint
 * 
 * Query Parameters:
 * - detailed: boolean (default: false) - include detailed diagnostics
 * - format: 'json' | 'summary' (default: 'json')
 * 
 * Response:
 * - 200: System is operational
 * - 503: System has issues
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    routeLogger.info('Health check request received');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const format = searchParams.get('format') || 'json';
    
    // Basic health check for non-detailed requests
    if (!detailed) {
      const basicHealth = {
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - (Date.now() - 3600000), // Mock 1 hour uptime
        version: process.env.APP_VERSION || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        responseTime: Date.now() - startTime
      };
      
      routeLogger.info('Basic health check completed', {
        responseTime: basicHealth.responseTime
      });
      
      return NextResponse.json(basicHealth);
    }
    
    // Detailed health check
    const systemDiagnostics = await ProductionMonitoringService.performHealthCheck();
    
    // Determine HTTP status based on overall health
    const httpStatus = getHTTPStatusFromHealth(systemDiagnostics.healthChecks);
    
    // Format response based on requested format
    let response;
    if (format === 'summary') {
      response = {
        status: determineOverallStatus(systemDiagnostics.healthChecks),
        timestamp: new Date().toISOString(),
        uptime: systemDiagnostics.uptime,
        services: systemDiagnostics.healthChecks.map(hc => ({
          name: hc.service,
          status: hc.status,
          responseTime: hc.responseTime
        })),
        performance: {
          requestsPerMinute: systemDiagnostics.performance.requestsPerMinute,
          averageResponseTime: systemDiagnostics.performance.averageResponseTime,
          errorRate: systemDiagnostics.performance.errorRate
        },
        errors: {
          total24h: systemDiagnostics.errors.total24h,
          critical: systemDiagnostics.errors.critical
        }
      };
    } else {
      response = {
        ...systemDiagnostics,
        timestamp: new Date().toISOString(),
        healthCheckTime: Date.now() - startTime
      };
    }
    
    const totalTime = Date.now() - startTime;
    routeLogger.info('Detailed health check completed', {
      overallStatus: determineOverallStatus(systemDiagnostics.healthChecks),
      healthyServices: systemDiagnostics.healthChecks.filter(hc => hc.status === 'HEALTHY').length,
      totalServices: systemDiagnostics.healthChecks.length,
      responseTime: totalTime
    });
    
    return NextResponse.json(response, { status: httpStatus });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Health check failed';
    const totalTime = Date.now() - startTime;
    
    routeLogger.error('Health check failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: totalTime
    });
    
    return NextResponse.json({
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      responseTime: totalTime
    }, { status: 503 });
  }
}

/**
 * POST /api/health/report
 * Generate detailed performance report
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    routeLogger.info('Performance report request received');
    
    // Parse request body for custom report parameters
    const body = await request.json();
    const {
      includeAPIStats = true,
      includeRecommendations = true,
      timeframe = '1h'
    } = body;
    
    // Generate comprehensive performance report
    const performanceReport = await ProductionMonitoringService.generatePerformanceReport();
    
    // Add custom parameters to report
    const customReport = {
      ...performanceReport,
      requestParameters: {
        includeAPIStats,
        includeRecommendations,
        timeframe
      },
      generationTime: Date.now() - startTime
    };
    
    const totalTime = Date.now() - startTime;
    routeLogger.info('Performance report generated', {
      systemStatus: performanceReport.systemStatus,
      generationTime: totalTime,
      reportSize: JSON.stringify(customReport).length
    });
    
    return NextResponse.json(customReport);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Report generation failed';
    const totalTime = Date.now() - startTime;
    
    routeLogger.error('Performance report generation failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: totalTime
    });
    
    return NextResponse.json({
      error: 'Report generation failed',
      details: errorMessage,
      timestamp: new Date().toISOString(),
      responseTime: totalTime
    }, { status: 500 });
  }
}

// Helper methods
function getHTTPStatusFromHealth(healthChecks: any[]): number {
  const unhealthyCount = healthChecks.filter(hc => hc.status === 'UNHEALTHY').length;
  const degradedCount = healthChecks.filter(hc => hc.status === 'DEGRADED').length;
  
  if (unhealthyCount > 0) return 503; // Service Unavailable
  if (degradedCount > 0) return 200;  // OK but with warnings
  return 200; // OK
}

function determineOverallStatus(healthChecks: any[]): 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' {
  const unhealthyCount = healthChecks.filter(hc => hc.status === 'UNHEALTHY').length;
  const degradedCount = healthChecks.filter(hc => hc.status === 'DEGRADED').length;
  
  if (unhealthyCount > 0) return 'UNHEALTHY';
  if (degradedCount > 0) return 'DEGRADED';
  return 'HEALTHY';
} 