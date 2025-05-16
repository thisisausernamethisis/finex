-- ANN Index Tuning Script for Finex RAG System
-- This script runs benchmarks to find optimal ANN index parameters
-- for retrieval performance in both IVF (Inverted File) and HNSW 
-- (Hierarchical Navigable Small World) index types.

-- ===== SETUP =====

-- Create some timing functions
CREATE OR REPLACE FUNCTION format_ms(seconds NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN ROUND((seconds * 1000)::numeric, 2) || ' ms';
END;
$$ LANGUAGE plpgsql;

-- Schema for benchmark results
DROP TABLE IF EXISTS benchmark_results;
CREATE TEMP TABLE benchmark_results (
  id SERIAL PRIMARY KEY,
  test_name TEXT,
  index_type TEXT,
  parameters TEXT,
  query_time NUMERIC, -- seconds
  recall_rate NUMERIC, -- percentage of exact NN results found
  throughput NUMERIC, -- queries per second
  test_timestamp TIMESTAMP
);

-- Enable timing
\timing on

-- ===== EXACT NEAREST NEIGHBOR (BASELINE) =====

-- Drop existing indexes to ensure clean test
DROP INDEX IF EXISTS chunks_embedding_idx;
DROP INDEX IF EXISTS chunks_embedding_ivf_idx;
DROP INDEX IF EXISTS chunks_embedding_hnsw_idx;
DROP INDEX IF EXISTS chunkv2_embedding_idx;
DROP INDEX IF EXISTS chunkv2_embedding_ivf_idx;
DROP INDEX IF EXISTS chunkv2_embedding_hnsw_idx;

-- Create sample of queries for testing
CREATE TEMP TABLE test_queries AS
SELECT id, embedding
FROM chunks
TABLESAMPLE SYSTEM(5) -- 5% sample
LIMIT 50;

-- Run exact nearest neighbor search to establish ground truth
CREATE TEMP TABLE exact_results AS
WITH query_embeddings AS (
  SELECT id AS query_id, embedding
  FROM test_queries
)
SELECT 
  q.query_id,
  c.id AS chunk_id,
  c.embedding <-> q.embedding AS distance
FROM query_embeddings q
CROSS JOIN LATERAL (
  SELECT id, embedding
  FROM chunks
  ORDER BY embedding <-> q.embedding
  LIMIT 10
) c;

-- Record baseline timing
DO $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  duration NUMERIC;
BEGIN
  start_time := clock_timestamp();
  
  PERFORM c.id
  FROM test_queries q
  CROSS JOIN LATERAL (
    SELECT id 
    FROM chunks
    ORDER BY embedding <-> q.embedding
    LIMIT 10
  ) c;
  
  end_time := clock_timestamp();
  duration := EXTRACT(EPOCH FROM (end_time - start_time));
  
  INSERT INTO benchmark_results (test_name, index_type, parameters, query_time, throughput, test_timestamp)
  VALUES ('Baseline', 'exact', 'n/a', duration / 50, 50 / duration, NOW());
END $$;

SELECT * FROM benchmark_results WHERE index_type = 'exact';

-- ===== IVF INDEX TUNING =====

-- Function to test IVF index with different parameters
CREATE OR REPLACE FUNCTION test_ivf_index(lists INT, probes INT)
RETURNS VOID AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  duration NUMERIC;
  recall NUMERIC;
  test_name TEXT;
BEGIN
  test_name := 'IVF-' || lists || '-' || probes;
  
  -- Drop existing index if exists
  EXECUTE 'DROP INDEX IF EXISTS chunks_embedding_ivf_idx';
  
  -- Create IVF index with specified parameters
  EXECUTE 'CREATE INDEX chunks_embedding_ivf_idx ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = ' || lists || ')';
  
  -- Set probes parameter
  EXECUTE 'SET ivfflat.probes = ' || probes;
  
  -- Run benchmark
  CREATE TEMP TABLE ivf_results AS
  WITH query_embeddings AS (
    SELECT id AS query_id, embedding
    FROM test_queries
  )
  SELECT 
    q.query_id,
    c.id AS chunk_id
  FROM query_embeddings q
  CROSS JOIN LATERAL (
    SELECT id
    FROM chunks
    ORDER BY embedding <-> q.embedding
    LIMIT 10
  ) c;
  
  -- Calculate recall (% of exact NN results found)
  SELECT COUNT(i.chunk_id)::NUMERIC / COUNT(e.chunk_id)::NUMERIC * 100
  INTO recall
  FROM exact_results e
  JOIN ivf_results i ON e.query_id = i.query_id AND e.chunk_id = i.chunk_id;
  
  -- Measure performance
  start_time := clock_timestamp();
  
  PERFORM c.id
  FROM test_queries q
  CROSS JOIN LATERAL (
    SELECT id 
    FROM chunks
    ORDER BY embedding <-> q.embedding
    LIMIT 10
  ) c;
  
  end_time := clock_timestamp();
  duration := EXTRACT(EPOCH FROM (end_time - start_time));
  
  -- Record results
  INSERT INTO benchmark_results (
    test_name, 
    index_type, 
    parameters, 
    query_time,
    recall_rate,
    throughput,
    test_timestamp
  )
  VALUES (
    test_name, 
    'ivfflat', 
    'lists=' || lists || ', probes=' || probes, 
    duration / 50,
    recall,
    50 / duration,
    NOW()
  );
  
  -- Clean up
  DROP TABLE IF EXISTS ivf_results;
END $$;
LANGUAGE plpgsql;

-- Test IVF with different parameters
-- Rule of thumb: lists ≈ sqrt(row_count)
-- Row count check
SELECT 'Total chunks: ' || COUNT(*) FROM chunks;

-- Test various combinations
SELECT test_ivf_index(50, 1);
SELECT test_ivf_index(50, 5);
SELECT test_ivf_index(50, 10);
SELECT test_ivf_index(100, 5);
SELECT test_ivf_index(100, 10);
SELECT test_ivf_index(100, 20);
SELECT test_ivf_index(200, 10);
SELECT test_ivf_index(200, 20);
SELECT test_ivf_index(300, 10);

-- ===== HNSW INDEX TUNING =====

-- Function to test HNSW index with different parameters
CREATE OR REPLACE FUNCTION test_hnsw_index(m INT, ef_construction INT, ef_search INT)
RETURNS VOID AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  duration NUMERIC;
  recall NUMERIC;
  test_name TEXT;
BEGIN
  test_name := 'HNSW-' || m || '-' || ef_construction || '-' || ef_search;
  
  -- Drop existing index if exists
  EXECUTE 'DROP INDEX IF EXISTS chunks_embedding_hnsw_idx';
  
  -- Create HNSW index with specified parameters
  EXECUTE 'CREATE INDEX chunks_embedding_hnsw_idx ON chunks
           USING hnsw (embedding vector_cosine_ops)
           WITH (m = ' || m || ', ef_construction = ' || ef_construction || ')';
  
  -- Set ef_search parameter
  EXECUTE 'SET hnsw.ef_search = ' || ef_search;
  
  -- Run benchmark
  CREATE TEMP TABLE hnsw_results AS
  WITH query_embeddings AS (
    SELECT id AS query_id, embedding
    FROM test_queries
  )
  SELECT 
    q.query_id,
    c.id AS chunk_id
  FROM query_embeddings q
  CROSS JOIN LATERAL (
    SELECT id
    FROM chunks
    ORDER BY embedding <-> q.embedding
    LIMIT 10
  ) c;
  
  -- Calculate recall (% of exact NN results found)
  SELECT COUNT(h.chunk_id)::NUMERIC / COUNT(e.chunk_id)::NUMERIC * 100
  INTO recall
  FROM exact_results e
  JOIN hnsw_results h ON e.query_id = h.query_id AND e.chunk_id = h.chunk_id;
  
  -- Measure performance
  start_time := clock_timestamp();
  
  PERFORM c.id
  FROM test_queries q
  CROSS JOIN LATERAL (
    SELECT id 
    FROM chunks
    ORDER BY embedding <-> q.embedding
    LIMIT 10
  ) c;
  
  end_time := clock_timestamp();
  duration := EXTRACT(EPOCH FROM (end_time - start_time));
  
  -- Record results
  INSERT INTO benchmark_results (
    test_name, 
    index_type, 
    parameters, 
    query_time,
    recall_rate,
    throughput,
    test_timestamp
  )
  VALUES (
    test_name, 
    'hnsw', 
    'm=' || m || ', ef_construction=' || ef_construction || ', ef_search=' || ef_search, 
    duration / 50,
    recall,
    50 / duration,
    NOW()
  );
  
  -- Clean up
  DROP TABLE IF EXISTS hnsw_results;
END $$;
LANGUAGE plpgsql;

-- Test HNSW with different parameters
SELECT test_hnsw_index(16, 64, 40);
SELECT test_hnsw_index(16, 64, 80);
SELECT test_hnsw_index(16, 128, 40);
SELECT test_hnsw_index(16, 128, 80);
SELECT test_hnsw_index(32, 64, 40);
SELECT test_hnsw_index(32, 64, 80); 
SELECT test_hnsw_index(32, 128, 40);
SELECT test_hnsw_index(32, 128, 80);
SELECT test_hnsw_index(64, 128, 80);

-- ===== RESULTS ANALYSIS =====

-- Show results sorted by query time (fastest first)
SELECT 
  test_name, 
  index_type, 
  parameters, 
  format_ms(query_time) AS avg_query_time,
  ROUND(recall_rate, 2) || '%' AS recall,
  ROUND(throughput, 2) || ' qps' AS throughput
FROM benchmark_results
ORDER BY query_time ASC;

-- Show results by best recall/speed tradeoff
SELECT 
  test_name, 
  index_type, 
  parameters, 
  format_ms(query_time) AS avg_query_time,
  ROUND(recall_rate, 2) || '%' AS recall,
  ROUND(throughput, 2) || ' qps' AS throughput,
  -- Custom score combining recall and speed (higher is better)
  ROUND((recall_rate * 0.7 + (1000 / query_time) * 0.3), 2) AS combined_score
FROM benchmark_results
WHERE index_type != 'exact'
ORDER BY (recall_rate * 0.7 + (1000 / query_time) * 0.3) DESC;

-- ===== RECOMMENDATIONS =====

-- Print recommended parameters
DO $$
DECLARE
  ivf_lists INT;
  ivf_probes INT;
  hnsw_m INT;
  hnsw_ef_construction INT;
  hnsw_ef_search INT;
  ivf_query_time NUMERIC;
  hnsw_query_time NUMERIC;
  ivf_recall NUMERIC;
  hnsw_recall NUMERIC;
  recommended_type TEXT;
BEGIN
  -- Get best IVF parameters
  SELECT 
    SPLIT_PART(SPLIT_PART(parameters, 'lists=', 2), ',', 1)::INT,
    SPLIT_PART(parameters, 'probes=', 2)::INT,
    query_time,
    recall_rate
  INTO ivf_lists, ivf_probes, ivf_query_time, ivf_recall
  FROM benchmark_results
  WHERE index_type = 'ivfflat'
  ORDER BY (recall_rate * 0.7 + (1000 / query_time) * 0.3) DESC
  LIMIT 1;
  
  -- Get best HNSW parameters
  SELECT 
    SPLIT_PART(SPLIT_PART(parameters, 'm=', 2), ',', 1)::INT,
    SPLIT_PART(SPLIT_PART(parameters, 'ef_construction=', 2), ',', 1)::INT,
    SPLIT_PART(parameters, 'ef_search=', 2)::INT,
    query_time,
    recall_rate
  INTO hnsw_m, hnsw_ef_construction, hnsw_ef_search, hnsw_query_time, hnsw_recall
  FROM benchmark_results
  WHERE index_type = 'hnsw'
  ORDER BY (recall_rate * 0.7 + (1000 / query_time) * 0.3) DESC
  LIMIT 1;
  
  -- Determine which type is better overall
  IF (hnsw_recall * 0.7 + (1000 / hnsw_query_time) * 0.3) > 
     (ivf_recall * 0.7 + (1000 / ivf_query_time) * 0.3) THEN
    recommended_type := 'HNSW';
  ELSE
    recommended_type := 'IVF';
  END IF;
  
  -- Print recommendations
  RAISE NOTICE '===== INDEX RECOMMENDATIONS =====';
  RAISE NOTICE 'Recommended index type: %', recommended_type;
  RAISE NOTICE '';
  RAISE NOTICE 'Best IVF parameters:';
  RAISE NOTICE '  lists: %', ivf_lists;
  RAISE NOTICE '  probes: %', ivf_probes;
  RAISE NOTICE '  Average query time: %', format_ms(ivf_query_time);
  RAISE NOTICE '  Recall rate: %', ROUND(ivf_recall, 2) || '%';
  RAISE NOTICE '';
  RAISE NOTICE 'Best HNSW parameters:';
  RAISE NOTICE '  m: %', hnsw_m;
  RAISE NOTICE '  ef_construction: %', hnsw_ef_construction;
  RAISE NOTICE '  ef_search: %', hnsw_ef_search;
  RAISE NOTICE '  Average query time: %', format_ms(hnsw_query_time);
  RAISE NOTICE '  Recall rate: %', ROUND(hnsw_recall, 2) || '%';
  RAISE NOTICE '';
  RAISE NOTICE 'SQL to create recommended index:';
  
  IF recommended_type = 'IVF' THEN
    RAISE NOTICE 'CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = %);', ivf_lists;
    RAISE NOTICE 'SET ivfflat.probes = %;', ivf_probes;
  ELSE
    RAISE NOTICE 'CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops) WITH (m = %, ef_construction = %);', hnsw_m, hnsw_ef_construction;
    RAISE NOTICE 'SET hnsw.ef_search = %;', hnsw_ef_search;
  END IF;
END $$;

-- ===== CLEANUP =====

-- Re-create regular index for production use
DROP INDEX IF EXISTS chunks_embedding_idx;
DROP INDEX IF EXISTS chunks_embedding_ivf_idx;
DROP INDEX IF EXISTS chunks_embedding_hnsw_idx;
CREATE INDEX chunks_embedding_idx ON chunks USING ivfflat (embedding vector_cosine_ops);

-- Reset pgvector parameters to defaults
RESET ivfflat.probes;
RESET hnsw.ef_search;

DROP TABLE IF EXISTS test_queries;
DROP TABLE IF EXISTS exact_results;

-- Keep benchmark_results table for reference
SELECT * FROM benchmark_results ORDER BY test_timestamp DESC;
