import { logger } from '../lib/logger';
import { startMatrixWorker } from './matrixWorker';
import { startTechnologyCategorizationWorker } from './technologyCategorizationWorker';
import { startPortfolioInsightWorker } from './portfolioInsightWorker';

// Main logger for workers
const workerLogger = logger.child({ component: 'WorkerManager' });

/**
 * Start all background workers
 */
function startAllWorkers() {
  workerLogger.info('Starting all background workers');
  
  try {
    // Start matrix analysis worker
    const matrixWorker = startMatrixWorker();
    workerLogger.info('Matrix worker started');
    
    // Start technology categorization worker
    const techCategorizationWorker = startTechnologyCategorizationWorker();
    workerLogger.info('Technology categorization worker started');
    
    // Start portfolio insight worker
    const portfolioInsightWorker = startPortfolioInsightWorker();
    workerLogger.info('Portfolio insight worker started');
    
    // Growth worker and Probability worker would be started here
    // when they are implemented
    workerLogger.info('Growth and Probability workers not yet implemented');
    
    // Handle process shutdown
    process.on('SIGTERM', async () => {
      workerLogger.info('SIGTERM received, shutting down workers gracefully');
      
      // Close matrix worker if it exists
      if (matrixWorker) {
        await matrixWorker.close();
        workerLogger.info('Matrix worker closed');
      }
      
      // Close technology categorization worker if it exists
      if (techCategorizationWorker) {
        await techCategorizationWorker.close();
        workerLogger.info('Technology categorization worker closed');
      }
      
      // Close portfolio insight worker if it exists
      if (portfolioInsightWorker) {
        await portfolioInsightWorker.close();
        workerLogger.info('Portfolio insight worker closed');
      }
      
      process.exit(0);
    });
    
    // Log successful startup
    workerLogger.info('All workers started successfully');
  } catch (error) {
    workerLogger.error('Failed to start workers', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// If this file is executed directly, start all workers
if (require.main === module) {
  startAllWorkers();
}

export { startAllWorkers };
