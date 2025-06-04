import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import eventEmitter from '../../../lib/events/eventEmitter';
import { logger } from '../../../lib/logger';

// Create route-specific logger
const sseLogger = logger.child({ route: 'GET /api/events' });

/**
 * GET /api/events - Server-Sent Events endpoint for real-time updates
 * Provides real-time job status updates to authenticated clients
 */
export async function GET(req: NextRequest) {
  // Check authentication
  const user = await currentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  sseLogger.info('SSE connection requested', { userId: user.id });

  // Create a TransformStream for SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // SSE Headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Connection tracking
  let isConnected = true;
  const connectionId = `sse_${user.id}_${Date.now()}`;

  // Helper function to send SSE data
  const sendEvent = async (data: any, event?: string, id?: string) => {
    if (!isConnected) return;
    
    try {
      let message = '';
      if (id) message += `id: ${id}\n`;
      if (event) message += `event: ${event}\n`;
      message += `data: ${JSON.stringify(data)}\n\n`;

      await writer.write(new TextEncoder().encode(message));
    } catch (error) {
      sseLogger.warn('Failed to send SSE event', {
        connectionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      isConnected = false;
    }
  };

  // Send initial connection confirmation
  await sendEvent({ 
    type: 'connection', 
    status: 'connected',
    connectionId,
    timestamp: new Date().toISOString()
  }, 'connect');

  // Set up event listeners for job updates
  const jobUpdateHandler = async (jobEvent: any) => {
    // Only send events that the user should see
    // For now, send all events - in production you'd filter by user access
    await sendEvent(jobEvent, 'job-update', jobEvent.jobId);
  };

  // Listen for job events
  eventEmitter.on('job:update', jobUpdateHandler);

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(async () => {
    await sendEvent({ 
      type: 'heartbeat', 
      timestamp: new Date().toISOString() 
    }, 'heartbeat');
  }, 30000); // Every 30 seconds

  // Cleanup function
  const cleanup = () => {
    if (isConnected) {
      sseLogger.info('SSE connection closed', { connectionId, userId: user.id });
      isConnected = false;
      
      // Remove event listeners
      eventEmitter.off('job:update', jobUpdateHandler);
      
      // Clear heartbeat
      clearInterval(heartbeatInterval);
      
      // Close writer
      writer.close().catch(err => {
        sseLogger.warn('Error closing SSE writer', { 
          connectionId, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      });
    }
  };

  // Handle client disconnect
  req.signal.addEventListener('abort', cleanup);

  // Clean up after 5 minutes to prevent resource leaks
  setTimeout(cleanup, 5 * 60 * 1000);

  sseLogger.info('SSE connection established', { connectionId, userId: user.id });

  return new Response(readable, { headers });
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
