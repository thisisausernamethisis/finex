Finex v0.18 – “RAG Uplift” (Phase 6.4) — FINAL DETAILED IMPLEMENTATION PLAN
All paths, imports, and helper signatures have been reconciled with the live repo (finex_full_20250513_080337.zip) and the authoritative Roadmap v0.17.
Every ticket below maps to one conventional commit; CI must stay green throughout and final coverage ≥ 80 %.

0 · Residual hygiene (already merged on v0.17 main)
No hot-fixes required — mock location, ESLint guard, duplicate-mock purge all confirmed in zip.

1 · Ticket blueprint
Seq	Ticket	Deliverable (key files)	Acceptance
1	T-260 feat(rag): evaluation harness	scripts/rag/eval.ts (see full code)	CI step rag evaluation exits non-zero if overall RAGAS < 0.80.
2	T-264 data(rag): gold QA set & smoke tests	tests/rag/qa.csv (50 rows)
tests/unit/rag/ragas_smoke.test.ts	Unit tests pass; csv parsed by harness.
3	T-261 feat(cache): hybrid search Redis cache	lib/services/cacheService.ts (new)
patch lib/services/searchService.ts	Repeat query hits cache; unit test asserts latency < 100 ms w/ fake Redis.
4	T-262 feat(worker): store summary + confidence	lib/validators/matrix.ts (new Zod)
patch workers/matrixWorker.ts
add confidence Float? column via migration	Worker writes validated summary & confidence; contract test reads DB row.
5	T-265 test(rag): hybrid-cache integration & RAGAS calc	tests/unit/services/cacheService.test.ts
tests/unit/services/searchService.cache.test.ts	Coverage stays ≥ 80 %.
6	T-266 feat(api): preview endpoint + OpenAPI	app/api/matrix/result/[resultId]/preview/route.ts
OpenAPI path /api/matrix/result/{resultId}/preview	Contract test hits endpoint, gets summary & confidence.
7	T-267 feat(metrics): RAG cache Prom metrics	lib/metrics/index.ts counters/gauge
patch cacheService.ts to inc metrics	/metrics exposes finex_rag_cache_hits_total etc.; unit test parses numbers.
8	T-268 docs(runbook + release)	docs/runbooks/rag.md, roadmap v0.18, CHANGELOG	Reviewed & tag v0.18.0 pushed.

2 · Code stubs & key patches
2.1 scripts/rag/eval.ts
ts
Copy
Edit
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { searchService } from '../../lib/services/searchService';
import { calculateRAGASScore } from '../../lib/utils/ragas';

async function main() {
  const qaPath = path.join(process.cwd(), 'tests/rag/qa.csv');
  const records = parse(fs.readFileSync(qaPath, 'utf-8'), { columns: true, skip_empty_lines: true });

  const scores: number[] = [];
  for (const { question, answer } of records) {
    const hits = await searchService.hybridSearch({ query: question });
    scores.push(calculateRAGASScore(question, answer, hits));
  }

  const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
  console.log(`Overall RAGAS: ${overall.toFixed(3)}`);

  if (overall < 0.80) {
    console.error('❌ RAGAS below threshold');
    process.exit(1);
  }
  console.log('✅ RAGAS meets threshold');
}

main().catch(err => { console.error(err); process.exit(1); });
package.json: "rag:eval": "ts-node scripts/rag/eval.ts"

CI step:

yaml
Copy
Edit
- name: RAG evaluation
  run: pnpm rag:eval
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
2.2 lib/services/cacheService.ts
ts
Copy
Edit
import Redis from 'ioredis';
import crypto from 'crypto';
import { ragCacheHits, ragCacheMisses, ragCacheLatency } from '../metrics';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

export function makeCacheKey(q: string, meta: unknown) {
  return 'hs:' + crypto.createHash('sha1').update(q + JSON.stringify(meta)).digest('hex');
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const t0 = performance.now();
  const raw = await redis.get(key);
  ragCacheLatency.set({ operation: 'get' }, (performance.now() - t0) / 1000);

  if (raw) { ragCacheHits.inc({ type: 'get' }); return JSON.parse(raw); }
  ragCacheMisses.inc({ type: 'get' }); return null;
}

export async function cacheSet<T>(key: string, value: T, ttlSec = 300) {
  const t0 = performance.now();
  await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
  ragCacheLatency.set({ operation: 'set' }, (performance.now() - t0) / 1000);
}
2.3 Preview endpoint
app/api/matrix/result/[resultId]/preview/route.ts (uses existing RBAC guard utils).

2.4 OpenAPI addition
/api/matrix/result/{resultId}/preview as provided in previous message.

3 · CI / coverage / lint
Vitest coverage block already in repo (80 lines / 70 branches).
ESLint guard against @ts-nocheck present; new code must compile without suppressions.

4 · Commit order
feat(rag): eval harness (T-260)

data(rag): gold QA set + smoke tests (T-264)

feat(cache): hybrid Redis cache (T-261)

feat(worker): summary + confidence (T-262)

test(rag): cache & RAG tests (T-265)

feat(api): preview endpoint + spec (T-266)

feat(metrics): RAG cache Prom counters (T-267)

docs(meta): roadmap v0.18 & release notes (T-268)

CI must pass after each push; overall coverage remains ≥ 80 %.