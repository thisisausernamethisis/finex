import { Counter, Gauge, register } from 'prom-client';
import { logger } from '../logger';

// Initialize metrics
try {
  // Clear all metrics (in case of hot reload)
  register.clear();

  logger.info('Initializing Prometheus metrics');
  
} catch (error) {
  logger.error('Failed to initialize metrics', { 
    error: error instanceof Error ? error.message : 'Unknown error' 
  });
}

// Export register for metrics endpoint
export { register };

// Job processing metrics
export const jobsProcessed = new Counter({
  name: 'finex_jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['type'] as const
});

export const jobsFailed = new Counter({
  name: 'finex_jobs_failed_total',
  help: 'Total number of jobs that failed',
  labelNames: ['type', 'error_type'] as const
});

export const jobsEnqueued = new Counter({
  name: 'finex_jobs_enqueued_total',
  help: 'Total number of jobs enqueued',
  labelNames: ['type'] as const
});

// Queue metrics
export const jobsActive = new Gauge({
  name: 'finex_jobs_active',
  help: 'Number of jobs currently active',
  labelNames: ['queue'] as const
});

export const jobsWaiting = new Gauge({
  name: 'finex_jobs_waiting',
  help: 'Number of jobs currently waiting in queue',
  labelNames: ['queue'] as const
});

// API metrics
export const httpRequestsTotal = new Counter({
  name: 'finex_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'] as const
});

export const httpRequestDuration = new Gauge({
  name: 'finex_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path'] as const
});

// Search metrics
export const searchQueriesTotal = new Counter({
  name: 'finex_search_queries_total',
  help: 'Total number of search queries',
  labelNames: ['type'] as const
});

export const searchLatency = new Gauge({
  name: 'finex_search_latency_seconds',
  help: 'Search query latency in seconds',
  labelNames: ['type'] as const
});

// Token usage metrics
export const tokenUsageTotal = new Counter({
  name: 'finex_llm_token_usage_total',
  help: 'Total number of tokens used',
  labelNames: ['model', 'operation'] as const
});
