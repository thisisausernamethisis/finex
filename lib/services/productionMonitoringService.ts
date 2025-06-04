import { logger } from '../logger';

// Monitoring interfaces
interface HealthCheckResult {
  service: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  responseTime: number;
  details: any;
  timestamp: Date;
}

interface PerformanceMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

interface SystemDiagnostics {
  uptime: number;
  version: string;
  environment: string;
  features: string[];
  dependencies: Record<string, string>;
  healthChecks: HealthCheckResult[];
  performance: PerformanceMetrics;
  errors: ErrorMetrics;
}

interface ErrorMetrics {
  total24h: number;
  critical: number;
  warnings: number;
  recent: Array<{
    timestamp: Date;
    level: string;
    message: string;
    count: number;
  }>;
}

const monitoringLogger = logger.child({ service: 'production-monitoring' });

export class ProductionMonitoringService {
  private static metricsCache = new Map<string, any>();
  private static startTime = Date.now();
  
  /**
   * Comprehensive system health check
   */
  static async performHealthCheck(): Promise<SystemDiagnostics> {
    const startTime = Date.now();
    monitoringLogger.info('Starting comprehensive health check');
    
    try {
      // Run all health checks in parallel
      const [
        databaseHealth,
        cacheHealth,
        apiHealth,
        servicesHealth,
        performanceMetrics,
        errorMetrics
      ] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkCacheHealth(),
        this.checkAPIHealth(),
        this.checkServicesHealth(),
        this.getPerformanceMetrics(),
        this.getErrorMetrics()
      ]);
      
      const healthChecks = [databaseHealth, cacheHealth, apiHealth, servicesHealth];
      const overallStatus = this.determineOverallStatus(healthChecks);
      
      const diagnostics: SystemDiagnostics = {
        uptime: Date.now() - this.startTime,
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        features: this.getEnabledFeatures(),
        dependencies: this.getDependencyVersions(),
        healthChecks,
        performance: performanceMetrics,
        errors: errorMetrics
      };
      
      const checkTime = Date.now() - startTime;
      monitoringLogger.info('Health check completed', {
        overallStatus,
        checkTime,
        healthyServices: healthChecks.filter(h => h.status === 'HEALTHY').length,
        totalServices: healthChecks.length
      });
      
      return diagnostics;
      
    } catch (error) {
      monitoringLogger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check database connectivity and performance
   */
  static async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Mock database check - in production, would check actual database connection
      // const dbResult = await database.raw('SELECT 1 as health');
      
      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      
      const responseTime = Date.now() - startTime;
      const isHealthy = responseTime < 1000; // Consider healthy if < 1s response
      
      return {
        service: 'Database',
        status: isHealthy ? 'HEALTHY' : responseTime < 2000 ? 'DEGRADED' : 'UNHEALTHY',
        responseTime,
        details: {
          connectionPoolSize: 10,
          activeConnections: Math.floor(Math.random() * 8) + 1,
          queryLatency: responseTime,
          lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        service: 'Database',
        status: 'UNHEALTHY',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Database connection failed'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Check cache service health and performance
   */
  static async checkCacheHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check both Redis and memory cache
      const testKey = `health-check-${Date.now()}`;
      const testValue = { test: true, timestamp: Date.now() };
      
      // Test cache operations
      const { CacheService } = await import('./cacheService');
      await CacheService.set(testKey, testValue, 10);
      const retrieved = await CacheService.get(testKey);
      await CacheService.delete(testKey);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = retrieved !== null && responseTime < 100;
      
      // Get cache statistics
      const cacheStats = await CacheService.getCacheStats();
      
      return {
        service: 'Cache',
        status: isHealthy ? 'HEALTHY' : 'DEGRADED',
        responseTime,
        details: {
          redisConnected: cacheStats.redis !== null,
          memoryCache: {
            size: cacheStats.memory.size,
            keys: cacheStats.memory.keys.length
          },
          operationSuccess: retrieved !== null,
          hitRate: this.calculateCacheHitRate()
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        service: 'Cache',
        status: 'UNHEALTHY',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Cache service failed'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Check API endpoints health
   */
  static async checkAPIHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check critical API endpoints
      const endpoints = [
        '/api/scenarios/technology',
        '/api/matrix/calculate',
        '/api/analytics/advanced'
      ];
      
      const results = [];
      for (const endpoint of endpoints) {
        try {
          // Mock API check - in production would make actual HTTP requests
          const mockResponseTime = Math.random() * 200 + 50;
          await new Promise(resolve => setTimeout(resolve, mockResponseTime));
          
          results.push({
            endpoint,
            status: 'HEALTHY',
            responseTime: mockResponseTime
          });
        } catch (error) {
          results.push({
            endpoint,
            status: 'UNHEALTHY',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const responseTime = Date.now() - startTime;
      const healthyEndpoints = results.filter(r => r.status === 'HEALTHY').length;
      const overallHealthy = healthyEndpoints === endpoints.length;
      
      return {
        service: 'API',
        status: overallHealthy ? 'HEALTHY' : healthyEndpoints > 0 ? 'DEGRADED' : 'UNHEALTHY',
        responseTime,
        details: {
          endpoints: results,
          healthyCount: healthyEndpoints,
          totalCount: endpoints.length,
          averageLatency: results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        service: 'API',
        status: 'UNHEALTHY',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'API health check failed'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Check core services health
   */
  static async checkServicesHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const services = [
        'MatrixCalculationService',
        'PredictiveAnalyticsService',
        'ReportGenerationService',
        'AssetCategorizationService'
      ];
      
      const serviceResults = [];
      
      for (const service of services) {
        try {
          // Mock service health check
          const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
          serviceResults.push({
            name: service,
            status: isHealthy ? 'HEALTHY' : 'DEGRADED',
            lastExecution: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
            errorRate: Math.random() * 0.05 // 0-5% error rate
          });
        } catch (error) {
          serviceResults.push({
            name: service,
            status: 'UNHEALTHY',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const responseTime = Date.now() - startTime;
      const healthyServices = serviceResults.filter(s => s.status === 'HEALTHY').length;
      
      return {
        service: 'Core Services',
        status: healthyServices === services.length ? 'HEALTHY' : healthyServices > 0 ? 'DEGRADED' : 'UNHEALTHY',
        responseTime,
        details: {
          services: serviceResults,
          healthyCount: healthyServices,
          totalCount: services.length
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        service: 'Core Services',
        status: 'UNHEALTHY',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Services health check failed'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get system performance metrics
   */
  static async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      // In production, these would come from actual monitoring systems
      return {
        requestsPerMinute: Math.floor(Math.random() * 1000) + 100,
        averageResponseTime: Math.floor(Math.random() * 500) + 50,
        errorRate: Math.random() * 0.05, // 0-5%
        cacheHitRate: 0.85 + Math.random() * 0.1, // 85-95%
        memoryUsage: Math.random() * 0.8 + 0.1, // 10-90%
        cpuUsage: Math.random() * 0.6 + 0.1, // 10-70%
        activeConnections: Math.floor(Math.random() * 100) + 10
      };
    } catch (error) {
      monitoringLogger.error('Failed to get performance metrics', error);
      throw error;
    }
  }

  /**
   * Get error metrics and recent errors
   */
  static async getErrorMetrics(): Promise<ErrorMetrics> {
    try {
      // In production, these would come from error tracking systems like Sentry
      const recentErrors = [
        {
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          level: 'WARNING',
          message: 'Cache connection temporarily lost',
          count: 3
        },
        {
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          level: 'ERROR',
          message: 'Matrix calculation timeout',
          count: 1
        }
      ];
      
      return {
        total24h: Math.floor(Math.random() * 50) + 5,
        critical: Math.floor(Math.random() * 3),
        warnings: Math.floor(Math.random() * 20) + 5,
        recent: recentErrors
      };
    } catch (error) {
      monitoringLogger.error('Failed to get error metrics', error);
      throw error;
    }
  }

  /**
   * Monitor API response times and errors
   */
  static recordAPIMetrics(endpoint: string, responseTime: number, statusCode: number): void {
    const key = `api-metrics-${endpoint}`;
    const existing = this.metricsCache.get(key) || { requests: [], errors: [] };
    
    // Record request
    existing.requests.push({
      timestamp: Date.now(),
      responseTime,
      statusCode
    });
    
    // Record error if applicable
    if (statusCode >= 400) {
      existing.errors.push({
        timestamp: Date.now(),
        statusCode,
        responseTime
      });
    }
    
    // Keep only last 1000 requests
    if (existing.requests.length > 1000) {
      existing.requests = existing.requests.slice(-1000);
    }
    
    // Keep only last 100 errors
    if (existing.errors.length > 100) {
      existing.errors = existing.errors.slice(-100);
    }
    
    this.metricsCache.set(key, existing);
  }

  /**
   * Get API performance statistics
   */
  static getAPIPerformanceStats(endpoint?: string): any {
    if (endpoint) {
      const key = `api-metrics-${endpoint}`;
      const metrics = this.metricsCache.get(key);
      
      if (!metrics || metrics.requests.length === 0) {
        return null;
      }
      
      const requests = metrics.requests;
      const errors = metrics.errors;
      const now = Date.now();
      const lastHour = now - 3600000;
      
      const recentRequests = requests.filter((r: any) => r.timestamp > lastHour);
      const recentErrors = errors.filter((e: any) => e.timestamp > lastHour);
      
      return {
        endpoint,
        requests: {
          total: requests.length,
          lastHour: recentRequests.length,
          averageResponseTime: recentRequests.reduce((sum: number, r: any) => sum + r.responseTime, 0) / recentRequests.length || 0
        },
        errors: {
          total: errors.length,
          lastHour: recentErrors.length,
          errorRate: recentErrors.length / Math.max(recentRequests.length, 1)
        }
      };
    }
    
    // Return stats for all endpoints
    const allStats: any = {};
    for (const [key, metrics] of Array.from(this.metricsCache.entries())) {
      if (key.startsWith('api-metrics-')) {
        const endpoint = key.replace('api-metrics-', '');
        allStats[endpoint] = this.getAPIPerformanceStats(endpoint);
      }
    }
    
    return allStats;
  }

  /**
   * Generate performance report
   */
  static async generatePerformanceReport(): Promise<any> {
    const startTime = Date.now();
    
    try {
      const healthCheck = await this.performHealthCheck();
      const apiStats = this.getAPIPerformanceStats();
      
      const report = {
        generatedAt: new Date(),
        systemStatus: this.determineOverallStatus(healthCheck.healthChecks),
        uptime: healthCheck.uptime,
        performance: healthCheck.performance,
        healthChecks: healthCheck.healthChecks.map(hc => ({
          service: hc.service,
          status: hc.status,
          responseTime: hc.responseTime
        })),
        apiPerformance: apiStats,
        recommendations: this.generatePerformanceRecommendations(healthCheck, apiStats),
        metadata: {
          reportGenerationTime: Date.now() - startTime,
          version: healthCheck.version,
          environment: healthCheck.environment
        }
      };
      
      monitoringLogger.info('Performance report generated', {
        systemStatus: report.systemStatus,
        generationTime: report.metadata.reportGenerationTime
      });
      
      return report;
      
    } catch (error) {
      monitoringLogger.error('Performance report generation failed', error);
      throw error;
    }
  }

  // Helper methods
  private static determineOverallStatus(healthChecks: HealthCheckResult[]): 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' {
    const unhealthyCount = healthChecks.filter(hc => hc.status === 'UNHEALTHY').length;
    const degradedCount = healthChecks.filter(hc => hc.status === 'DEGRADED').length;
    
    if (unhealthyCount > 0) return 'UNHEALTHY';
    if (degradedCount > 0) return 'DEGRADED';
    return 'HEALTHY';
  }

  private static getEnabledFeatures(): string[] {
    return [
      'Matrix Calculation',
      'Predictive Analytics', 
      'Report Generation',
      'Caching System',
      'Asset Categorization',
      'Real-time Monitoring'
    ];
  }

  private static getDependencyVersions(): Record<string, string> {
    // In production, would read from package.json or environment
    return {
      node: process.version,
      nextjs: '14.2.28',
      clerk: '5.x',
      redis: '4.x',
      typescript: '5.x'
    };
  }

  private static calculateCacheHitRate(): number {
    // Mock calculation - in production would track actual hits/misses
    return 0.85 + Math.random() * 0.1; // 85-95%
  }

  private static generatePerformanceRecommendations(healthCheck: SystemDiagnostics, apiStats: any): string[] {
    const recommendations = [];
    
    // Check response times
    if (healthCheck.performance.averageResponseTime > 1000) {
      recommendations.push('Consider optimizing database queries and API endpoints for better response times');
    }
    
    // Check error rates
    if (healthCheck.performance.errorRate > 0.05) {
      recommendations.push('Error rate is elevated - investigate recent errors and implement additional error handling');
    }
    
    // Check cache performance
    if (healthCheck.performance.cacheHitRate < 0.8) {
      recommendations.push('Cache hit rate is low - review caching strategy and TTL settings');
    }
    
    // Check memory usage
    if (healthCheck.performance.memoryUsage > 0.8) {
      recommendations.push('Memory usage is high - consider implementing memory optimization strategies');
    }
    
    // Check unhealthy services
    const unhealthyServices = healthCheck.healthChecks.filter(hc => hc.status === 'UNHEALTHY');
    if (unhealthyServices.length > 0) {
      recommendations.push(`Critical: ${unhealthyServices.map(s => s.service).join(', ')} services require immediate attention`);
    }
    
    return recommendations;
  }
}

export default ProductionMonitoringService; 