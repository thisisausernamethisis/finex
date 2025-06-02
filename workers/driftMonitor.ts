// @ts-nocheck
/**
 * DriftMonitor Worker Implementation (T-401)
 * 
 * This worker performs nightly quality sweeps to evaluate
 * RAG quality and auto-adjusts the retrieval alpha weight
 * to maintain a target RAGAS score.
 */

import { Worker } from 'bullmq';
import prisma from '../lib/db';
import { evaluateRAGAS } from '../lib/services/qualityService';
import Redis from 'ioredis';
import { logger } from '../lib/logger';
import { emitQualityDrift } from '../lib/events/eventBus';
import { exportMetrics } from '../lib/metrics/drift';

// Configure Redis connection
const redis = new Redis(process.env.REDIS_URL!);

// Configure logger
const driftLogger = logger.child({ component: 'DriftMonitor' });

/**
 * Drift monitoring configuration
 */
interface DriftConfig {
  targetRAGAS: number;
  tolerance: number;
  maxIncrease: number;
  decayRate: number;
  sampleSize: number;
}

/**
 * Default drift monitoring settings:
 * - Target RAGAS score: 0.82
 * - Tolerance: 0.01 (1%)
 * - Max increase: 10%
 * - Daily decay rate: 1%
 * - Sample size: 200 Q&A pairs
 */
const DRIFT_CONFIG: DriftConfig = {
  targetRAGAS: 0.82,
  tolerance: 0.01,
  maxIncrease: 0.10, // 10% max increase
  decayRate: 0.99,   // 1% daily decay
  sampleSize: 200
};

/**
 * Create DriftMonitor worker
 */
export const driftMonitorWorker = new Worker(
  'drift-monitor',
  async (job) => {
    driftLogger.info('[DriftMonitor] Starting quality sweep...');
    
    try {
      // Get current alpha weight
      const currentAlpha = parseFloat(await redis.get('retrieval:alpha') || '0.5');
      
      // Sample Q&A pairs for evaluation
      const samples = await prisma.qAPair.findMany({
        take: DRIFT_CONFIG.sampleSize,
        orderBy: { createdAt: 'desc' },
        where: { 
          createdAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      if (samples.length < 50) {
        driftLogger.warn('[DriftMonitor] Insufficient samples for evaluation', {
          samplesFound: samples.length,
          minRequired: 50
        });
        return { status: 'insufficient_data' };
      }

      // Evaluate RAGAS score
      const ragasScore = await evaluateRAGAS(samples);
      
      // Calculate drift
      const drift = ragasScore - DRIFT_CONFIG.targetRAGAS;
      const isWithinTolerance = Math.abs(drift) <= DRIFT_CONFIG.tolerance;

      driftLogger.info('[DriftMonitor] Quality assessment', {
        ragasScore,
        targetScore: DRIFT_CONFIG.targetRAGAS,
        drift,
        isWithinTolerance,
        currentAlpha
      });

      let newAlpha = currentAlpha;
      let action = 'no_change';

      if (!isWithinTolerance) {
        if (drift < 0) {
          // Quality below target - increase alpha
          const increase = Math.min(
            Math.abs(drift) * DRIFT_CONFIG.maxIncrease,
            DRIFT_CONFIG.maxIncrease
          );
          newAlpha = Math.min(currentAlpha * (1 + increase), 1.0);
          action = 'increase';
          
          driftLogger.info('[DriftMonitor] Increasing alpha due to below-target quality', {
            increase: `${(increase * 100).toFixed(2)}%`,
            oldAlpha: currentAlpha,
            newAlpha
          });
        } else {
          // Quality above target - decay alpha
          newAlpha = Math.max(currentAlpha * DRIFT_CONFIG.decayRate, 0.1);
          action = 'decay';
          
          driftLogger.info('[DriftMonitor] Decaying alpha due to above-target quality', {
            decay: `${((1 - DRIFT_CONFIG.decayRate) * 100).toFixed(2)}%`,
            oldAlpha: currentAlpha,
            newAlpha
          });
        }

        // Update alpha
        await redis.set('retrieval:alpha', newAlpha.toString());
      }

      // Log metrics to database
      const metric = await prisma.qualityMetric.create({
        data: {
          metric: 'ragas_score',
          value: ragasScore,
          notes: JSON.stringify({
            alpha: { old: currentAlpha, new: newAlpha },
            drift,
            action,
            sampleSize: samples.length
          })
        }
      });

      // Export Prometheus metrics
      await exportMetrics({
        ragas_score: ragasScore,
        retrieval_alpha: newAlpha,
        drift_magnitude: Math.abs(drift),
        samples_count: samples.length
      });

      // Emit quality drift event if significant change
      if (action !== 'no_change') {
        await emitQualityDrift(ragasScore, newAlpha);
      }

      driftLogger.info('[DriftMonitor] Quality sweep completed', {
        ragasScore, 
        action,
        alpha: { old: currentAlpha, new: newAlpha }
      });
      
      return {
        status: 'success',
        ragasScore,
        alpha: { old: currentAlpha, new: newAlpha },
        action,
        metricId: metric.id
      };
    } catch (error) {
      driftLogger.error('[DriftMonitor] Error during quality sweep:', error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1,
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 20 }
  }
);

/**
 * Schedule nightly run
 */
export async function scheduleDriftMonitor() {
  driftLogger.info('[DriftMonitor] Scheduling nightly quality sweeps');
  
  const { Queue } = await import('bullmq');
  const driftQueue = new Queue('drift-monitor', { connection: redis });
  
  await driftQueue.add(
    'nightly-sweep',
    {},
    {
      repeat: {
        pattern: '0 2 * * *' // 2 AM daily
      }
    }
  );
  
  driftLogger.info('[DriftMonitor] Scheduled nightly run at 2 AM');
  
  return { status: 'scheduled' };
}

/**
 * Run drift monitor immediately
 */
export async function runDriftMonitorNow() {
  driftLogger.info('[DriftMonitor] Scheduling immediate quality sweep');
  
  const { Queue } = await import('bullmq');
  const driftQueue = new Queue('drift-monitor', { connection: redis });
  
  const job = await driftQueue.add('manual-sweep', {});
  
  driftLogger.info('[DriftMonitor] Scheduled immediate run', { jobId: job.id });
  
  return { status: 'scheduled', jobId: job.id };
}
