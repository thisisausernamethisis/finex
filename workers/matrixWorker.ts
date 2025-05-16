import { Worker, Job, QueueEvents } from 'bullmq';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { assembleMatrixContext } from '../lib/services/contextAssemblyService';
import { jobsProcessed, jobsFailed, jobsActive } from '../lib/metrics';
import { emitJobEvent } from '../lib/events/eventEmitter';
import { MatrixResultUpdateSchema } from '../lib/validators/matrix';
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
    
    // 3. Save the result
    await saveMatrixResult(assetId, scenarioId, result);
    
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

// Call OpenAI to analyze the impact
async function analyzeAssetScenarioImpact(
  context: string,
  assetId: string,
  scenarioId: string
): Promise<{
  impact: number;
  summary: string;
  confidence: number;
  evidenceIds: string;
}> {
  workerLogger.debug('Calling LLM for impact analysis', { assetId, scenarioId });
  
  const prompt = `
    You are a financial analysis AI.
    
    Your task is to analyze the impact of a scenario on an asset.
    
    Use the following context to determine the impact score, where:
    - Negative impact ranges from -5 (severe negative impact) to -1 (slight negative impact)
    - 0 represents no significant impact
    - Positive impact ranges from +1 (slight positive impact) to +5 (substantial positive impact)
    
    CONTEXT:
    ${context}
    
    Based on this information, provide:
    1. An impact score between -5 and +5 as an integer
    2. A concise summary (2-3 sentences) explaining the reasoning
    3. A confidence score between 0 and 1, where:
       - 0.9-1.0: Very high confidence in the assessment (strong evidence, clear impact)
       - 0.7-0.9: High confidence (good evidence, clear direction of impact)
       - 0.5-0.7: Moderate confidence (mixed evidence, reasonable assessment)
       - 0.3-0.5: Low confidence (limited evidence, uncertain impact)
       - 0.0-0.3: Very low confidence (insufficient evidence, highly speculative)
    4. A comma-separated list of the most relevant evidence IDs from the provided cards/chunks
    
    Format your response as valid JSON with the following structure:
    {
      "impact": number,
      "summary": "string",
      "confidence": number,
      "evidenceIds": "string" // comma-separated IDs
    }
  `;
  
  try {
  const { choices } = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an analytical assistant.' },
      { role: 'user',   content: prompt },
    ],
    functions: [{
      name: 'set_matrix_summary',
      parameters: {
        type: 'object',
        properties: {
          impact: { 
            type: 'integer',
            description: 'Impact score from -5 (severe negative) to +5 (strong positive)'
          },
          summary: { 
            type: 'string',
            description: 'A concise 2-3 sentence summary explaining the reasoning'
          },
          confidence: { 
            type: 'number', 
            minimum: 0, 
            maximum: 1,
            description: 'Confidence score between 0 and 1'
          },
          evidenceIds: {
            type: 'string',
            description: 'Comma-separated list of the most relevant evidence IDs'
          }
        },
        required: ['impact', 'summary', 'confidence', 'evidenceIds']
      }
    }],
    function_call: { name: 'set_matrix_summary' }
  });

  if (!choices[0]?.message?.function_call?.arguments) {
    throw new Error('No function call result in OpenAI response');
  }
  
  // Parse the arguments from the function call
  const parsedResponse = JSON.parse(choices[0].message.function_call.arguments);
  
  // Validate impact score is in range
  const impact = Math.max(-5, Math.min(5, Math.round(parsedResponse.impact)));
  
  // Validate confidence score is in range
  const confidence = Math.max(0, Math.min(1, parsedResponse.confidence));
  
  return {
    impact,
    summary: parsedResponse.summary,
    confidence,
    evidenceIds: parsedResponse.evidenceIds
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
  }
) {
  try {
    await prisma.matrixAnalysisResult.update({
      where: {
        assetId_scenarioId: {
          assetId,
          scenarioId
        }
      },
      data: MatrixResultUpdateSchema.parse({
        impact: result.impact,
        summary: result.summary,
        confidence: result.confidence,
        evidenceIds: result.evidenceIds,
        status: 'completed',
        completedAt: new Date(),
        error: null
      })
    });
    
    workerLogger.info('Matrix analysis result saved', {
      assetId,
      scenarioId,
      impact: result.impact,
      confidence: result.confidence
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
