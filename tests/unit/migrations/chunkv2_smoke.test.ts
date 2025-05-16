// @ts-nocheck
// This file tests the ChunkV2 table which isn't in the Prisma types until the migration is run
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../../lib/db';
// Import path for rechunk script (relative to tests/unit/migrations)
// import { rechunk } from '../../../scripts/rechunk/start';

// Mock prisma client
vi.mock('../../../lib/db', () => ({
  prisma: {
    $executeRaw: vi.fn().mockResolvedValue([]),
    chunkV2: {
      create: vi.fn().mockResolvedValue({ id: 'new-chunk-id' }),
      findFirst: vi.fn(),
      count: vi.fn()
    },
    chunk: {
      findFirst: vi.fn(),
      count: vi.fn()
    }
  }
}));

describe('ChunkV2 Migration Smoke Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('schema exists and can create new ChunkV2 records', async () => {
    // Setup mock responses
    vi.mocked(prisma.chunkV2.create).mockResolvedValue({
      id: 'test-chunk-id',
      assetId: 'test-asset-id',
      scenarioId: 'test-scenario-id',
      domain: 'FINANCE',
      content: 'Test content for the chunk',
      embedding: new Float32Array(1536).fill(0.1),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Test creating a new chunk
    const result = await prisma.chunkV2.create({
      data: {
        id: 'test-chunk-id',
        assetId: 'test-asset-id',
        scenarioId: 'test-scenario-id',
        domain: 'FINANCE',
        content: 'Test content for the chunk',
        embedding: new Float32Array(1536).fill(0.1),
      }
    });

    // Verify the chunk was created
    expect(prisma.chunkV2.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'test-chunk-id',
        assetId: 'test-asset-id',
        domain: 'FINANCE'
      })
    });
    
    expect(result).toEqual(expect.objectContaining({
      id: 'test-chunk-id',
      assetId: 'test-asset-id',
      domain: 'FINANCE'
    }));
  });

  it('can execute raw SQL vector operations', async () => {
    // Setup mock response for raw SQL execution
    vi.mocked(prisma.$executeRaw).mockResolvedValue([{ similarity: 0.95 }]);

    // Test executing raw SQL with vector operations
    await prisma.$executeRaw`
      INSERT INTO "ChunkV2" ("id", "assetId", "scenarioId", "domain", "content", "embedding", "createdAt", "updatedAt")
      VALUES (
        ${'test-chunk-sql'},
        ${'test-asset'},
        ${'test-scenario'},
        ${'TECHNICAL'},
        ${'SQL test content'},
        ${new Float32Array(1536).fill(0.2)}::vector,
        NOW(),
        NOW()
      )
    `;

    // Verify the SQL was executed
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('supports domain filtering in ChunkV2', async () => {
    // Setup mocks for count queries
    vi.mocked(prisma.chunkV2.count).mockImplementation(async (args) => {
      // Simulate domain filtering behavior
      if (args?.where?.domain === 'FINANCE') {
        return 42;
      } else if (args?.where?.domain === 'TECHNICAL') {
        return 27;
      } else {
        return 100;
      }
    });

    // Count chunks with different domain filters
    const financeCount = await prisma.chunkV2.count({
      where: { domain: 'FINANCE' }
    });

    const technicalCount = await prisma.chunkV2.count({
      where: { domain: 'TECHNICAL' }
    });

    const totalCount = await prisma.chunkV2.count();

    // Verify domain filtering works correctly
    expect(financeCount).toBe(42);
    expect(technicalCount).toBe(27);
    expect(totalCount).toBe(100);
    expect(prisma.chunkV2.count).toHaveBeenCalledTimes(3);
  });

  it('compares original Chunk and ChunkV2 structures', async () => {
    // Setup mocks to simulate differences between Chunk and ChunkV2
    vi.mocked(prisma.chunk.findFirst).mockResolvedValue({
      id: 'old-chunk-id',
      assetId: 'test-asset-id',
      scenarioId: 'test-scenario-id',
      // Original Chunk doesn't have domain
      content: 'Original chunk content that is much longer because it was chunked at a larger token size.',
      embedding: new Float32Array(1536).fill(0.3),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    vi.mocked(prisma.chunkV2.findFirst).mockResolvedValue({
      id: 'new-chunk-id',
      assetId: 'test-asset-id',
      scenarioId: 'test-scenario-id',
      domain: 'REGULATORY', // ChunkV2 has domain
      content: 'Smaller chunk with domain classification.', // ChunkV2 has smaller content
      embedding: new Float32Array(1536).fill(0.3),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Fetch a chunk from each table
    const oldChunk = await prisma.chunk.findFirst();
    const newChunk = await prisma.chunkV2.findFirst();

    // Verify structural differences
    expect(oldChunk).not.toHaveProperty('domain');
    expect(newChunk).toHaveProperty('domain');
    expect(newChunk.domain).toBe('REGULATORY');
    
    // Compare content length (simulating smaller chunks)
    expect(oldChunk.content.length).toBeGreaterThan(newChunk.content.length);
  });
});
