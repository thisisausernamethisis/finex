// Edge Runtime compatible logger
const createEdgeLogger = (service: string) => ({
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] [${service}] INFO: ${message}`, meta ? JSON.stringify(meta) : '')
    }
  },
  warn: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[${new Date().toISOString()}] [${service}] WARN: ${message}`, meta ? JSON.stringify(meta) : '')
    }
  },
  error: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[${new Date().toISOString()}] [${service}] ERROR: ${message}`, meta ? JSON.stringify(meta) : '')
    }
  }
})

// Create auth-specific logger (Edge Runtime compatible)
const authLogger = createEdgeLogger('auth-monitor')

// Authentication event types for structured logging
export enum AuthEventType {
  SIGN_IN_ATTEMPT = 'auth:sign_in_attempt',
  SIGN_IN_SUCCESS = 'auth:sign_in_success',
  SIGN_IN_FAILURE = 'auth:sign_in_failure',
  SIGN_OUT = 'auth:sign_out',
  SESSION_EXPIRED = 'auth:session_expired',
  UNAUTHORIZED_ACCESS = 'auth:unauthorized_access',
  TOKEN_REFRESH = 'auth:token_refresh',
  PERMISSION_DENIED = 'auth:permission_denied',
  API_AUTH_FAILURE = 'auth:api_failure',
  MIDDLEWARE_ERROR = 'auth:middleware_error'
}

// Authentication context for event logging
export interface AuthEventContext {
  userId?: string
  sessionId?: string
  userAgent?: string
  ipAddress?: string
  route?: string
  method?: string
  timestamp?: string
  error?: string
  metadata?: Record<string, any>
}

/**
 * Authentication monitoring service for structured logging and security tracking
 */
export class AuthMonitor {
  /**
   * Log an authentication event with structured context
   */
  static logEvent(
    event: AuthEventType, 
    context: AuthEventContext = {},
    level: 'info' | 'warn' | 'error' = 'info'
  ) {
    const eventData: Record<string, any> = {
      event,
      timestamp: context.timestamp || new Date().toISOString(),
      userId: context.userId,
      sessionId: context.sessionId,
      route: context.route,
      method: context.method,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      error: context.error,
      ...context.metadata
    }

    // Remove undefined values for cleaner logs
    Object.keys(eventData).forEach(key => {
      if (eventData[key] === undefined) {
        delete eventData[key]
      }
    })

    const message = `Authentication event: ${event}`

    switch (level) {
      case 'error':
        authLogger.error(message, eventData)
        break
      case 'warn':
        authLogger.warn(message, eventData)
        break
      default:
        authLogger.info(message, eventData)
    }
  }

  /**
   * Log successful authentication
   */
  static logSignInSuccess(userId: string, context: Partial<AuthEventContext> = {}) {
    this.logEvent(AuthEventType.SIGN_IN_SUCCESS, {
      userId,
      ...context
    })
  }

  /**
   * Log failed authentication attempt
   */
  static logSignInFailure(error: string, context: Partial<AuthEventContext> = {}) {
    this.logEvent(AuthEventType.SIGN_IN_FAILURE, {
      error,
      ...context
    }, 'warn')
  }

  /**
   * Log unauthorized access attempt
   */
  static logUnauthorizedAccess(route: string, context: Partial<AuthEventContext> = {}) {
    this.logEvent(AuthEventType.UNAUTHORIZED_ACCESS, {
      route,
      ...context
    }, 'warn')
  }

  /**
   * Log session expiration
   */
  static logSessionExpired(userId?: string, context: Partial<AuthEventContext> = {}) {
    this.logEvent(AuthEventType.SESSION_EXPIRED, {
      userId,
      ...context
    }, 'warn')
  }

  /**
   * Log permission denied events
   */
  static logPermissionDenied(
    userId: string, 
    route: string, 
    requiredPermission: string,
    context: Partial<AuthEventContext> = {}
  ) {
    this.logEvent(AuthEventType.PERMISSION_DENIED, {
      userId,
      route,
      metadata: { requiredPermission },
      ...context
    }, 'warn')
  }

  /**
   * Log API authentication failures
   */
  static logApiAuthFailure(
    route: string, 
    method: string, 
    error: string,
    context: Partial<AuthEventContext> = {}
  ) {
    this.logEvent(AuthEventType.API_AUTH_FAILURE, {
      route,
      method,
      error,
      ...context
    }, 'error')
  }

  /**
   * Log middleware authentication errors
   */
  static logMiddlewareError(error: string, context: Partial<AuthEventContext> = {}) {
    this.logEvent(AuthEventType.MIDDLEWARE_ERROR, {
      error,
      ...context
    }, 'error')
  }

  /**
   * Extract context from Next.js request for consistent logging
   */
  static extractRequestContext(req: Request): Partial<AuthEventContext> {
    const url = new URL(req.url)
    
    return {
      route: url.pathname,
      method: req.method,
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
    }
  }

  /**
   * Create a security alert for critical auth events
   */
  static createSecurityAlert(
    title: string, 
    description: string, 
    context: AuthEventContext = {}
  ) {
    const alertData: Record<string, any> = {
      alert: 'SECURITY_EVENT',
      title,
      description,
      severity: 'high',
      timestamp: new Date().toISOString(),
      ...context
    }

    const message = `Security Alert: ${title}`
    authLogger.error(message, alertData)
    
    // In production, this could also send to external monitoring
    // services like Datadog, Sentry, or PagerDuty
  }

  /**
   * Track authentication metrics for monitoring dashboards
   */
  static trackMetric(
    metric: string, 
    value: number, 
    tags: Record<string, string> = {}
  ) {
    const metricData = {
      metric,
      value,
      tags,
      timestamp: new Date().toISOString()
    }

    const message = `Auth metric: ${metric}`
    authLogger.info(message, metricData)
  }
}

/**
 * Middleware helper to automatically log auth events from requests
 */
export function withAuthMonitoring<T>(
  handler: (req: Request, context?: any) => Promise<T>,
  eventType?: AuthEventType
) {
  return async (req: Request, context?: any): Promise<T> => {
    const requestContext = AuthMonitor.extractRequestContext(req)
    
    try {
      const result = await handler(req, context)
      
      // Log successful operation if eventType provided
      if (eventType) {
        AuthMonitor.logEvent(eventType, requestContext)
      }
      
      return result
    } catch (error) {
      // Log the error with context
      AuthMonitor.logEvent(AuthEventType.API_AUTH_FAILURE, {
        ...requestContext,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'error')
      
      throw error
    }
  }
} 