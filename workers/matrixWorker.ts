import { Worker, Job, QueueEvents } from 'bullmq';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { applyCalibration } from '../lib/utils/calibration';
import { computeConfidence } from '../lib/utils/confidence';
import { assembleMatrixContext } from '../lib/services/contextAssemblyService';
import { jobsProcessed, jobsFailed, jobsActive } from '../lib/metrics';
import { emitJobEvent } from '../lib/events/eventEmitter';
import { MatrixResultUpdateSchema } from '../lib/validators/matrix';
import { ImpactExplainSchema, PublicImpactSchema } from '../lib/validators/matrix';
import OpenAI from 'openai';

// Logger for this worker
const workerLogger = logger.child({ component: 'MatrixWorker', queue: 'matrix' });

// Redis connection options for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// OpenAI API constants
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Queue name
const QUEUE_NAME = 'matrix-analysis';

// Worker function to start processing jobs
export function startMatrixWorker() {
  workerLogger.info('Starting matrix analysis worker');
  
  // Create worker
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => processMatrixJob(job),
    {
      connection: redisConnection,
      concurrency: 2, // Process up to 2 jobs at once
      removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
      removeOnFail: { count: 100 } // Keep last 100 failed jobs
    }
  );
  
  // Listen for events
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection });
  queueEvents.setMaxListeners(0); // Prevent MaxListenersExceededWarning
  
  // Log worker events and emit application events
  worker.on('completed', (job) => {
    workerLogger.info('Matrix analysis job completed', { jobId: job.id });
    jobsProcessed.inc({ type: 'matrix-analysis' });
    
    // Emit job completed event
    emitJobEvent({
      type: 'matrix',
      jobId: job.id || 'unknown',
      status: 'completed',
      timestamp: new Date().toISOString()
    });
  });
  
  worker.on('failed', (job, err) => {
    workerLogger.error('Matrix analysis job failed', { 
      jobId: job?.id, 
      error: err.message,
      stack: err.stack
    });
    
    jobsFailed.inc({ 
      type: 'matrix-analysis',
      error_type: err.name || 'UnknownError'  
    });
    
    // Emit job failed event
    emitJobEvent({
      type: 'matrix',
      jobId: job?.id ?? 'unknown',
      status: 'failed',
      timestamp: new Date().toISOString(),
      data: { error: err.message }
    });
  });
  
  worker.on('error', (err) => {
    workerLogger.error('Matrix worker error', { 
      error: err.message,
      stack: err.stack
    });
  });
  
  worker.on('active', (job) => {
    jobsActive.set({ queue: 'matrix-analysis' }, 1);
    
    // Emit job active event
    if (job?.id) {
      emitJobEvent({
        type: 'matrix',
        jobId: job.id,
        status: 'started',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return worker;
}

// Process an individual matrix analysis job
export async function processMatrixJob(job: Job) {
  const { assetId, scenarioId } = job.data;
  
  workerLogger.info('Processing matrix analysis job', { 
    jobId: job.id,
    assetId,
    scenarioId
  });
  
  // Emit job started event
  emitJobEvent({
    type: 'matrix',
    jobId: job.id ?? `matrix:${assetId}:${scenarioId}`,
    status: 'started',
    timestamp: new Date().toISOString(),
    data: { assetId, scenarioId }
  });
  
  try {
    // Update status to 'processing'
    await updateMatrixStatus(assetId, scenarioId, 'processing');
    
    // 1. Assemble context from asset and scenario data
    const context = await assembleMatrixContext(assetId, scenarioId, 10000);
    
    // 2. Call the LLM for analysis
    const result = await analyzeAssetScenarioImpact(context, assetId, scenarioId);
    
    // 3. Save the result with calibration and confidence computation
    await saveMatrixResult(assetId, scenarioId, result, job);
    
    // Emit job completed event with result
    emitJobEvent({
      type: 'matrix',
      jobId: job.id ?? `matrix:${assetId}:${scenarioId}`,
      status: 'completed',
      timestamp: new Date().toISOString(),
      data: { 
        assetId, 
        scenarioId,
        impact: result.impact
      }
    });
    
    return result;
  } catch (error) {
    // Update status to 'failed'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateMatrixStatus(assetId, scenarioId, 'failed', errorMessage);
    
    // Emit job failed event
    emitJobEvent({
      type: 'matrix',
      jobId: job.id ?? `matrix:${assetId}:${scenarioId}`,
      status: 'failed',
      timestamp: new Date().toISOString(),
      data: { 
        assetId, 
        scenarioId,
        error: errorMessage
      }
    });
    
    // Re-throw to let BullMQ handle the failure
    throw error;
  }
}

// Call OpenAI to analyze the impact with chain-of-thought reasoning
export async function analyzeAssetScenarioImpact(
  context: string,
  assetId: string,
  scenarioId: string
): Promise<{
  impact: number;
  summary: string;
  confidence: number;
  evidenceIds: string;
  reasoning_steps?: Array<{
    id: string;
    premise: string;
    inference: string;
    confidence: number;
    evidence: string[];
  }>;
}> {
  workerLogger.debug('Calling LLM for impact analysis', { assetId, scenarioId });
  
  const prompt = `
    You are an analytical AI assessing the financial impact of a scenario on an asset.
    
    TASK:
    Analyze the impact using a step-by-step reasoning approach (Chain of Thought).
    
    CONTEXT:
    ${context}
    
    INSTRUCTIONS:
    1. Break down your analysis into 3-5 logical reasoning steps.
    2. Each step should include:
       - A premise based on evidence from the context
       - A logical inference drawn from that premise
       - Confidence in that specific step (0-1)
       - Reference to specific evidence IDs
    3. After completing your reasoning steps, conclude with:
       - An overall impact score between -5 and +5 as an integer:
         * -5 to -3: Severe negative impact
         * -2 to -1: Moderate negative impact
         * 0: No significant impact
         * +1 to +2: Moderate positive impact
         * +3 to +5: Substantial positive impact
       - A concise summary (2-3 sentences)
       - An overall confidence score (0-1)
       - A list of the most relevant evidence IDs
    
    You must respond using the provided function, with your explicit reasoning steps.
    This helps maintain transparency and explainability in your analysis.
  `;
  
  try {
    const { choices } = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an analytical assistant.' },
        { role: 'user',   content: prompt },
      ],
      functions: [{
        name: 'set_impact_analysis',
        parameters: ImpactExplainSchema.shape
      }],
      function_call: { name: 'set_impact_analysis' }
    });

    if (!choices[0]?.message?.function_call?.arguments) {
      throw new Error('No function call result in OpenAI response');
    }
    
    // Parse the arguments from the function call
    const {
      summary,
      confidence: llmConfidence = 0.6,   // fallback if not provided
      impact
    } = JSON.parse(choices[0].message.function_call.arguments);
    
    // ─── Phase 7.2-e: impact calibration ───────────────────────────────
    const calibratedImpact = applyCalibration(Number(impact ?? 0));
    
    // Extract and validate other fields
    const validationObj = {
      impact: calibratedImpact, // Use calibrated impact value
      summary,
      confidence: llmConfidence, // Will be replaced by composite confidence
      evidenceIds: "",  // Will be populated from job data chunks
    };
    
    // Parse full response for reasoning steps
    const fullResponse = JSON.parse(choices[0].message.function_call.arguments);
    
    // Build and return result specifying the calibrated impact
    return {
      impact: calibratedImpact,
      summary,
      confidence: llmConfidence, // Original LLM confidence (will be replaced by composite)
      evidenceIds: fullResponse.evidenceIds || "",
      reasoning_steps: fullResponse.reasoning_steps
    };
  } catch (error) {
    workerLogger.error('Error calling OpenAI API', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      assetId,
      scenarioId
    });
    throw new Error('Failed to analyze impact with AI: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Update the status of a matrix analysis
async function updateMatrixStatus(
  assetId: string,
  scenarioId: string,
  status: string,
  error?: string
) {
  try {
    await prisma.matrixAnalysisResult.update({
      where: {
        assetId_scenarioId: {
          assetId,
          scenarioId
        }
      },
      data: {
        status,
        error: error || null,
        ...(status === 'failed' ? {} : { error: null }),
        ...(status === 'completed' ? { completedAt: new Date() } : {})
      }
    });
  } catch (updateError) {
    workerLogger.error('Failed to update matrix status', {
      assetId,
      scenarioId,
      status,
      error: updateError instanceof Error ? updateError.message : 'Unknown error'
    });
  }
}

// Save the analysis result to the database
async function saveMatrixResult(
  assetId: string,
  scenarioId: string,
  result: {
    impact: number;
    summary: string;
    confidence: number;
    evidenceIds: string;
    reasoning_steps?: Array<{
      id: string;
      premise: string;
      inference: string;
      confidence: number;
      evidence: string[];
    }>;
  },
  job: Job
) {
  try {
    // ─── Phase 7.2-f: composite confidence  ────────────────────────────
    // retrieval variance & rank-corr computed upstream & passed via job data
    const compositeConfidence = computeConfidence({
      llm: result.confidence,
      // Add fallbacks to legacy property names
      // TODO: After next minor release, remove legacy "retrievalVar" support
      retrievalVariance: job.data.retrievalVariance ?? job.data.retrievalVar ?? 0.5,
      // TODO: After next minor release, remove legacy "rankCorr" support
      rankCorrelation: job.data.rankCorrelation ?? job.data.rankCorr ?? 0.5,
    });
    
    // Extract the chunk IDs if they exist
    const evidenceIds = (job.data.chunks || [])
      .map((chunk: any) => chunk.id || '')
      .filter(Boolean)
      .join(',');
    
    // Create the data to save
    const dataToSave = {
      impact: result.impact,
      summary: result.summary,
      confidence: compositeConfidence,
      evidenceIds: evidenceIds || result.evidenceIds,
      status: 'completed',
      completedAt: new Date(),
      error: null
    };
    
    // Update the database
    await prisma.matrixAnalysisResult.update({
      where: {
        assetId_scenarioId: {
          assetId,
          scenarioId
        }
      },
      data: MatrixResultUpdateSchema.parse(dataToSave)
    });
    
    workerLogger.info('Matrix analysis result saved with calibrated impact and composite confidence', {
      assetId,
      scenarioId,
      impact: result.impact,
      confidence: compositeConfidence,
      calibrated: true
    });
  } catch (error) {
    workerLogger.error('Failed to save matrix result', {
      assetId,
      scenarioId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// If this file is executed directly, start the worker
if (require.main === module) {
  startMatrixWorker();
}
