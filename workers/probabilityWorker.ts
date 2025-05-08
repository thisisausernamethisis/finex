import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/db';

// Set up the Redis connection
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Define job data interface
interface ProbabilityJobData {
  scenarioId: string;
}

// Initialize worker
const probabilityWorker = new Worker<ProbabilityJobData>(
  'scenario-probability',
  async (job: Job<ProbabilityJobData>) => {
    const { scenarioId } = job.data;
    
    try {
      // Find the probability theme for this scenario
      const probabilityTheme = await prisma.theme.findFirst({
        where: {
          scenarioId,
          themeType: 'PROBABILITY'
        }
      });
      
      if (!probabilityTheme) {
        throw new Error(`No probability theme found for scenario ${scenarioId}`);
      }
      
      // Determine which value to use
      const probabilityValue = probabilityTheme.useManualValue && probabilityTheme.manualValue !== null 
        ? probabilityTheme.manualValue / 100 // Convert from percentage to decimal
        : probabilityTheme.calculatedValue;
      
      if (probabilityValue === null) {
        throw new Error(`No valid probability value for scenario ${scenarioId}`);
      }
      
      // Update the scenario with the probability value
      await prisma.scenario.update({
        where: { id: scenarioId },
        data: { 
          probability: Math.max(0, Math.min(1, probabilityValue)) // Ensure value is between 0 and 1
        }
      });
      
      return { success: true, scenarioId };
    } catch (error) {
      console.error(`Error processing probability calculation for scenario ${scenarioId}:`, error);
      throw error;
    }
  },
  { connection }
);

// Set up event listeners
probabilityWorker.on('completed', (job) => {
  console.log(`Probability calculation job ${job.id} completed for scenario: ${job.data.scenarioId}`);
});

probabilityWorker.on('failed', (job, error) => {
  if (job) {
    console.error(`Probability calculation job ${job.id} failed for scenario: ${job.data.scenarioId}`, error);
  } else {
    console.error('Probability calculation job failed with unknown job data', error);
  }
});

// Prevent MaxListenersExceededWarning
if (probabilityWorker.events) {
  probabilityWorker.events.setMaxListeners(0);
}

export default probabilityWorker;
