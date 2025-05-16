/**
 * Matrix-worker unit tests.
 *
 * ⚠️  The BullMQ mock **must** load first to avoid the
 * “cannot access … before initialization” error.
 */
import '../../helpers/mockBullmq';          // registers vi.mock('bullmq', …)

import {
  describe, it, expect, vi, beforeEach,
  type MockInstance,
} from 'vitest';
import { Worker, Queue, QueueEvents, Job } from 'bullmq';

import { startMatrixWorker, processMatrixJob } from '../../../workers/matrixWorker';
import { assembleMatrixContext } from '../../../lib/services/contextAssemblyService';
import { prisma } from '../../../lib/db';

/* ── Prisma deep mock ──────────────────────────────────────────────── */
const prismaUpdate = vi.fn();
const prismaFind   = vi.fn();

vi.mock('../../../lib/db', () => ({
  prisma: {
    matrixAnalysisResult: {
      findUnique: prismaFind,
      update: prismaUpdate,
      create: vi.fn(),
    },
  },
}));

/* ── assembleMatrixContext mock ────────────────────────────────────── */
vi.mock('../../../lib/services/contextAssemblyService', () => ({
  assembleMatrixContext: vi.fn().mockResolvedValue({
    impact: 3,
    evidenceIds: 'ev-1,ev-2',
  }),
}));

/* Factory to mimic a Bull Job object */
interface MatrixJobData { assetId: string; scenarioId: string; }
const job = (assetId: string, scenarioId: string): Job<MatrixJobData> =>
  ({ id: `j-${assetId}-${scenarioId}`, data: { assetId, scenarioId } } as unknown as Job<MatrixJobData>);

/* ── Tests ─────────────────────────────────────────────────────────── */
describe('Matrix Worker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('processMatrixJob updates existing result', async () => {
    prismaFind.mockResolvedValueOnce({ id: 'res-1' });

    await processMatrixJob(job('asset1', 'scenario1'));

    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: { impact: 3, evidenceIds: 'ev-1,ev-2', status: 'complete' },
    });
    expect(assembleMatrixContext).toHaveBeenCalledWith('asset1', 'scenario1');
  });

  it('processMatrixJob creates new result when absent', async () => {
    prismaFind.mockResolvedValueOnce(null);

    await processMatrixJob(job('assetX', 'scenarioY'));

    expect(prismaUpdate).toHaveBeenCalled();
    expect(assembleMatrixContext).toHaveBeenCalledWith('assetX', 'scenarioY');
  });

  it('startMatrixWorker wires queue + events', async () => {
    await startMatrixWorker();

    expect(Queue).toHaveBeenCalled();
    expect(QueueEvents).toHaveBeenCalled();
    expect(Worker).toHaveBeenCalled();
  });
});
