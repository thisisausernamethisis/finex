# Database Runbook

This document provides operational guidance for the PostgreSQL database that powers Finex Bot, including the pgvector extension for vector similarity search.

## Database Overview

Finex Bot uses PostgreSQL with the pgvector extension for:

- Standard relational data storage
- Full-text search using tsvector/tsquery
- Vector embeddings storage and similarity search

## Connection Information

### Connection Strings

Two distinct connection strings are used:

- **DATABASE_URL**: Used by the application at runtime. Includes the pgbouncer parameter for connection pooling.
- **DIRECT_URL**: Used for migrations and database schema management.

Example:
```
DATABASE_URL="postgres://user:pass@neon.db.../finex?pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgres://user:pass@neon.db.../finex"
```

### Neon Connection Limits

When using Neon managed PostgreSQL:

- Free tier: 15 concurrent connections max
- Standard tier: 100+ concurrent connections

Be mindful of connection limits, especially with background workers that may each open a separate connection.

## Schema Management

### Migrations

Migrations are managed with Prisma:

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (warning: destroys all data)
npx prisma migrate reset
```

**Important**: Always use the `DIRECT_URL` for migrations, not the pooled connection.

### Seeding Data

Seed the database with test data:

```bash
make db:seed
```

## 2025-05-13 Domain migration & ivfflat index

This migration adds a Domain enum column to the Chunk model to enable content categorization and filtered searches.

### What changed

1. Added `Domain` enum type with values: `ASSET`, `SUPPLY_CHAIN`, `GEOGRAPHY`, and `OTHER`
2. Added `domain` column to `Chunk` table with a default of `OTHER`
3. Created a specialized composite ivfflat index for optimized domain-filtered vector searches
4. Implemented post-migration backfill script to categorize existing chunks

### Migration steps

The migration script:

```sql
-- Create Domain enum type
CREATE TYPE "Domain" AS ENUM ('ASSET', 'SUPPLY_CHAIN', 'GEOGRAPHY', 'OTHER');

-- Add domain column to Chunk table with NOT NULL and default
ALTER TABLE "Chunk" ADD COLUMN "domain" "Domain" NOT NULL DEFAULT 'OTHER';

-- Create composite ivfflat index optimized for domain filtering
CREATE INDEX "chunk_vec_domain_idx" ON "Chunk" USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100) WHERE domain <> 'OTHER';
```

### Backfill process

After applying the migration, a post-deploy hook automatically runs the backfill script which:

1. Processes chunks in batches to avoid memory issues
2. Applies a three-rule heuristic to categorize content:
   - ASSET: Financial content, company information
   - SUPPLY_CHAIN: Logistics, inventory, manufacturing
   - GEOGRAPHY: Locations, regions, international markets
3. Updates the domain column for each chunk
4. Logs statistics showing categorization distribution

### Search improvements

Vector searches can now include a domain filter:

```sql
SELECT ch.card_id, 1 - (ch.embedding <=> ${query_vector}::vector) as similarity
FROM "Chunk" ch
WHERE ch.embedding IS NOT NULL AND ch.domain = 'ASSET'
ORDER BY similarity DESC
LIMIT 20;
```

## pgvector Usage

### Creating Vectors

Vectors are stored in the `Chunk.embedding` field with type `vector(1536)`.

Example query to create a new embedding:

```sql
INSERT INTO "Chunk" (id, content, order, embedding, "cardId")
VALUES (
  'cuid_here',
  'The text content of the chunk',
  1,
  '[0.1, 0.2, ..., 0.3]'::vector,
  'card_id_here'
);
```

### Vector Similarity Search

Example query for similarity search:

```sql
SELECT ch.card_id, 1 - (ch.embedding <=> '[0.1, 0.2, ..., 0.3]'::vector) as similarity
FROM "Chunk" ch
WHERE ch.embedding IS NOT NULL
ORDER BY similarity DESC
LIMIT 10;
```

### Hybrid Search

Finex Bot uses hybrid search combining traditional text search with vector search:

```sql
-- Text search
SELECT c.id, ts_rank(to_tsvector('english', c.content), to_tsquery('english', 'query')) as rank
FROM "Card" c
WHERE to_tsvector('english', c.content) @@ to_tsquery('english', 'query')
ORDER BY rank DESC
LIMIT 10;

-- Vector search
SELECT ch.card_id, 1 - (ch.embedding <=> vector_from_embedding) as similarity
FROM "Chunk" ch
ORDER BY similarity DESC
LIMIT 10;
```

The results are combined using Reciprocal Rank Fusion (RRF) with k=60.

## Performance Monitoring

Key metrics to monitor:

- Connection count: `SELECT count(*) FROM pg_stat_activity;`
- Slow queries: `SELECT * FROM pg_stat_activity WHERE state = 'active' AND (now() - query_start) > interval '5 seconds';`
- Index usage: `SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;`
- Table size: `SELECT pg_size_pretty(pg_total_relation_size('public."Card"'));`

## Backup and Restore

### Backup

With Neon, point-in-time recovery is available via console.

For manual backups:

```bash
pg_dump postgres://user:pass@neon.db.../finex > finex_backup.sql
```

### Restore

```bash
psql postgres://user:pass@neon.db.../finex < finex_backup.sql
```

## Common Issues

### P1001 Can't Reach Database Error

**Symptom**: Prisma migration fails with P1001 error.

**Cause**: Using pooled URL for migrations.

**Fix**: Set `DIRECT_URL` environment variable and use it for migrations.

### Connection Pool Exhaustion

**Symptom**: "too many clients already" error.

**Fix**:
- Check for connection leaks in the application
- Implement appropriate connection pooling
- Review worker concurrency settings
- Consider upgrading your database plan

### Vector Search Performance Issues

**Symptom**: Slow vector similarity searches.

**Fix**:
- Ensure vector indexes are created: `CREATE INDEX ON "Chunk" USING ivfflat (embedding vector_cosine_ops);`
- Optimize vector dimensionality if possible
- Ensure vectors are properly normalized
