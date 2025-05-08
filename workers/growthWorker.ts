import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/db';
import { updateAssetGrowthValue } from '../lib/services/growthRiskService';

// Set up the Redis connection
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Define job data interface
interface GrowthJobData {
  assetId: string;
}

// Initialize worker
const growthWorker = new Worker<GrowthJobData>(
  'asset-growth',
  async (job: Job<GrowthJobData>) => {
    const { assetId } = job.data;
    
    try {
      // Update the asset's growth value based on its growth theme
      await updateAssetGrowthValue(assetId);
      
      return { success: true, assetId };
    } catch (error) {
      console.error(`Error processing growth calculation for asset ${assetId}:`, error);
      throw error;
    }
  },
  { connection }
);

// Set up event listeners
growthWorker.on('completed', (job) => {
  console.log(`Growth calculation job ${job.id} completed for asset: ${job.data.assetId}`);
});

growthWorker.on('failed', (job, error) => {
  if (job) {
    console.error(`Growth calculation job ${job.id} failed for asset: ${job.data.assetId}`, error);
  } else {
    console.error('Growth calculation job failed with unknown job data', error);
  }
});

// Prevent MaxListenersExceededWarning
if (growthWorker.events) {
  growthWorker.events.setMaxListeners(0);
}

export default growthWorker;
