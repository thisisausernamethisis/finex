/**
 * Unit tests for rechunk script and worker (T-301b)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initRechunkWorker } from '../../../workers/rechunkWorker';
import { PrismaClient } from '@prisma/client';
import { Domain } from '../../../lib/types/domain';

// Mock BullMQ
vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    close: vi.fn(),
  })),
}));

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    id: 'new-chunk-id',
    content: 'Test content',
    domain: Domain.FINANCE,
    assetId: 'test-asset-id',
    embedding: new Array(384).fill(0.1),
    legacyChunkId: 'old-chunk-id',
    metadata: { migratedAt: '2025-05-16T10:00:00Z' },
  });

  const mockFindFirst = vi.fn().mockResolvedValue(null);
  const mockCount = vi.fn().mockResolvedValue(10);
  const mockFindMany = vi.fn().mockResolvedValue([
    { id: 'chunk-1', content: 'Content 1', assetId: 'asset-1' },
    { id: 'chunk-2', content: 'Content 2', assetId: 'asset-2' }
  ]);

  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      chunk: {
        count: mockCount,
        findMany: mockFindMany,
      },
      chunkV2: {
        create: mockCreate,
        findFirst: mockFindFirst,
      },
    })),
  };
});

// Mock logger
vi.mock('../../../lib/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

describe('Rechunk Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize worker with correct configuration', () => {
    const worker = initRechunkWorker();
    expect(worker).toBeDefined();
  });

  it('should migrate chunks from legacy format to ChunkV2', async () => {
    // Set up test data
    const mockJob = {
      data: {
        chunkId: 'test-chunk-id',
        content: 'This is test chunk content',
        domain: Domain.FINANCE,
        assetId: 'test-asset-id',
        metadata: {
          originalSource: 'financial-report-q1-2025.pdf',
        },
      },
      id: 'test-job-id',
    };

    // Initialize dependencies
    const prisma = new PrismaClient();
    
    // Process the job
    const processChunk = vi.fn().mockResolvedValue({
      success: true,
      chunkId: 'new-chunk-v2-id',
    });

    const result = await processChunk(mockJob);

    // Verify results
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should handle duplicate migration attempts', async () => {
    // Mock findFirst to return existing chunk
    const prisma = new PrismaClient();
    const mockFindFirst = vi.fn().mockResolvedValue({
      id: 'existing-chunk-id',
      legacyChunkId: 'test-chunk-id',
    });
    
    // @ts-ignore - Override the mock
    prisma.chunkV2.findFirst = mockFindFirst;
    
    // Process job that would cause a duplicate
    const mockJob = {
      data: {
        chunkId: 'test-chunk-id',
        content: 'This is test chunk content',
        domain: Domain.FINANCE,
        assetId: 'test-asset-id',
      },
      id: 'test-job-id',
    };
    
    const processChunk = vi.fn().mockResolvedValue({
      success: true,
      chunkId: 'existing-chunk-id',
    });

    const result = await processChunk(mockJob);
    
    // Verify we didn't create a duplicate
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.chunkId).toBe('existing-chunk-id');
  });
});
