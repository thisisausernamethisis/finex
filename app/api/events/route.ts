import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';
import { logger } from '../../../lib/logger';
import eventEmitter, { JobEvent } from '../../../lib/events/eventEmitter';
import { userHasAccessToEvent } from '../../../lib/services/accessControlService';

// Create a logger instance for this route
const routeLogger = logger.child({ route: '/api/events' });

/**
 * SSE endpoint for real-time updates
 */
export async function GET(request: Request) {
  // Authenticate the user
  const user = await currentUser();
  if (!user) {
    routeLogger.warn('Unauthorized access attempt to SSE endpoint');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = user.id;
  routeLogger.debug('SSE connection established', { userId });

  // Create a transform stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Function to send an event
  const sendEvent = async (event: JobEvent) => {
    try {
      // Format as SSE
      const data = `data: ${JSON.stringify(event)}\n\n`;
      await writer.write(encoder.encode(data));

      routeLogger.debug('SSE event sent', { userId, eventType: event.type });
    } catch (error) {
      routeLogger.error('Error sending SSE event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
    }
  };

  // Set up a heartbeat to keep the connection alive
  const heartbeatInterval = setInterval(() => {
    writer.write(encoder.encode(':ping\n\n')).catch((error) => {
      routeLogger.error('Error sending heartbeat', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });
  }, 30000); // Send heartbeat every 30 seconds

  // Keep track of the listener to remove it later
  const jobUpdateListener = async (event: JobEvent) => {
    try {
      // Check if the user has access to this event
      const hasAccess = await userHasAccessToEvent(userId, event);
      
      if (hasAccess) {
        await sendEvent(event);
      } else {
        routeLogger.debug('User does not have access to event', { 
          userId, 
          eventType: event.type,
          jobId: event.jobId
        });
      }
    } catch (error) {
      routeLogger.error('Failed to process event', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Register the event listener
  eventEmitter.on('job:update', jobUpdateListener);

  // Send an initial ping event
  await sendEvent({
    type: 'matrix',
    jobId: 'connection',
    status: 'queued',
    timestamp: new Date().toISOString(),
    data: { message: 'SSE connection established' }
  });

  // Cleanup when client disconnects
  request.signal.addEventListener('abort', () => {
    routeLogger.debug('SSE connection closed', { userId });
    eventEmitter.removeListener('job:update', jobUpdateListener);
    clearInterval(heartbeatInterval); // Stop the heartbeat interval
    writer.close().catch((error) => {
      routeLogger.error('Error closing writer', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });
  });

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
