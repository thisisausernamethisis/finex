/**
 * OpenTelemetry Integration Module
 * 
 * Configures and initializes OpenTelemetry for distributed tracing.
 * All instrumentation libraries are auto-loaded and configured.
 * 
 * Usage:
 * ```ts
 * import { initOtel } from './lib/otel';
 * 
 * // Initialize at application startup with:
 * if (process.env.ENABLE_OTEL === 'true') {
 *   initOtel();
 * }
 * ```
 */

// @ts-expect-error Missing type definitions
import { Resource } from '@opentelemetry/resources';
// @ts-expect-error Missing type definitions
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
// @ts-expect-error Missing type definitions
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
// @ts-expect-error Missing type definitions
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// @ts-expect-error Missing type definitions
import { NodeSDK } from '@opentelemetry/sdk-node';
// @ts-expect-error Missing type definitions
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { logger } from '../logger';

// Logger
const otelLogger = logger.child({ component: 'OpenTelemetry' });

// Environment variables
const serviceName = process.env.OTEL_SERVICE_NAME || 'finex-api';
const endpoint = process.env.OTEL_ENDPOINT || 'http://localhost:4317/v1/traces';
const environment = process.env.NODE_ENV || 'development';

// Initialize OpenTelemetry
let otelInitialized = false;
let otelSdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry with auto-instrumentation
 */
export function initOtel(): void {
  // Prevent double-initialization
  if (otelInitialized) {
    otelLogger.warn('OpenTelemetry already initialized');
    return;
  }

  try {
    otelLogger.info('Initializing OpenTelemetry', {
      serviceName,
      endpoint,
      environment
    });

    // Configure exporter
    const exporter = new OTLPTraceExporter({
      url: endpoint
    });

    // Create span processor with export batching
    const spanProcessor = new BatchSpanProcessor(exporter, {
      // Set batch size and scheduling details
      maxExportBatchSize: 50,
      scheduledDelayMillis: 1000
    });

    // Create resource with service info
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment
    });

    // Create and configure SDK with auto-instrumentation
    otelSdk = new NodeSDK({
      resource,
      spanProcessor,
      instrumentations: [
        // Auto-instrument HTTP/HTTPS modules
        new PrismaInstrumentation(),
        // Add more instrumentations as needed
      ]
    });

    // Start SDK
    otelSdk.start();
    otelInitialized = true;

    // Handle graceful shutdown
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        shutdownOtel()
          .then(() => process.exit(0))
          .catch(error => {
            otelLogger.error('Error shutting down OpenTelemetry', { error });
            process.exit(1);
          });
      });
    });

    otelLogger.info('OpenTelemetry initialization complete');
  } catch (error) {
    otelLogger.error('Failed to initialize OpenTelemetry', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

/**
 * Gracefully shut down OpenTelemetry
 */
export async function shutdownOtel(): Promise<void> {
  if (!otelSdk) {
    return;
  }

  try {
    otelLogger.info('Shutting down OpenTelemetry');
    await otelSdk.shutdown();
    otelLogger.info('OpenTelemetry shutdown complete');
  } catch (error) {
    otelLogger.error('Error shutting down OpenTelemetry', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get an active trace ID if available
 * Useful for correlating logs with traces
 */
export function getActiveTraceId(): string | undefined {
  // Use the active span context to get the trace ID if available
  try {
    const { trace } = require('@opentelemetry/api');
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      const context = activeSpan.spanContext();
      return context.traceId;
    }
  } catch (error) {
    // Silently ignore errors, just return undefined
  }
  return undefined;
}

/**
 * Create a custom span for manual instrumentation
 * 
 * @param name Span name
 * @param fn Function to execute within the span
 * @returns Promise resolving to the result of fn
 */
export async function withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!otelInitialized) {
    return fn();
  }

  try {
    const { trace } = require('@opentelemetry/api');
    const tracer = trace.getTracer('finex-manual');
    
    // @ts-expect-error Type definition for span is part of missing imports
    return tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await fn();
        span.end();
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2 }); // Error status
        span.end();
        throw error;
      }
    });
  } catch (error) {
    // If OpenTelemetry fails, still execute the function
    return fn();
  }
}
