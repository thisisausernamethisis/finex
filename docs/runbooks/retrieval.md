# Finex Retrieval Runbook

This document provides operational procedures for managing the Finex retrieval system.

## Table of Contents

- [Indexes and Chunks](#indexes-and-chunks)
- [Re-chunk batch](#re-chunk-batch)
- [Troubleshooting](#troubleshooting)

## Indexes and Chunks

### Overview

The retrieval system uses vector embeddings to find relevant information in asset content. The system has two types of chunks:

1. **Legacy Chunks** (`Chunk` model): Original implementation with basic metadata
2. **ChunkV2** (`ChunkV2` model): Enhanced implementation with domain awareness and improved embeddings

### Monitoring Index Health

1. Check index statistics:

```sql
SELECT count(*) FROM chunk;
SELECT count(*) FROM "chunkV2";
```

2. Validate embedding distribution:

```sql
SELECT 
  count(*) as total_chunks,
  count(*) filter (where embedding is not null) as with_embedding,
  count(*) filter (where embedding is null) as without_embedding
FROM "chunkV2";
```

3. Check domain distribution:

```sql
SELECT domain, count(*) 
FROM "chunkV2" 
GROUP BY domain 
ORDER BY count(*) DESC;
```

## Re-chunk batch

The system includes tools to migrate from legacy chunks to ChunkV2, with improved embeddings and domain categorization.

### Running the rechunker tool

To run the re-chunk process:

```bash
# Dry run to see what will be processed (no changes made)
pnpm ts-node scripts/rechunk/start.ts --dry-run

# Limit to first 100 chunks for testing
pnpm ts-node scripts/rechunk/start.ts --dry-run --limit 100

# Process all chunks
pnpm ts-node scripts/rechunk/start.ts
```

### Enabling automatic re-chunking

To enable automatic re-chunking when new content is added:

1. Set environment variable:

```
RECHUNK_ON_WRITE=1
```

2. Ensure the rechunk worker is running:

```bash
pnpm ts-node workers/rechunkWorker.ts
```

### Monitoring progress

1. Check re-chunking status:

```sql
SELECT 
  count(*) as total_legacy_chunks,
  (SELECT count(*) FROM "chunkV2") as total_v2_chunks,
  count(*) - (SELECT count(*) FROM "chunkV2") as remaining  
FROM chunk;
```

2. Check worker logs:

```
tail -f logs/rechunk-worker.log
```

## Troubleshooting

### Missing Embeddings

If chunks are missing embeddings:

1. Check embedding service health
2. Run the re-chunk process with focus on chunks without embeddings:

```sql
-- Find chunks without embeddings
SELECT id FROM "chunkV2" WHERE embedding IS NULL;
```

### Slow Vector Searches

If vector searches are slow:

1. Check index status:

```sql
SELECT * FROM pg_indexes WHERE tablename = 'chunkV2';
```

2. Consider rebuilding the index:

```sql
-- Example: rebuild IVFFlat index with improved parameters
-- Consult DBA before running this in production
REINDEX INDEX chunkv2_embedding_idx;
```

### Dead Letter Queue

If chunks fail during processing:

1. Check the dead letter queue:

```bash
pnpm ts-node workers/utils/dlqDrain.ts --list rechunk-dlq
```

2. Retry failed jobs:

```bash
pnpm ts-node workers/utils/dlqDrain.ts --retry rechunk-dlq
```
