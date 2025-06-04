import { Worker, Job, QueueEvents } from 'bullmq';
import { prisma } from '../lib/db';
import { logger } from '../logger';
import { portfolioAnalysisService } from '../lib/services/portfolioAnalysisService';
import { jobsProcessed, jobsFailed, jobsActive } from '../lib/metrics';
import { emitJobEvent } from '../lib/events/eventEmitter';

// Logger for this worker
const workerLogger = logger.child({ component: 'PortfolioInsightWorker', queue: 'portfolio-insights' });

// Redis connection options for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Queue name
const QUEUE_NAME = 'portfolio-insights';

// Job data interface
interface PortfolioInsightJobData {
  userId: string;
  triggerReason: 'asset_added' | 'asset_categorized' | 'asset_removed' | 'manual_refresh' | 'scheduled';
  metadata?: {
    assetId?: string;
    assetName?: string;
    category?: string;
  };
}

// Worker function to start processing jobs
export function startPortfolioInsightWorker() {
  workerLogger.info('Starting portfolio insight worker');
  
  // Create worker
  const worker = new Worker<PortfolioInsightJobData>(
    QUEUE_NAME,
    async (job: Job<PortfolioInsightJobData>) => processPortfolioInsightJob(job),
    {
      connection: redisConnection,
      concurrency: 2, // Process up to 2 portfolio analysis jobs at once
      removeOnComplete: { count: 50 }, // Keep last 50 completed jobs
      removeOnFail: { count: 50 } // Keep last 50 failed jobs
    }
  );
  
  // Listen for events
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection });
  queueEvents.setMaxListeners(0); // Prevent MaxListenersExceededWarning
  
  // Log worker events and emit application events
  worker.on('completed', (job) => {
    workerLogger.info('Portfolio insight job completed', { jobId: job.id });
    jobsProcessed.inc({ type: 'portfolio-insights' });
    
    // Emit job completed event
    emitJobEvent({
      type: 'matrix', // Using matrix type for now, could add 'portfolio-insights' later
      jobId: job.id || 'unknown',
      status: 'completed',
      timestamp: new Date().toISOString()
    });
  });
  
  worker.on('failed', (job, error) => {
    workerLogger.error('Portfolio insight job failed', { 
      jobId: job?.id,
      error: error.message
    });
    jobsFailed.inc({ type: 'portfolio-insights' });
    
    // Emit job failed event
    emitJobEvent({
      type: 'matrix',
      jobId: job?.id || 'unknown',
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  });
  
  worker.on('active', (job) => {
    workerLogger.debug('Portfolio insight job started', { jobId: job.id });
    jobsActive.inc({ queue: 'portfolio-insights' });
  });
  
  return worker;
}

// Process an individual portfolio insight job
export async function processPortfolioInsightJob(job: Job<PortfolioInsightJobData>) {
  const { userId, triggerReason, metadata } = job.data;
  
  workerLogger.info('Processing portfolio insight job', { 
    jobId: job.id,
    userId,
    triggerReason,
    metadata
  });
  
  // Emit job started event
  emitJobEvent({
    type: 'matrix',
    jobId: job.id ?? `portfolio-insights:${userId}`,
    status: 'started',
    timestamp: new Date().toISOString(),
    data: { userId, triggerReason, metadata }
  });
  
  try {
    // Get current portfolio insights (if any) for comparison
    const existingInsights = await getExistingPortfolioInsights(userId);
    
    // Perform fresh portfolio analysis
    const analysis = await portfolioAnalysisService.analyzeUserPortfolio(userId);
    
    // Store or update portfolio insights in database
    await storePortfolioInsights(userId, analysis);
    
    // Detect significant changes and generate notifications
    const changes = detectSignificantChanges(existingInsights, analysis);
    
    if (changes.length > 0) {
      await generateChangeNotifications(userId, changes);
    }
    
    workerLogger.info('Portfolio insight analysis completed', {
      userId,
      totalAssets: analysis.totalAssets,
      categorizedAssets: analysis.categorizedAssets,
      exposureCategories: analysis.technologyExposure.length,
      insights: analysis.insights.length,
      risks: analysis.concentrationRisks.length,
      significantChanges: changes.length
    });
    
    // Emit job completed event with result
    emitJobEvent({
      type: 'matrix',
      jobId: job.id ?? `portfolio-insights:${userId}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: { 
        userId,
        triggerReason,
        totalAssets: analysis.totalAssets,
        insights: analysis.insights.length,
        changes: changes.length
      }
    });
    
    return {
      success: true,
      userId,
      triggerReason,
      analysis: {
        totalAssets: analysis.totalAssets,
        categorizedAssets: analysis.categorizedAssets,
        exposureCategories: analysis.technologyExposure.length,
        insights: analysis.insights.length,
        risks: analysis.concentrationRisks.length
      },
      changes: changes.length
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    workerLogger.error('Portfolio insight job failed', {
      userId,
      triggerReason,
      error: errorMessage
    });
    
    // Emit job failed event
    emitJobEvent({
      type: 'matrix',
      jobId: job.id ?? `portfolio-insights:${userId}`,
      status: 'failed',
      timestamp: new Date().toISOString(),
      data: { 
        userId,
        triggerReason,
        error: errorMessage
      }
    });
    
    // Re-throw to let BullMQ handle the failure
    throw error;
  }
}

/**
 * Get existing portfolio insights from database
 */
async function getExistingPortfolioInsights(userId: string): Promise<any> {
  try {
    // For now, we'll use a simple JSON storage approach
    // In production, this might be a separate PortfolioInsights table
    
    const existingRecord = await prisma.asset.findFirst({
      where: {
        userId,
        name: '__PORTFOLIO_INSIGHTS__' // Special record to store portfolio data
      },
      select: {
        categoryInsights: true,
        updatedAt: true
      }
    });
    
    if (existingRecord?.categoryInsights) {
      return JSON.parse(existingRecord.categoryInsights as string);
    }
    
    return null;
  } catch (error) {
    workerLogger.error('Failed to get existing portfolio insights', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

/**
 * Store portfolio insights in database
 */
async function storePortfolioInsights(userId: string, analysis: any): Promise<void> {
  try {
    // Store insights in a special asset record
    // In production, this should be a dedicated PortfolioInsights table
    
    await prisma.asset.upsert({
      where: {
        // We need a unique constraint for this approach
        // For now, we'll use name + userId combination
        name_userId: {
          name: '__PORTFOLIO_INSIGHTS__',
          userId
        }
      },
      update: {
        categoryInsights: JSON.stringify({
          ...analysis,
          storedAt: new Date().toISOString()
        }),
        updatedAt: new Date()
      },
      create: {
        name: '__PORTFOLIO_INSIGHTS__',
        description: 'Portfolio analysis insights storage',
        userId,
        category: 'OTHER',
        categoryConfidence: 1.0,
        categoryInsights: JSON.stringify({
          ...analysis,
          storedAt: new Date().toISOString()
        })
      }
    });
    
    workerLogger.debug('Portfolio insights stored successfully', { userId });
    
  } catch (error) {
    workerLogger.error('Failed to store portfolio insights', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Detect significant changes between old and new analysis
 */
function detectSignificantChanges(oldAnalysis: any, newAnalysis: any): Array<{
  type: 'exposure_change' | 'risk_change' | 'new_insight' | 'categorization_progress';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  data: any;
}> {
  const changes = [];
  
  if (!oldAnalysis) {
    return [{
      type: 'new_insight',
      description: 'Initial portfolio analysis completed',
      severity: 'MEDIUM',
      data: { totalAssets: newAnalysis.totalAssets }
    }];
  }
  
  // Check for significant exposure changes (>10% change in top category)
  if (oldAnalysis.technologyExposure?.length > 0 && newAnalysis.technologyExposure?.length > 0) {
    const oldTop = oldAnalysis.technologyExposure[0];
    const newTop = newAnalysis.technologyExposure[0];
    
    if (oldTop && newTop) {
      const exposureChange = Math.abs(newTop.percentage - oldTop.percentage);
      
      if (exposureChange > 10) {
        changes.push({
          type: 'exposure_change',
          description: `${newTop.category} exposure changed from ${oldTop.percentage}% to ${newTop.percentage}%`,
          severity: exposureChange > 20 ? 'HIGH' : 'MEDIUM',
          data: { oldPercentage: oldTop.percentage, newPercentage: newTop.percentage, category: newTop.category }
        });
      }
    }
  }
  
  // Check for new risks
  const oldRiskTypes = new Set(oldAnalysis.concentrationRisks?.map((r: any) => r.type) || []);
  const newRisks = newAnalysis.concentrationRisks?.filter((r: any) => !oldRiskTypes.has(r.type)) || [];
  
  newRisks.forEach((risk: any) => {
    changes.push({
      type: 'risk_change',
      description: `New ${risk.severity.toLowerCase()} risk detected: ${risk.description}`,
      severity: risk.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      data: { riskType: risk.type, riskSeverity: risk.severity }
    });
  });
  
  // Check for categorization progress
  const oldCategorized = oldAnalysis.categorizedAssets || 0;
  const newCategorized = newAnalysis.categorizedAssets || 0;
  
  if (newCategorized > oldCategorized) {
    const progressIncrease = newCategorized - oldCategorized;
    changes.push({
      type: 'categorization_progress',
      description: `${progressIncrease} additional asset(s) categorized`,
      severity: 'LOW',
      data: { oldCount: oldCategorized, newCount: newCategorized, increase: progressIncrease }
    });
  }
  
  return changes;
}

/**
 * Generate change notifications (placeholder for future notification system)
 */
async function generateChangeNotifications(userId: string, changes: any[]): Promise<void> {
  // Placeholder for future notification system
  // Could integrate with email, push notifications, or in-app notifications
  
  workerLogger.info('Generated change notifications', {
    userId,
    changeCount: changes.length,
    changes: changes.map(c => ({ type: c.type, severity: c.severity }))
  });
  
  // For now, just log the notifications
  changes.forEach(change => {
    workerLogger.info('Portfolio change detected', {
      userId,
      type: change.type,
      description: change.description,
      severity: change.severity
    });
  });
} 