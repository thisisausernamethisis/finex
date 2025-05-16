# Finex Retrieval System Runbook

This runbook provides operational guidelines for managing Finex's retrieval system (v0.20+).

## Architecture Overview

The retrieval system consists of these main components:

1. **Chunking Pipeline**: Breaks documents into ~256 token chunks
2. **Embedding Generation**: Creates vector embeddings for each chunk
3. **Hybrid Search**: Combines BM25 (keyword) + Vector (semantic) search
4. **Dynamic α Parameter**: Auto-adjusts the weight between BM25 and vector search
5. **Domain Filtering**: Narrows search to specific knowledge domains

## Components

### 1. Chunking System

The system splits document content into chunks targeting ~256 tokens, maintaining document coherence and context.

- **Location**: `scripts/rechunk/rechunk.ts`
- **Cron Job**: `ops/cron/rechunk.yml` (runs weekly)
- **Target Size**: 256 tokens ±15%
- **Domain Preservation**: Each chunk inherits the domain of its parent document

### 2. Vector Search

- **Location**: `lib/clients/vectorClient.ts`
- **Index Type**: IVFFlat (Inverted File with Flat compression)
- **Vector Size**: 1536 dimensions
- **Query Command**: `prisma.$queryRaw` with cosine similarity

### 3. Hybrid Search

- **Location**: `lib/services/searchService.ts`
- **Method**: Reciprocal Rank Fusion (RRF)
- **Parameters**:
  - `alpha`: Weight between BM25 (α) and vector (1-α)
  - `domain`: Optional array of domain filters
  - `limit`: Maximum number of results (default: 20)

### 4. Dynamic α Parameter

- **Location**: `lib/utils/alphaScorer.ts`
- **Heuristic Factors**:
  - Query length
  - Presence of domain-specific terminology
  - Number of exact matches in document corpus
- **Override Flag**: `DYNAMIC_ALPHA_GPT` env var enables GPT-based scoring

## Operations

### Reindexing Process

To manually trigger a reindexing of the corpus:

```bash
# Trigger rechunking
npm run rechunk

# Check progress
npm run queue:stats -- --queue=chunk-reindex
```

### Monitoring

Monitor retrieval system health with these metrics:

1. **Latency**: P95 should remain under 50ms for combined search
2. **Cache Hit Rate**: Should exceed 80% for common queries
3. **RAGAS Score**: Should exceed 0.85 composite score
4. **CPU/Memory**: Vector operations can be resource-intensive

### Troubleshooting

#### High Latency

1. Check database connection pool
2. Verify index health: `ANALYZE "Chunk";`
3. Check caching effectiveness
4. Consider scaling up database resources

#### Poor Relevance

1. Verify embedding quality
2. Check α parameter settings
3. Run `npm run rag:eval` to evaluate relevance metrics
4. Consider tuning the chunk size

#### Missing Results

1. Check domain filter configuration
2. Verify all documents are properly chunked and embedded
3. Check for database schema mismatches
4. Examine logs for indexing failures

## Maintenance Tasks

### Regular Maintenance

1. **Weekly**: Review retrieval latency metrics
2. **Monthly**: Run full RAG evaluation
3. **Quarterly**: Consider complete reindexing with latest embedding model

### Emergency Procedures

1. **Degraded Results**: Temporarily disable dynamic α (set `SEARCH_ALPHA=0.5`)
2. **Catastrophic Failure**: Fall back to BM25-only mode (`SEARCH_ALPHA=1.0`)

## Configuration

Key environment variables:

```
# Search parameters
SEARCH_ALPHA=0.3                # Default α weight (0-1)
DYNAMIC_ALPHA=true              # Enable dynamic α scoring
DYNAMIC_ALPHA_GPT=false         # Enable GPT-based α advisor
SEARCH_CACHE_TTL=3600           # Search cache TTL in seconds
SEARCH_DOMAIN_FILTER=true       # Enable domain filtering

# Alpha Mode Configuration
FINEX_ALPHA_MODE=heuristic      # Options: 'heuristic' (default) or 'gpt'
ENABLE_OTEL=false               # Enable OpenTelemetry tracing
```

## Privacy Considerations

The system includes several privacy-focused design elements:

1. **Reasoning Steps**: The chain-of-thought reasoning steps (reasoning_steps) used in impact analysis are never persisted to the database or exposed through APIs. They are used for internal processing only and discarded after the analysis is complete.

2. **User Queries**: Search queries are logged but anonymized after 30 days.

3. **Embedding Storage**: Embeddings are stored without the original text that generated them, making it difficult to reverse-engineer the content.

4. **Domain Separation**: Domain filtering ensures users only search within authorized domains.

## Upgrading

When upgrading the retrieval system:

1. Back up the Chunk table
2. Apply schema migrations
3. Run rechunking process first
4. Monitor embedding progress
5. Evaluate search quality after completion
