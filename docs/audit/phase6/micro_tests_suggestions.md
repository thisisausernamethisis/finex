# Micro-test Suggestions (Phase-6 quick wins)

| Target file | Test description | Jest snippet |
|-------------|-----------------|--------------|
| **lib/validators/zod_list_params.ts** | "rejects limit > 100" – schema should throw. | ```ts
import { ListParamsSchema } from 'lib/validators/zod_list_params';
expect(() => ListParamsSchema.parse({ limit: 101, page: 1 })).toThrow();
``` |
| **lib/rateLimit.ts** | "rate limiter exposes two noop functions". | ```ts
import { createRateLimiter } from 'lib/rateLimit';
const rl = createRateLimiter();
expect(typeof rl.limit).toBe('function');
expect(typeof rl.check).toBe('function');
``` |
| **app/api/theme-templates/route.ts** | "mine flag parsed as boolean". | ```ts
import { NextRequest } from 'next/server';
import { GET as listTemplates } from 'app/api/theme-templates/route';
const req = new NextRequest('http://localhost/api/theme-templates?mine=true');
// @ts-expect-error minimal req object for unit test
const { mine } = await listTemplates(req);
expect(mine).toBe(true);
``` |
