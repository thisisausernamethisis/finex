# RAG System Runbook

This runbook describes the Retrieval-Augmented Generation (RAG) system implemented in the FinEx application. RAG combines traditional retrieval methods with generative AI to provide accurate, context-aware responses to user queries.

## System Architecture

The RAG pipeline consists of several key components:

1. **Query Processing** - User queries are analyzed and optimized for retrieval
2. **Hybrid Retrieval** - A dual-path search combining vector and keyword search
3. **Dynamic Alpha Weighting** - Smart fusion of vector and keyword results
4. **Context Assembly** - Selection and arrangement of retrieved content
5. **Generative Model** - LLM that synthesizes final answers from context
6. **Confidence Scoring** - Evaluation of answer quality and reliability

### Retrieval Methods

The system employs two complementary retrieval methods:

- **Vector search** (semantic): Uses pgvector with embeddings from OpenAI's text-embedding-ada-002
- **Keyword search** (lexical): Postgres full-text search using tsquery/tsvector

### Alpha Weighting

The `alpha` parameter controls the weight given to vector search results when merging with keyword search results:

- `alpha = 0.5` → Equal weight to both methods
- `alpha = 0.9` → Strong preference for vector results
- `alpha = 0.1` → Strong preference for keyword results

## Alpha Caching

The system implements a small LRU cache for alpha values to improve performance by avoiding duplicate calls to the alpha calculation system, particularly for GPT-assisted alpha calculations.

### Rationale

GPT-assisted alpha calculation (when enabled) adds approximately 350 ms per cache miss. Based on staging environment traces, approximately 40% of search queries are duplicated within short time windows. By caching alpha values, we can significantly reduce the latency for these duplicate queries.

### Implementation

- Cache size: 50 entries (LRU eviction policy)
- TTL: 5 minutes (300,000 ms)
- Key: Lowercase query string
- Value: `{alpha: number, ts: timestamp}`

The alpha cache checks include:
1. Cache lookup for existing value
2. TTL verification (entries over 5 minutes old are considered stale)
3. LRU eviction when cache exceeds 50 entries

### Eviction Strategy

When the cache exceeds its maximum size (50 entries), the oldest entry is removed. The Map object used for caching maintains insertion order, making it simple to identify and remove the oldest entry.

```typescript
// Example LRU eviction
if (alphaCache.size > MAX_CACHE_SIZE) {
  const oldest = alphaCache.keys().next().value;
  alphaCache.delete(oldest);
}
```

## Domain Filtering

The system supports domain-specific filtering to improve relevance within particular subject areas.

### Domain Types

Content is categorized into domains, which can be used to filter search results:

- `FINANCE` - Financial concepts, markets, instruments
- `ASSET` - Asset-specific information
- `SUPPLY_CHAIN` - Supply chain and logistics
- `GEOGRAPHY` - Geographical and location-based information
- `TECHNICAL` - Technical specifications and documentation
- `REGULATORY` - Regulatory and compliance information
- `OTHER` - Miscellaneous information

### SQL Filter Implementation

Domain filtering uses an equality filter in SQL queries:

```sql
SELECT c.id, ts_rank(to_tsvector('english', c.content), to_tsquery('english', ${query})) as rank
FROM "Card" c
JOIN "Theme" t ON c.theme_id = t.id
LEFT JOIN "Chunk" ch ON ch.card_id = c.id
WHERE to_tsvector('english', c.content) @@ to_tsquery('english', ${query})
  AND ($4::text IS NULL OR ch.domain = $4)  -- Domain equality filter
ORDER BY rank DESC
LIMIT ${limit}
```

## Performance Tuning

Retrieve performance can be tuned through several parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `topK` | 20 | Number of results to return from hybrid search |
| `alpha` | dynamic | Weight given to vector results (0.1-0.9) |
| `cacheEnabled` | true | Whether to use Redis result caching |
| `cacheTTL` | 300 | Cache time-to-live in seconds |

## Monitoring

The system exposes several metrics for monitoring:

- `search_queries_total` - Counter for search queries by type
- `search_latency` - Histogram of search latency in seconds
- `cache_hit_ratio` - Ratio of cache hits to total queries
- `retrieval_variance` - Variance of scores in vector results (0-1)
- `rank_correlation` - Overlap between vector and keyword results (0-1)

## Troubleshooting

Common issues and their resolutions:

1. **Slow Search Performance**
   - Check Redis availability
   - Verify pgvector index is being used
   - Monitor database query performance

2. **Irrelevant Results**
   - Review alpha weighting for query types
   - Check domain filtering configuration
   - Validate embedding quality

3. **Missing Content**
   - Verify chunk processing & indexing completeness
   - Check for corpus coverage gaps
   - Review document freshness

## References

- [Vector Search Documentation](../api/vector-search.md)
- [Keyword Search Implementation](../api/keyword-search.md)
- [Result Fusion Algorithms](../api/fusion-algorithms.md)
