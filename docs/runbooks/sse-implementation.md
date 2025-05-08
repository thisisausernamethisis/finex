# Server-Sent Events (SSE) Implementation

This document describes the implementation of the Server-Sent Events (SSE) endpoint in the Finex Bot platform, providing real-time updates to clients about background job statuses.

## Overview

Server-Sent Events (SSE) is a server push technology enabling a client to receive automatic updates from a server via an HTTP connection. Unlike WebSockets, SSE is unidirectional (server to client only) but simpler to implement and has built-in reconnection handling.

## Architecture

```
┌───────────┐     HTTP     ┌──────────┐     Events     ┌──────────┐
│           │   Request    │          │                │          │
│  Client   │─────────────▶│   SSE    │◀───────────────│ Workers  │
│ Browser   │              │ Endpoint │                │          │
│           │◀ - - - - - - │          │                │          │
└───────────┘  Event Stream └──────────┘                └──────────┘
                                ▲                            │
                                │                            │
                                │       ┌──────────┐         │
                                │       │          │         │
                                └───────│ Event    │◀────────┘
                                        │ Emitter  │
                                        │          │
                                        └──────────┘
```

## Implementation Details

### 1. SSE Endpoint (`app/api/events/route.ts`)

- Route: `/api/events`
- Authentication: Uses Clerk authentication middleware
- Stream handling: Creates a transform stream to push events to the client
- Connection management: Cleans up event listeners when the client disconnects
- Response format: `text/event-stream` with proper headers for SSE

### 2. Event Emitter (`lib/events/eventEmitter.ts`)

- Singleton pattern: Centralizes all application events
- Type safety: Provides TypeScript interfaces for event data
- Helper functions: Simplifies emitting events with consistent structure

### 3. Worker Integration (`workers/matrixWorker.ts`)

- Emits events at key points in the job lifecycle:
  - When a job starts processing
  - When a job completes successfully
  - When a job fails
- Includes relevant data with each event (IDs, results, error messages)

### 4. Client Usage (Example in `docs/examples/sse-client.js`)

- Connection handling: Establishes EventSource connection to the SSE endpoint
- Event processing: Parses and handles incoming events
- Error handling: Manages connection errors and reconnection attempts
- UI integration: Example code for updating the UI based on event data

## Metrics and Monitoring

The SSE implementation includes metrics for:
- Active connections
- Events emitted
- Connection errors

These metrics are exposed via the Prometheus metrics endpoint for monitoring.

## Security Considerations

1. **Authentication**: All SSE connections require a valid authenticated user
2. **Resource Management**: 
   - Connection timeouts to prevent resource exhaustion
   - Cleanup of event listeners to prevent memory leaks
3. **Error Handling**: Proper error boundaries to prevent crashes

## Browser Compatibility

Server-Sent Events are supported in all modern browsers. For older browsers, a polyfill can be used.

## Protocol Details

### Event Schema

All job events follow this standardized schema:

```typescript
interface JobEvent {
  type: 'matrix' | 'growth' | 'probability'; // Canonical event type
  jobId: string;                             // Required unique identifier
  status: 'queued' | 'started' | 'completed' | 'failed'; // Standardized status values
  timestamp: string;                         // ISO format timestamp
  data?: Record<string, any>;                // Optional additional data
}
```

### Connection Heartbeat

The SSE endpoint sends a keepalive ping every 30 seconds to prevent connection timeouts:

```
:ping

```

These comment lines (starting with colon) are ignored by EventSource but keep the connection alive through proxies, CDNs, and other intermediaries that might otherwise close idle connections.

### RBAC Event Filtering

Events are filtered server-side based on the authenticated user's permissions:
- For matrix events: User must have access to both the asset and scenario
- For asset events: User must have access to the asset
- For scenario events: User must have access to the scenario

This prevents information leakage across multi-tenant boundaries.

## Performance Considerations

- **Connection Limits**: Browsers typically limit the number of concurrent connections to a single domain (usually 6), which includes SSE connections
- **Reconnection Logic**: Built-in reconnection with exponential backoff in the client
- **Event Filtering**: Server-side RBAC filtering reduces unnecessary events

## Future Improvements

1. **Channel-based Filtering**: Allow clients to subscribe to specific event types
2. **Connection Pooling**: Implement server-side connection pooling for high-traffic scenarios
3. **Back-pressure Handling**: Add buffer overflow protection for slow clients
