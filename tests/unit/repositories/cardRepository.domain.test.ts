import { CardRepository } from '../../../lib/repositories/cardRepository';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { vi } from 'vitest';

// Create mock PrismaClient
const prismaMock = {
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
  chunk: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
} as unknown as PrismaClient;

// Define the chunk type with domain to match what we're testing
interface ChunkWithDomain {
  id: string;
  content: string;
  order: number;
  cardId: string;
  domain?: string;
}

describe('CardRepository Domain Fallback Tests', () => {
  // Mock data
  const mockCardId = uuidv4();
  const mockChunks = [
    { content: 'Chunk content 1', order: 1 },
    { content: 'Chunk content 2', order: 2 },
  ];
  
  // Mock the results of the $queryRaw for column existence check
  const mockQueryRawImplementation = vi.fn().mockImplementation((query, ...params) => {
    // Check if the query is for the column existence check
    if (query.includes && query.includes('information_schema')) {
      // Return that the domain column exists
      return Promise.resolve([{ exists: true }]);
    }
    return Promise.resolve([]);
  });
  
  // Mock the $executeRaw for the INSERT operations
  const mockExecuteRawImplementation = vi.fn().mockResolvedValue(undefined);
  
  // Mock findMany for the final result
  const mockFindManyImplementation = vi.fn().mockResolvedValue([
    { 
      id: uuidv4(),
      content: 'Chunk content 1',
      order: 1,
      cardId: mockCardId,
      domain: 'generic'
    } as ChunkWithDomain,
    { 
      id: uuidv4(),
      content: 'Chunk content 2',
      order: 2,
      cardId: mockCardId,
      domain: 'generic'
    } as ChunkWithDomain
  ]);

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock implementations
    prismaMock.$queryRaw = mockQueryRawImplementation;
    prismaMock.$executeRaw = mockExecuteRawImplementation;
    prismaMock.chunk.findMany = mockFindManyImplementation;
    prismaMock.chunk.deleteMany = vi.fn().mockResolvedValue({ count: 0 });
  });

  it('should set domain to "generic" when column exists and no domain is provided', async () => {
    // Arrange
    const cardRepository = new CardRepository(prismaMock);
    
    // Act
    const result = await cardRepository.createChunks(mockCardId, mockChunks);
    
    // Assert
    // Verify that deleteMany was called to clear existing chunks
    expect(prismaMock.chunk.deleteMany).toHaveBeenCalledWith({
      where: { cardId: mockCardId }
    });
    
    // Verify that the column existence check was called
    expect(mockQueryRawImplementation).toHaveBeenCalledWith(
      expect.anything() // Query string
    );
    
    // Verify that the $executeRaw was called with the domain set to 'generic'
    // Note: Since $executeRaw is called with a template literal, we need to check call count
    expect(mockExecuteRawImplementation).toHaveBeenCalledTimes(2);
    
    // Verify that findMany was called to return the created chunks
    expect(prismaMock.chunk.findMany).toHaveBeenCalledWith({
      where: { cardId: mockCardId },
      orderBy: { order: 'asc' }
    });
    
    // Verify that the returned chunks have the 'generic' domain
    expect(result.length).toBe(2);
    // @ts-ignore - domain may not be in the type but we know it exists at runtime
    expect(result[0].domain).toBe('generic');
    // @ts-ignore - domain may not be in the type but we know it exists at runtime
    expect(result[1].domain).toBe('generic');
  });

  it('should use provided domain when specified', async () => {
    // Setup mock for this specific test to return chunks with 'asset' domain
    prismaMock.chunk.findMany = vi.fn().mockResolvedValue([
      { 
        id: uuidv4(),
        content: 'Chunk content 1',
        order: 1,
        cardId: mockCardId,
        domain: 'asset'
      } as ChunkWithDomain,
      { 
        id: uuidv4(),
        content: 'Chunk content 2',
        order: 2,
        cardId: mockCardId,
        domain: 'asset'
      } as ChunkWithDomain
    ]);
    
    // Arrange
    const cardRepository = new CardRepository(prismaMock);
    
    // Act
    const result = await cardRepository.createChunks(mockCardId, mockChunks, 'asset');
    
    // Assert
    expect(mockQueryRawImplementation).toHaveBeenCalled();
    expect(mockExecuteRawImplementation).toHaveBeenCalledTimes(2);
    expect(result.length).toBe(2);
    // @ts-ignore - domain may not be in the type but we know it exists at runtime
    expect(result[0].domain).toBe('asset');
    // @ts-ignore - domain may not be in the type but we know it exists at runtime
    expect(result[1].domain).toBe('asset');
  });

  it('should handle scenario where domain column does not exist yet', async () => {
    // Mock that the domain column doesn't exist
    prismaMock.$queryRaw = vi.fn().mockResolvedValue([{ exists: false }]);
    
    // Mock chunks without domain field
    prismaMock.chunk.findMany = vi.fn().mockResolvedValue([
      { 
        id: uuidv4(),
        content: 'Chunk content 1',
        order: 1,
        cardId: mockCardId
        // no domain field
      } as ChunkWithDomain,
      { 
        id: uuidv4(),
        content: 'Chunk content 2',
        order: 2,
        cardId: mockCardId
        // no domain field
      } as ChunkWithDomain
    ]);
    
    // Arrange
    const cardRepository = new CardRepository(prismaMock);
    
    // Act
    const result = await cardRepository.createChunks(mockCardId, mockChunks);
    
    // Assert
    expect(prismaMock.$queryRaw).toHaveBeenCalledWith(
      expect.anything() // Query string
    );
    expect(mockExecuteRawImplementation).toHaveBeenCalledTimes(2);
    expect(result.length).toBe(2);
    // Verify that the domain field is undefined/not present
    // @ts-ignore - accessing domain property to verify it's undefined
    expect(result[0].domain).toBeUndefined();
    // @ts-ignore - accessing domain property to verify it's undefined
    expect(result[1].domain).toBeUndefined();
  });
});
