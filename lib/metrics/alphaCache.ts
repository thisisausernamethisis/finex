import { Gauge, Counter, register } from 'prom-client';

export const alphaCacheSize = new Gauge({
  name: 'finex_alpha_cache_size',
  help: 'Number of entries in alpha LRU cache',
  registers: [register],
});

export const alphaCacheHits = new Counter({
  name: 'finex_alpha_cache_hits_total',
  help: 'Alpha cache hits',
  registers: [register],
});

export const alphaCacheMisses = new Counter({
  name: 'finex_alpha_cache_misses_total',
  help: 'Alpha cache misses',
  registers: [register],
});
