import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enqueueMatrixJob } from '../../workers/matrixQueueProducer';
import { searchService } from '../../lib/services/searchService';
import { matrixQueue } from '../../workers/queues';

// Mock dependencies
vi.mock('../../lib/services/searchService', () => ({
  searchService: {
    hybridSearch: vi.fn()
  }
}));

vi.mock('../../workers/queues', () => ({
  matrixQueue: {
    add: vi.fn()
  }
}));

describe('Matrix Queue Producer Diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include both new and legacy property names in queue job', async () => {
    // Create mock search results with diagnostics
    const mockResults = [{ id: 'chunk1', score: 0.9 }];
    
    // Add non-enumerable properties to the results array
    Object.defineProperties(mockResults, {
      retrievalVariance: { value: 0.75, enumerable: false },
      rankCorrelation: { value: 0.85, enumerable: false },
      retrievalVar: { value: 0.75, enumerable: false }, // should be same as retrievalVariance
      rankCorr: { value: 0.85, enumerable: false } // should be same as rankCorrelation
    });
    
    // Mock the search service to return our results
    vi.mocked(searchService.hybridSearch).mockResolvedValue(mockResults);
    
    // Call the function under test
    await enqueueMatrixJob({
      assetId: 'asset123',
      scenarioId: 'scenario456',
      query: 'test query'
    });
    
    // Verify both sets of property names are passed to the queue
    expect(matrixQueue.add).toHaveBeenCalledWith(
      'matrix-run',
      expect.objectContaining({
        retrievalVariance: 0.75,
        retrievalVar: 0.75,
        rankCorrelation: 0.85,
        rankCorr: 0.85
      })
    );
  });

  it('should use fallback values when diagnostics are missing', async () => {
    // Create mock search results without diagnostics
    const mockResults = [{ id: 'chunk1', score: 0.9 }];
    
    // Mock the search service to return our results
    vi.mocked(searchService.hybridSearch).mockResolvedValue(mockResults);
    
    // Call the function under test
    await enqueueMatrixJob({
      assetId: 'asset123',
      scenarioId: 'scenario456',
      query: 'test query'
    });
    
    // Verify fallback values are used
    expect(matrixQueue.add).toHaveBeenCalledWith(
      'matrix-run',
      expect.objectContaining({
        retrievalVariance: 0.5,
        retrievalVar: 0.5,
        rankCorrelation: 0.5,
        rankCorr: 0.5
      })
    );
  });

  it('should prefer retrievalVariance over retrievalVar when both exist', async () => {
    // Create mock search results with different values for new and legacy properties
    const mockResults = [{ id: 'chunk1', score: 0.9 }];
    
    // Add non-enumerable properties with different values
    Object.defineProperties(mockResults, {
      retrievalVariance: { value: 0.75, enumerable: false },
      retrievalVar: { value: 0.65, enumerable: false },
      rankCorrelation: { value: 0.85, enumerable: false },
      rankCorr: { value: 0.75, enumerable: false }
    });
    
    // Mock the search service to return our results
    vi.mocked(searchService.hybridSearch).mockResolvedValue(mockResults);
    
    // Call the function under test
    await enqueueMatrixJob({
      assetId: 'asset123',
      scenarioId: 'scenario456',
      query: 'test query'
    });
    
    // Verify new property names are preferred but both are passed
    expect(matrixQueue.add).toHaveBeenCalledWith(
      'matrix-run',
      expect.objectContaining({
        retrievalVariance: 0.75,
        retrievalVar: 0.75,  // Should be set to match retrievalVariance
        rankCorrelation: 0.85,
        rankCorr: 0.85  // Should be set to match rankCorrelation
      })
    );
  });
});
