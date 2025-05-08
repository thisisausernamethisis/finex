# Worker Runbook

This document provides operational guidance for the BullMQ workers that power Finex Bot's background processing.

## Worker Overview

Finex Bot uses the following workers:

- **matrixWorker**: Calculates impact scores for asset-scenario pairs
- **growthWorker**: Updates growth values for assets
- **probabilityWorker**: Updates probability values for scenarios

## Starting Workers

Workers are automatically started when the application is launched with `make dev`. 

For manual worker management:

```bash
# Start all workers
npm run workers:start

# Start a specific worker
npm run workers:start -- --worker=matrix
```

## Monitoring

### Key Metrics

The following Prometheus metrics are available:

- `bullmq.active`: Number of active jobs per queue
- `bullmq.waiting`: Number of waiting jobs per queue
- `bullmq.completed`: Number of completed jobs per queue
- `bullmq.failed`: Number of failed jobs per queue
- `bullmq.delayed`: Number of delayed jobs per queue
- `bullmq.paused`: Boolean indicating if a queue is paused

### Alerting Rules

Sample alerting rules are available in `ops/prometheus-rules.yml`. Key alerts include:

- `HighFailureRate`: Triggers when job failure rate exceeds 10%
- `QueueBacklog`: Triggers when waiting jobs exceeds 100
- `StuckJobs`: Triggers when jobs remain active for > 10 minutes

## Troubleshooting

### Common Issues

#### MaxListenersExceededWarning

**Symptom**: Warning about event listener limit exceeded.

**Fix**: Ensure `queueEvents.setMaxListeners(0)` is called in worker initialization.

#### Jobs Stuck in 'Active' State

**Symptom**: Jobs appear to be running but never complete.

**Fix**:
1. Check worker logs for error messages
2. Verify Redis connection is stable
3. If workers crashed, manually clean stuck jobs:
   ```bash
   npm run workers:clean-stuck-jobs
   ```

### Dead Letter Queue (DLQ)

Failed jobs are sent to a DLQ after the configured retry limit. To process these jobs:

```bash
# List jobs in DLQ
npm run workers:list-dlq

# Retry all jobs in DLQ
npm run workers:retry-dlq

# Empty DLQ without processing
npm run workers:empty-dlq
```

## Worker Restart Procedure

To safely restart workers:

1. Pause the queues to prevent new job processing:
   ```bash
   npm run workers:pause
   ```

2. Wait for active jobs to complete (monitor with `bullmq.active` metric)

3. Stop the workers:
   ```bash
   npm run workers:stop
   ```

4. Start the workers:
   ```bash
   npm run workers:start
   ```

5. Resume the queues:
   ```bash
   npm run workers:resume
   ```

## Performance Tuning

Worker concurrency can be adjusted in `.env`:

```
MATRIX_WORKER_CONCURRENCY=5
GROWTH_WORKER_CONCURRENCY=10
PROBABILITY_WORKER_CONCURRENCY=10
```

Increase these values for higher throughput, but be mindful of database connection limits.
