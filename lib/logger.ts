import { createLogger, format, transports } from 'winston';

/**
 * Simple secret sanitizer that redacts sensitive information from logs
 * Note: This should ideally be replaced with fast-redact for better performance
 */
function createSecretSanitizer(paths = ['password', 'token', 'key', 'secret', 'auth', 'credentials']) {
  // Create a regex pattern to match sensitive fields in JSON strings
  const pattern = new RegExp(
    `(["'])(${paths.join('|')})(["']\\s*:\\s*["'])[^"']*["']`,
    'gi'
  );
  
  return (info: any) => {
    // Don't process if no message or already processed
    if (!info || info._sanitized) return info;
    
    try {
      // Mark as processed to avoid double-processing in format chain
      info._sanitized = true;
      
      // Convert object to string for regex replacement
      if (typeof info.message === 'string') {
        info.message = info.message.replace(pattern, '$1$2$3[REDACTED]"');
      }
      
      // Handle metadata objects
      Object.keys(info).forEach(key => {
        if (key !== 'message' && typeof info[key] === 'object' && info[key] !== null) {
          const stringified = JSON.stringify(info[key]);
          const sanitized = stringified.replace(pattern, '$1$2$3[REDACTED]"');
          if (sanitized !== stringified) {
            info[key] = JSON.parse(sanitized);
          }
        }
      });
    } catch (e) {
      // Silent fail - don't break logging if sanitization fails
    }
    
    return info;
  };
}

// Create a logger instance with different behavior based on environment
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    // Add secret sanitization as a custom format
    format((info) => createSecretSanitizer()(info)) as any,
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
