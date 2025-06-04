import { EventEmitter } from 'events';
import { logger } from '../logger';

// Create a singleton event emitter for the application
const eventEmitter = new EventEmitter();

// Set a higher max listeners limit to avoid warnings
eventEmitter.setMaxListeners(100);

// Log all events in debug mode
eventEmitter.on('newListener', (event) => {
  logger.debug(`New listener added for event: ${event}`);
});

// Event types for type safety
export type JobEventType = 'matrix' | 'growth' | 'probability' | 'tech-categorization';

export interface JobEvent {
  type: JobEventType;
  jobId: string;
  status: 'queued' | 'started' | 'completed' | 'failed';
  timestamp: string;
  data?: Record<string, any>;
  error?: string;
}

// Helper to emit job events with consistent structure
export function emitJobEvent(event: JobEvent) {
  // Runtime validation for critical fields
  if (!event.jobId) {
    throw new Error('Job event must include a jobId');
  }
  
  const validTypes: JobEventType[] = ['matrix', 'growth', 'probability', 'tech-categorization'];
  if (!validTypes.includes(event.type)) {
    throw new Error(`Invalid event type: ${event.type}. Must be one of: ${validTypes.join(', ')}`);
  }
  
  const validStatuses: JobEvent['status'][] = ['queued', 'started', 'completed', 'failed'];
  if (!validStatuses.includes(event.status)) {
    throw new Error(`Invalid event status: ${event.status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  logger.debug('Emitting job event', event);
  eventEmitter.emit('job:update', event);
}

export default eventEmitter;
