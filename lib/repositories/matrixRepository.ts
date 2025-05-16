import { Container, TOKEN_PRISMA } from '../container';
import { logger } from '../logger';
import { matrixQueueService } from '../services/matrixQueueService';
import { Queue } from 'bullmq';
import type { QueueOptions } from 'bullmq';
import type { PrismaClient, MatrixAnalysisResult, Prisma } from '@prisma/client';

// Maximum page size allowed, can be overridden by environment variable
const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE || '50', 10);

// Create a repository-specific logger
const repoLogger = logger.child({ component: 'MatrixRepository' });

// Redis connection options for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Define paginated response type
export interface PaginatedMatrixResults {
  items: MatrixAnalysisResult[];
  total: number;
}

// Define job response type
export interface MatrixAnalysisJob {
  jobId: string;
  status: string;
}

/**
 * Repository for Matrix Analysis operations
 */
export class MatrixRepository {
  // BullMQ queue for matrix analysis jobs
  private matrixQueue: Queue;
  
  constructor(private readonly prisma: PrismaClient = Container.get<PrismaClient>(TOKEN_PRISMA)) {
    // Initialize the BullMQ queue
    this.matrixQueue = new Queue('matrix-analysis', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: 100
      }
    } as QueueOptions);
  }
  
  /**
   * Retrieves a list of matrix analysis results with pagination
   * Optionally filtered by asset or scenario
   * 
   * @param userId The ID of the user requesting the results (for access control)
   * @param page The page number (1-indexed)
   * @param limit The number of items per page
   * @param assetId Optional asset ID to filter by
   * @param scenarioId Optional scenario ID to filter by
   * @returns A paginated list of matrix analysis results
   */
  public async listMatrixResults(
    userId: string,
    page: number = 1,
    limit: number = 10,
    assetId?: string,
    scenarioId?: string
  ): Promise<PaginatedMatrixResults> {
    // Clamp limit to prevent excessive queries
    const clampedLimit = Math.min(limit, MAX_PAGE_SIZE);
    const skip = (page - 1) * clampedLimit;
    
    repoLogger.debug('Listing matrix results', { 
      userId, 
      page, 
      limit: clampedLimit, 
      assetId,
      scenarioId
    });
    
    // Build the where clause
    const where: Prisma.MatrixAnalysisResultWhereInput = {};
    
    // Add filters if provided
    if (assetId) {
      where.assetId = assetId;
    }
    
    if (scenarioId) {
      where.scenarioId = scenarioId;
    }
    
    // Get the total count
    const total = await this.prisma.matrixAnalysisResult.count({ where });
    
    // Get the matrix results for this page
    const results = await this.prisma.matrixAnalysisResult.findMany({
      where,
      select: {
        id: true,
        assetId: true,
        scenarioId: true,
        impact: true,
        summary: true,
        evidenceIds: true,
        status: true,
        error: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: clampedLimit
    });
    
    return {
      items: results as MatrixAnalysisResult[],
      total
    };
  }
  
  /**
   * Retrieves a single matrix analysis result by asset and scenario IDs
   * 
   * @param assetId The ID of the asset
   * @param scenarioId The ID of the scenario
   * @returns The matrix analysis result if found, null otherwise
   */
  public async getMatrixResult(
    assetId: string,
    scenarioId: string
  ): Promise<MatrixAnalysisResult | null> {
    repoLogger.debug('Getting matrix result', { assetId, scenarioId });
    
    return this.prisma.matrixAnalysisResult.findUnique({
      where: {
        assetId_scenarioId: { assetId, scenarioId }
      },
      select: {
        id: true,
        assetId: true,
        scenarioId: true,
        impact: true,
        summary: true,
        evidenceIds: true,
        confidence: true,
        status: true,
        error: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true
      }
    }) as Promise<MatrixAnalysisResult | null>;
  }
  
  /**
   * Creates or queues a new matrix analysis
   * Enhanced with search metrics for improved confidence calculation
   * 
   * @param assetId The ID of the asset to analyze
   * @param scenarioId The ID of the scenario to analyze against
   * @param query Optional search query for retrieving evidence
   * @returns Information about the queued job
   */
  public async queueMatrixAnalysis(
    assetId: string,
    scenarioId: string,
    query?: string
  ): Promise<MatrixAnalysisJob> {
    repoLogger.debug('Queueing matrix analysis', { assetId, scenarioId, hasQuery: !!query });
    
    // Find existing or create new matrix result record
    let result = await this.prisma.matrixAnalysisResult.findUnique({
      where: {
        assetId_scenarioId: { assetId, scenarioId }
      }
    });
    
    if (result) {
      // Update status to pending
      await this.prisma.matrixAnalysisResult.update({
        where: { id: result.id },
        data: {
          status: 'pending',
          error: null
        }
      });
    } else {
      // Create new matrix result record
      result = await this.prisma.matrixAnalysisResult.create({
        data: {
          assetId,
          scenarioId,
          impact: 0,
          evidenceIds: '',
          confidence: 0,
          status: 'pending'
        }
      });
    }
    
    // Use matrixQueueService to enqueue job with search metrics if query is provided
    const jobId = await matrixQueueService.enqueueMatrixJob({
      assetId,
      scenarioId,
      query
    });
    
    repoLogger.info('Matrix analysis job queued', { 
      jobId, 
      assetId, 
      scenarioId 
    });
    
    return {
      jobId,
      status: 'pending'
    };
  }
  
  /**
   * Checks if a matrix result exists
   * 
   * @param assetId The ID of the asset
   * @param scenarioId The ID of the scenario
   * @returns True if the matrix result exists, false otherwise
   */
  public async matrixResultExists(
    assetId: string,
    scenarioId: string
  ): Promise<boolean> {
    const count = await this.prisma.matrixAnalysisResult.count({
      where: {
        AND: [
          { assetId },
          { scenarioId }
        ]
      }
    });
    return count > 0;
  }
}
