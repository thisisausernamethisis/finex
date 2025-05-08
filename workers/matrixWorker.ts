import { Worker, Job, QueueEvents } from 'bullmq';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { assembleMatrixContext } from '../lib/services/contextAssemblyService';
import { jobsProcessed, jobsFailed, jobsActive } from '../lib/metrics';
import { emitJobEvent } from '../lib/events/eventEmitter';

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
    3. A comma-separated list of the most relevant evidence IDs from the provided cards/chunks
    
    Format your response as valid JSON with the following structure:
    {
      "impact": number,
      "summary": "string",
      "evidenceIds": "string" // comma-separated IDs
    }
  `;
  
  try {
    // Check if API key is set
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    
    // Prepare the request payload
    const payload = {
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a financial analysis assistant that provides accurate impact assessments.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      response_format: { type: 'json_object' }
    };
    
    // Make the API request
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const responseData = await response.json();
    const responseContent = responseData.choices[0]?.message?.content || '';
    
    if (!responseContent) {
      throw new Error('Empty response from OpenAI API');
    }
    
    // Parse response
    const parsedResponse = JSON.parse(responseContent);
    
    // Validate impact score is in range
    const impact = Math.max(-5, Math.min(5, Math.round(parsedResponse.impact)));
    
    return {
      impact,
      summary: parsedResponse.summary,
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
      data: {
        impact: result.impact,
        summary: result.summary,
        evidenceIds: result.evidenceIds,
        status: 'completed',
        completedAt: new Date(),
        error: null
      }
    });
    
    workerLogger.info('Matrix analysis result saved', {
      assetId,
      scenarioId,
      impact: result.impact
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
