/**
 * Unified BullMQ mock for Vitest & Jest
 *
 * – No Redis required
 * – Provides setMaxListeners and on/once/off hooks
 * – Registers a global vi.mock('bullmq', …) so any code that
 *   imports 'bullmq' gets the fakes automatically.
 */

import { vi } from 'vitest';

/* ────────────────  Fake Queue  ──────────────── */
export class FakeQueue {
  name: string;
  opts?: any;
  constructor(name: string, opts?: any) {
    this.name = name;
    this.opts = opts;
  }

  add = vi.fn(async (_name: string, _data: unknown) => ({
    id: Math.random().toString(36).slice(2),
  }));

  close = vi.fn(async () => void 0);
}

/* ───────────────  Fake QueueEvents  ──────────── */
export class FakeQueueEvents {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  setMaxListeners = vi.fn().mockReturnThis();
  on = vi.fn().mockReturnThis();
  once = vi.fn().mockReturnThis();
  off = vi.fn().mockReturnThis();
  close = vi.fn(async () => void 0);
}

/* ────────────────  Fake Worker  ──────────────── */
export class FakeWorker {
  name: string;
  processor: any;
  constructor(name: string, processor: any) {
    this.name = name;
    this.processor = processor;
    // Immediately invoke the supplied processor in tests
    queueMicrotask(async () => {
      await this.processor({ data: {} });
    });
  }
  on = vi.fn();
  close = vi.fn(async () => void 0);
}

/* ───── Register module mock so it's auto-applied ───── */
vi.mock('bullmq', () => ({
  Queue: FakeQueue,
  QueueEvents: FakeQueueEvents,
  Worker: FakeWorker,
}));
