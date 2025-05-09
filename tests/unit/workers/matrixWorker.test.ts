// @ts-nocheck
// TODO(T-173b): BullMQ job payload generics still any; unblock later
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Worker, Queue, QueueEvents, Job } from 'bullmq';
import { startMatrixWorker, processMatrixJob } from '../../../workers/matrixWorker';
import { assembleMatrixContext } from '../../../lib/services/contextAssemblyService';
import { prisma } from '../../../lib/db';

// Mock dependencies
vi.mock('../../../lib/db', () => ({
  prisma: {
    matrixAnalysisResult: {
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

vi.mock('../../../lib/services/contextAssemblyService', () => ({
  assembleMatrixContext: vi.fn()
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn(),
  Queue: vi.fn(),
  QueueEvents: vi.fn(() => ({
    setMaxListeners: vi.fn()
  }))
}));

// Mock fetch for OpenAI API calls
global.fetch = vi.fn();

describe('Matrix Worker', () => {
  const mockMatrixResult = {
    id: 'result1',
    assetId: 'asset1',
    scenarioId: 'scenario1',
    status: 'pending',
    impact: 0,
    evidenceIds: '',
    error: null
  };
  
  const mockJob = {
    id: 'job1',
    data: {
      assetId: 'asset1',
      scenarioId: 'scenario1'
    }
  } as unknown as Job;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup default mock implementations
    vi.mocked(prisma.matrixAnalysisResult.findUnique).mockResolvedValue(mockMatrixResult);
    vi.mocked(prisma.matrixAnalysisResult.update).mockResolvedValue({
      ...mockMatrixResult,
      status: 'completed'
    });
    
    vi.mocked(assembleMatrixContext).mockResolvedValue(
      'Test context for matrix analysis'
    );
    
    // Mock successful OpenAI API response
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [
          {
            message: {
              content: JSON.stringify({
                impact: 3,
                summary: 'This is a positive impact.',
                evidenceIds: 'card1,card2,card3'
              })
            }
          }
        ]
      })
    } as unknown as Response);
    
    // Mock environment variables
    process.env.OPENAI_API_KEY = 'test-api-key';
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  // TODO: Fix worker mock implementation - skipping temporarily
  it.skip('should start the matrix worker correctly', () => {
    startMatrixWorker();
    
    expect(Worker).toHaveBeenCalled();
    expect(QueueEvents).toHaveBeenCalled();
  });
  
  it('should update matrix status to processing when job starts', async () => {
    await processMatrixJob(mockJob);
    
    expect(prisma.matrixAnalysisResult.update).toHaveBeenCalledWith({
      where: {
        assetId_scenarioId: {
          assetId: 'asset1',
          scenarioId: 'scenario1'
        }
      },
      data: expect.objectContaining({
        status: 'processing'
      })
    });
  });
  
  it('should assemble context from asset and scenario data', async () => {
    await processMatrixJob(mockJob);
    
    expect(assembleMatrixContext).toHaveBeenCalledWith(
      'asset1', 
      'scenario1',
      expect.any(Number)
    );
  });
  
  it('should call the OpenAI API with the assembled context', async () => {
    await processMatrixJob(mockJob);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('openai.com'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key'
        }),
        body: expect.any(String)
      })
    );
    
    // Verify the payload includes our context
    const fetchCalls = vi.mocked(global.fetch).mock.calls;
    if (fetchCalls.length > 0 && fetchCalls[0][1] && typeof fetchCalls[0][1] === 'object') {
      const body = fetchCalls[0][1].body as string;
      if (body) {
        const payload = JSON.parse(body);
        expect(payload.messages[1].content).toContain('Test context for matrix analysis');
      }
    }
  });
  
  it('should save the matrix result with impact score from API response', async () => {
    await processMatrixJob(mockJob);
    
    expect(prisma.matrixAnalysisResult.update).toHaveBeenCalledWith({
      where: {
        assetId_scenarioId: {
          assetId: 'asset1',
          scenarioId: 'scenario1'
        }
      },
      data: expect.objectContaining({
        impact: 3,
        summary: 'This is a positive impact.',
        evidenceIds: 'card1,card2,card3',
        status: 'completed',
        completedAt: expect.any(Date),
        error: null
      })
    });
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: {
          message: 'API error'
        }
      })
    } as unknown as Response);
    
    // Should throw an error which will be caught
    await expect(processMatrixJob(mockJob)).rejects.toThrow();
    
    // Should update status to failed
    expect(prisma.matrixAnalysisResult.update).toHaveBeenCalledWith({
      where: {
        assetId_scenarioId: {
          assetId: 'asset1',
          scenarioId: 'scenario1'
        }
      },
      data: expect.objectContaining({
        status: 'failed',
        error: expect.stringContaining('API error')
      })
    });
  });
  
  it('should handle context assembly errors', async () => {
    // Mock context assembly error
    vi.mocked(assembleMatrixContext).mockRejectedValueOnce(
      new Error('Context assembly failed')
    );
    
    // Should throw an error which will be caught
    await expect(processMatrixJob(mockJob)).rejects.toThrow();
    
    // Should update status to failed
    expect(prisma.matrixAnalysisResult.update).toHaveBeenCalledWith({
      where: {
        assetId_scenarioId: {
          assetId: 'asset1',
          scenarioId: 'scenario1'
        }
      },
      data: expect.objectContaining({
        status: 'failed',
        error: expect.stringContaining('Context assembly failed')
      })
    });
  });
  
  it('should clamp impact scores to -5 to +5 range', async () => {
    // Mock API returning a score outside the range
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [
          {
            message: {
              content: JSON.stringify({
                impact: 10, // Outside valid range
                summary: 'Very positive impact.',
                evidenceIds: 'card1,card2'
              })
            }
          }
        ]
      })
    } as unknown as Response);
    
    await processMatrixJob(mockJob);
    
    // Should clamp to 5
    expect(prisma.matrixAnalysisResult.update).toHaveBeenCalledWith({
      where: {
        assetId_scenarioId: {
          assetId: 'asset1',
          scenarioId: 'scenario1'
        }
      },
      data: expect.objectContaining({
        impact: 5, // Clamped to max value
        status: 'completed'
      })
    });
  });
});
