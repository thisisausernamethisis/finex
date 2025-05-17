# Finex Changelog

## Version 0.21.0 - Developer Experience & Infrastructure (May 2025)

### Added
- **Confidence Badge Feature** 
  - Added visual confidence badge to matrix search results ([T-313](tasks/T-313_ui_confidence_badge.yml))
  - Implemented color-coded badges based on confidence thresholds
  - Added E2E tests for confidence badge UI component
  - Improved result transparency with LLM confidence metrics

### Major Changes
- **Test Infrastructure Improvements**
  - Split CI pipeline into separate jobs for unit, contract, and E2E tests ([T-307](tasks/T-307_yaml_dep_graph.yml))
  - Added shared test constants to avoid circular dependencies
  - Standardized test environment configuration across test suites
  
- **Database Optimization**
  - Added new ChunkV2 table with optimized schema for next-gen RAG system
  - Introduced CLI tools for data migration with dry-run protection
  - Implemented ANN index tuning suite with both IVF and HNSW options ([T-314](tasks/T-314_ann_ivfflat_index.yml))

- **Developer Tools**
  - Introduced dynamic alpha parameter tuning for query optimization ([T-303](tasks/T-303_dynamic_alpha.yml))
  - Added compatibility layer for legacy diagnostic field names
  - Created comprehensive test coverage for RAG diagnostics
  - Implemented LRU cache for alpha calculations with 5-minute TTL ([T-316](tasks/T-316_alpha_result_cache.yml))
  
### Documentation
- Updated roadmap to v0.22 ([T-306](tasks/T-306_roadmap_bump.yml))
- Enhanced retrieval system runbook with new configuration options
- Added documentation for domain filtering and alpha heuristics

## Version 0.20.0 - Retrieval & Prompting Overhaul (May 2025)

### Major Changes
- **Hybrid Search Improvements**
  - Implemented parallel BM25 + vector search for up to 60% faster retrieval ([T-305](tasks/T-305_topk_limit_parallel_query.yml))
  - Added domain-aware filtering for increased context relevance ([T-302](tasks/T-302_domain_aware_hybridSearch.yml))
  - Introduced dynamic α parameter for adaptive search weighting ([T-303](tasks/T-303_dynamic_alpha.yml))
  
- **Data Organization**
  - Re-chunked corpus to ~256 token segments for optimal retrieval ([T-301b](tasks/T-301b_rechunk_reindex.yml))
  - Added domain classification to all chunks ([T-301a](tasks/T-301a_add_domain_column.yml))
  - Created specialized IVFFlat vector index for improved retrieval speed

- **Core Reasoning**
  - Added Chain-of-Thought reasoning with function calling to matrix analysis ([T-304](tasks/T-304_cot_function_prompt.yml))
  - Separated internal reasoning steps from public-facing summaries
  - Improved prompt templates for enhanced detail and evidence tracing
  
### Developer Experience
- **Infrastructure**
  - Split CI pipeline into unit/contract/e2e matrices for faster builds ([T-261](tasks/T-261_build_ci_yaml_dep_graph.yml))
  - Improved RAGAS evaluation tools with higher thresholds (0.85+)
  - Added comprehensive retrieval system runbook ([docs/runbooks/retrieval.md](docs/runbooks/retrieval.md))

### Bug Fixes
- Fixed edge case where empty domain filters would return no results
- Addressed token counting accuracy issues in chunking pipeline
- Improved error handling for partial embedding failures

## Version 0.19.1 - Bug Fix Release (April 2025)

### Bug Fixes
- Addressed rate limiting issues in OpenAI client
- Fixed template library pagination and sorting
- Resolved asset access control edge cases
- Improved error handling for matrix analysis jobs

## Version 0.19.0 - Template Library & Access Controls (April 2025)

### Major Changes
- Implemented template library with search and filtering
- Added template visibility controls (public/private)
- Enhanced RBAC system with fine-grained access controls
- Introduced asset sharing capabilities

### Minor Improvements
- Redesigned template card UI with enhanced metadata
- Added pagination to template library
- Improved error handling and feedback
- Enhanced search with basic filtering capabilities

## Version 0.18.0 - Matrix Analysis (March 2025)

### Major Changes
- Added scenario-based impact analysis for assets
- Introduced matrix view for visualizing scenario impacts
- Implemented worker-based async processing for analysis jobs
- Added SSE for real-time updates on long-running processes

### Minor Improvements
- Enhanced data visualization components
- Added export capabilities for analysis results
- Implemented caching for repeated analyses
