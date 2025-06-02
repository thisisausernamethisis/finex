// @ts-nocheck
/**
 * PAT Rate Limiting Security Patch (T-403)
 * 
 * This module provides aggressive rate limiting for Personal Access Token (PAT)
 * authentication to prevent brute-force attacks. It limits failed auth attempts
 * to 5 per minute per IP and implements a 5-minute blocking period.
 */

import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { logger } from '../logger';
import { DomainEvent, eventBus } from '../events/eventBus';

// Configure Redis connection
const redis = new Redis(process.env.REDIS_URL!);

// Configure logger
const securityLogger = logger.child({ component: 'PATRateLimit' });

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  window: number;     // seconds
  max: number;        // max attempts
  blockDuration: number; // seconds
}

/**
 * Default rate limit settings:
 * - 5 attempts per minute
 * - 5 minute block duration
 */
const PAT_RATE_LIMIT: RateLimitConfig = {
  window: 60,         // 1 minute window
  max: 5,             // 5 attempts max
  blockDuration: 300  // 5 minutes block
};

/**
 * Emits a security alert event
 * 
 * @param ip IP address
 * @param attempts Number of failed attempts
 * @param isBlocked Whether the IP is now blocked
 */
async function emitSecurityAlert(
  ip: string, 
  attempts: number, 
  isBlocked: boolean
): Promise<void> {
  await eventBus.publish(DomainEvent.SECURITY_ALERT, {
    userId: 'system',
    timestamp: new Date(),
    data: {
      type: 'pat_brute_force',
      ip,
      attempts,
      isBlocked,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Apply rate limiting for PAT authentication
 * 
 * @param request NextRequest object
 * @param isFailedAttempt Whether this was a failed authentication attempt
 * @returns NextResponse with error if blocked, or null to continue
 */
export async function patRateLimit(
  request: NextRequest,
  isFailedAttempt: boolean = false
): Promise<NextResponse | null> {
  // Extract client IP
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.ip || 
             'unknown';
  
  // Redis keys for tracking
  const rateLimitKey = `pat:ratelimit:${ip}`;
  const blockKey = `pat:blocked:${ip}`;

  try {
    // Check if IP is already blocked
    const isBlocked = await redis.get(blockKey);
    if (isBlocked) {
      securityLogger.warn(`Blocked request from rate-limited IP: ${ip}`);
      
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': PAT_RATE_LIMIT.blockDuration.toString()
          }
        }
      );
    }

    if (isFailedAttempt) {
      // Increment failure count
      const attempts = await redis.incr(rateLimitKey);
      
      // Set expiry on first attempt
      if (attempts === 1) {
        await redis.expire(rateLimitKey, PAT_RATE_LIMIT.window);
      }

      securityLogger.info(`Failed PAT auth attempt from IP: ${ip} (${attempts}/${PAT_RATE_LIMIT.max})`);
      
      // Check if max attempts exceeded
      if (attempts >= PAT_RATE_LIMIT.max) {
        // Block the IP
        await redis.setex(blockKey, PAT_RATE_LIMIT.blockDuration, '1');
        await redis.del(rateLimitKey); // Reset counter
        
        securityLogger.warn(`Blocked IP ${ip} for PAT brute force (${attempts} attempts)`);
        
        // Emit security alert
        await emitSecurityAlert(ip, attempts, true);
        
        return NextResponse.json(
          { error: 'Too many failed attempts. IP blocked temporarily.' },
          { 
            status: 429,
            headers: {
              'Retry-After': PAT_RATE_LIMIT.blockDuration.toString()
            }
          }
        );
      }
      
      // If approaching limit, emit security alert
      if (attempts >= PAT_RATE_LIMIT.max - 1) {
        await emitSecurityAlert(ip, attempts, false);
      }
    } else {
      // Successful auth - reset counter
      await redis.del(rateLimitKey);
    }

    return null; // Continue with request
  } catch (error) {
    securityLogger.error('PAT rate limit error:', error);
    // Fail open but log for monitoring
    return null;
  }
}

/**
 * Check if an IP is currently blocked
 * 
 * @param ip IP address to check
 * @returns True if blocked, false otherwise
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const blockKey = `pat:blocked:${ip}`;
    const isBlocked = await redis.get(blockKey);
    return !!isBlocked;
  } catch (error) {
    securityLogger.error(`Error checking if IP ${ip} is blocked:`, error);
    return false; // Fail open
  }
}

/**
 * Get current attempt count for an IP
 * 
 * @param ip IP address to check
 * @returns Number of attempts and time remaining in window
 */
export async function getAttemptInfo(ip: string): Promise<{
  attempts: number;
  windowRemaining: number;
  isBlocked: boolean;
  blockRemaining: number;
}> {
  try {
    const rateLimitKey = `pat:ratelimit:${ip}`;
    const blockKey = `pat:blocked:${ip}`;
    
    // Get attempts and TTL
    const attempts = parseInt(await redis.get(rateLimitKey) || '0', 10);
    const windowRemaining = await redis.ttl(rateLimitKey);
    
    // Check if blocked
    const isBlocked = await redis.get(blockKey);
    const blockRemaining = await redis.ttl(blockKey);
    
    return {
      attempts,
      windowRemaining: windowRemaining > 0 ? windowRemaining : 0,
      isBlocked: !!isBlocked,
      blockRemaining: blockRemaining > 0 ? blockRemaining : 0
    };
  } catch (error) {
    securityLogger.error(`Error getting attempt info for IP ${ip}:`, error);
    return { 
      attempts: 0, 
      windowRemaining: 0,
      isBlocked: false,
      blockRemaining: 0
    };
  }
}

/**
 * Reset rate limit for an IP
 * 
 * @param ip IP address to reset
 */
export async function resetRateLimit(ip: string): Promise<void> {
  try {
    const rateLimitKey = `pat:ratelimit:${ip}`;
    const blockKey = `pat:blocked:${ip}`;
    
    await redis.del(rateLimitKey);
    await redis.del(blockKey);
    
    securityLogger.info(`Reset rate limit for IP: ${ip}`);
  } catch (error) {
    securityLogger.error(`Error resetting rate limit for IP ${ip}:`, error);
  }
}
