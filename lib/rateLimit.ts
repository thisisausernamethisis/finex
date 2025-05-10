// lib/rateLimit.ts
export interface RLResult {
  success: boolean;
  limit: number;
  remaining: number;
}

type HasHeaders = { headers: Headers | Record<string, string> };

export function createRateLimiter(LIMIT = Number(process.env.RL_LIMIT ?? 50)) {
  const calls = new Map<string, number>();

  function check(key: string = 'GLOBAL'): RLResult {
    const used = (calls.get(key) ?? 0) + 1;
    calls.set(key, used);
    return { success: used <= LIMIT, limit: LIMIT, remaining: Math.max(0, LIMIT - used) };
  }

  function set(h: HasHeaders['headers'], k: string, v: string) {
    'set' in h ? (h as Headers).set(k, v) : (h[k] = v);
  }

  function limit(res?: HasHeaders, key = 'GLOBAL'): RLResult {
    const r = check(key);
    if (res) {
      set(res.headers, 'X-RateLimit-Limit', String(r.limit));
      set(res.headers, 'X-RateLimit-Remaining', String(r.remaining));
    }
    return r;
  }

  function __reset() { calls.clear(); }

  return { check, limit, __reset };
}
