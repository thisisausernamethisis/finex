import { createLogger, format, transports } from 'winston';

// Create a logger instance with different behavior based on environment
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'finex-bot' },
  transports: [
    // Output to console in development
    process.env.NODE_ENV !== 'production'
      ? new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, ...meta }) => {
              // Don't log in test environment unless explicitly enabled
              if (process.env.NODE_ENV === 'test' && !process.env.LOG_IN_TEST) {
                return '';
              }
              return `${timestamp} ${level}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`;
            })
          ),
        })
      : // In production, use a different transport (could be file, HTTP, etc.)
        new transports.Console({
          format: format.combine(
            format.uncolorize(),
            format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} ${level}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`;
            })
          ),
        }),
  ],
});

// Simplified interface for consistent logging across the application
export { logger };

// Child logger creator for component-specific logging
export function createChildLogger(component: Record<string, any>) {
  return logger.child(component);
}
