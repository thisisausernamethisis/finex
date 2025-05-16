/**
 * Prometheus metrics for application monitoring
 * 
 * These counters, gauges, and histograms provide observability into 
 * the system's performance and behavior.
 */

import { Counter, Gauge, collectDefaultMetrics, Registry } from 'prom-client';

// Create a Registry instance to contain all metrics
export const register = new Registry();

// Enable default metrics collection (GC, memory usage, etc.)
collectDefaultMetrics({ register });

// Worker job metrics
export const jobsProcessed = new Counter({
  name: 'finex_jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['type'] as const,
  registers: [register]
});

export const jobsFailed = new Counter({
  name: 'finex_jobs_failed_total',
  help: 'Total number of jobs that failed',
  labelNames: ['type', 'error_type'] as const,
  registers: [register]
});

export const jobsActive = new Gauge({
  name: 'finex_jobs_active',
  help: 'Number of currently active jobs',
  labelNames: ['queue'] as const,
  registers: [register]
});

// Search metrics
export const searchQueriesTotal = new Counter({
  name: 'finex_search_queries_total',
  help: 'Total number of search queries executed',
  labelNames: ['type'] as const,
  registers: [register]
});

export const searchLatency = new Gauge({
  name: 'finex_search_latency_seconds',
  help: 'Latency of search queries in seconds',
  labelNames: ['type'] as const,
  registers: [register]
});

// RAG Cache metrics
export const ragCacheHits = new Counter({
  name: 'finex_rag_cache_hits_total',
  help: 'Total number of RAG cache hits',
  labelNames: ['type'] as const,
  registers: [register]
});

export const ragCacheMisses = new Counter({
  name: 'finex_rag_cache_misses_total',
  help: 'Total number of RAG cache misses',
  labelNames: ['type'] as const,
  registers: [register]
});

export const ragCacheLatency = new Gauge({
  name: 'finex_rag_cache_latency_seconds',
  help: 'Latency of RAG cache operations in seconds',
  labelNames: ['operation'] as const,
  registers: [register]
});

// API metrics
export const apiRequestsTotal = new Counter({
  name: 'finex_api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'path', 'status'] as const,
  registers: [register]
});

export const apiRequestDuration = new Gauge({
  name: 'finex_api_request_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['method', 'path'] as const,
  registers: [register]
});

// Database metrics
export const dbQueriesTotal = new Counter({
  name: 'finex_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation'] as const,
  registers: [register]
});

export const dbQueryDuration = new Gauge({
  name: 'finex_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'] as const,
  registers: [register]
});

// Helper object with factory methods to create metrics
export const metrics = {
  buildCounter: (options: any) => new Counter({
    ...options,
    registers: [register]
  }),
  buildGauge: (options: any) => new Gauge({
    ...options,
    registers: [register]
  })
};

export {
  alphaCacheSize,
  alphaCacheHits,
  alphaCacheMisses,
} from './alphaCache';
