// @ts-nocheck
/**
 * Usage Quota Enforcement Middleware (T-400)
 * 
 * This middleware enforces token usage quotas based on user subscription plan.
 * It prevents users from exceeding their subscription limits and provides
 * appropriate HTTP responses when quotas are reached.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '../db';
import { logger } from '../logger';
import { emitQuotaWarning } from '../events/eventBus';
import { estimateTokenCount } from '../utils/tokenEstimation';

// Configure logger
const quotaLogger = logger.child({ component: 'EnforceQuota' });

/**
 * Quota limits for each subscription plan
 */
interface QuotaLimits {
  free: { tokens: number; grace: number };
  pro: { tokens: number; grace: number };
  enterprise: { tokens: number; grace: number };
}

/**
 * Default quota limits:
 * - Free: 150K tokens with 50K grace
 * - Pro: 1M tokens with 100K grace
 * - Enterprise: Unlimited
 */
const QUOTA_LIMITS: QuotaLimits = {
  free: { tokens: 150_000, grace: 50_000 },
  pro: { tokens: 1_000_000, grace: 100_000 },
  enterprise: { tokens: Infinity, grace: 0 }
};

/**
 * Warning thresholds for sending notifications (percentage of base quota)
 */
const WARNING_THRESHOLDS = [50, 80, 90, 100];

/**
 * Get billing period end date (30 days from now)
 */
function getBillingPeriodEnd(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
}

/**
 * Enforce token usage quota for the current user
 * 
 * @param request NextRequest object (or any object with userId property)
 * @param estimatedTokens Estimated token count for the current operation
 * @returns NextResponse with error if over quota, or null to continue
 */
export async function enforceQuota(
  request: NextRequest | { userId: string },
  estimatedTokens: number
): Promise<NextResponse | null> {
  // Get user ID from request
  const userId = 'userId' in request 
    ? request.userId 
    : getAuth(request as NextRequest)?.userId;
  
  if (!userId) {
    quotaLogger.warn('Unauthorized request, no user ID found');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get user's current usage
    // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
    const usage = await prisma.usageMeter.findUnique({
      where: { userId }
    });
    
    // Get the user's subscription separately
    // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    // Determine user's plan (default to free)
    // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
    const plan = user?.subscription?.plan || 'free';
    const limits = QUOTA_LIMITS[plan as keyof QuotaLimits];
    const totalLimit = limits.tokens + limits.grace;
    
    // Calculate current and projected usage
    const currentUsage = usage?.tokensUsed || 0;
    const projectedUsage = currentUsage + estimatedTokens;

    quotaLogger.debug('Quota check', {
      userId,
      plan,
      currentUsage,
      estimatedTokens,
      projectedUsage,
      limit: limits.tokens,
      grace: limits.grace
    });

    // Check for warning thresholds and emit events if needed
    const usagePercent = Math.floor((currentUsage / limits.tokens) * 100);
    const projectedPercent = Math.floor((projectedUsage / limits.tokens) * 100);
    
    // Check if usage crosses any warning threshold with this request
    for (const threshold of WARNING_THRESHOLDS) {
      if (usagePercent < threshold && projectedPercent >= threshold) {
        quotaLogger.info(`User ${userId} crossing ${threshold}% quota threshold`, {
          plan, currentUsage, projectedUsage, limit: limits.tokens
        });
        await emitQuotaWarning(userId, projectedPercent, plan);
        break;
      }
    }

    // Check if over total limit (base + grace)
    if (projectedUsage > totalLimit) {
      quotaLogger.warn(`User ${userId} quota exceeded: ${projectedUsage}/${totalLimit}`);
      
      // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
      const periodEnd = usage?.periodEnd || getBillingPeriodEnd();
      
      return NextResponse.json(
        { 
          error: 'Quota exceeded',
          details: {
            used: currentUsage,
            limit: limits.tokens,
            grace: limits.grace,
            requested: estimatedTokens
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': totalLimit.toString(),
            'X-RateLimit-Remaining': Math.max(0, totalLimit - currentUsage).toString(),
            'X-RateLimit-Reset': periodEnd.toISOString()
          }
        }
      );
    }

    // Update usage (atomic operation)
    const periodEnd = getBillingPeriodEnd();
    
    // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
    await prisma.usageMeter.upsert({
      where: { userId },
      create: {
        userId,
        tokensUsed: estimatedTokens,
        periodStart: new Date(),
        periodEnd,
        hardCap: totalLimit
      },
      update: {
        tokensUsed: { increment: estimatedTokens }
      }
    });

    // Log warning if in grace period
    if (currentUsage > limits.tokens && currentUsage <= totalLimit) {
      const graceUsedPercent = Math.floor(
        ((currentUsage - limits.tokens) / limits.grace) * 100
      );
      
      quotaLogger.warn(`User ${userId} in grace period: ${graceUsedPercent}% of grace used`, {
        plan,
        currentUsage,
        baseLimit: limits.tokens,
        graceUsed: currentUsage - limits.tokens,
        graceTotal: limits.grace
      });
      
      // Emit quota warning event for grace period
      await emitQuotaWarning(userId, 100 + graceUsedPercent, plan);
    }

    // Allow request to proceed
    return null;
  } catch (error) {
    quotaLogger.error('Quota enforcement error:', error);
    // Fail open in case of errors (log for monitoring)
    return null;
  }
}

/**
 * Record actual token usage after an operation completes
 * 
 * Use this function to adjust token usage when the initial estimate
 * was incorrect, such as after LLM API calls.
 * 
 * @param userId User ID
 * @param tokenDelta Difference between actual and estimated tokens
 */
export async function updateTokenUsage(
  userId: string,
  tokenDelta: number
): Promise<void> {
  if (tokenDelta === 0) return;

  try {
    // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
    await prisma.usageMeter.upsert({
      where: { userId },
      create: {
        userId,
        tokensUsed: Math.max(0, tokenDelta),
        periodStart: new Date(),
        periodEnd: getBillingPeriodEnd(),
        hardCap: QUOTA_LIMITS.free.tokens + QUOTA_LIMITS.free.grace
      },
      update: {
        tokensUsed: { 
          increment: tokenDelta
        }
      }
    });

    quotaLogger.debug(`Updated token usage for user ${userId}`, { tokenDelta });
  } catch (error) {
    quotaLogger.error(`Failed to update token usage for user ${userId}:`, error);
  }
}

/**
 * Get current usage for a user
 * 
 * @param userId User ID
 * @returns Object with usage metrics
 */
export async function getUserUsage(userId: string): Promise<{
  used: number;
  limit: number;
  grace: number;
  percent: number;
  periodEnd: Date | null;
}> {
  try {
    // Get usage meter and user subscription separately
    // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
    const usage = await prisma.usageMeter.findUnique({
      where: { userId }
    });
    
    // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    // Determine plan and limits
    // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
    const plan = user?.subscription?.plan || 'free';
    const limits = QUOTA_LIMITS[plan as keyof QuotaLimits];
    const tokensUsed = usage?.tokensUsed || 0;
    
    return {
      used: tokensUsed,
      limit: limits.tokens,
      grace: limits.grace,
      percent: Math.floor((tokensUsed / limits.tokens) * 100),
      // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
      periodEnd: usage?.periodEnd || null
    };
  } catch (error) {
    quotaLogger.error(`Failed to get usage for user ${userId}:`, error);
    return {
      used: 0,
      limit: QUOTA_LIMITS.free.tokens,
      grace: QUOTA_LIMITS.free.grace,
      percent: 0,
      periodEnd: null
    };
  }
}

/**
 * Reset quota usage for a specific user
 * 
 * Typically called when a billing period ends or subscription changes.
 * 
 * @param userId User ID
 */
export async function resetUserQuota(userId: string): Promise<void> {
  try {
    // @ts-ignore - Prisma model includes these fields even if TypeScript doesn't know
    await prisma.usageMeter.update({
      where: { userId },
      data: {
        tokensUsed: 0,
        periodStart: new Date(),
        periodEnd: getBillingPeriodEnd()
      }
    });
    
    quotaLogger.info(`Reset quota for user ${userId}`);
  } catch (error) {
    quotaLogger.error(`Failed to reset quota for user ${userId}:`, error);
  }
}

/**
 * Estimate tokens for input text
 * Re-exported from tokenEstimation for convenience
 */
export { estimateTokenCount };
