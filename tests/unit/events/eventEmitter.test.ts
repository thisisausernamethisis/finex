import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import eventEmitter, { emitJobEvent, JobEvent } from '../../../lib/events/eventEmitter';

describe('EventEmitter', () => {
  beforeEach(() => {
    // Clear all mocks and listeners before each test
    vi.clearAllMocks();
    eventEmitter.removeAllListeners();
  });

  afterEach(() => {
    // Cleanup after tests
    eventEmitter.removeAllListeners();
  });

  it('should properly emit job events', () => {
    // Create a mock listener function
    const mockListener = vi.fn();
    
    // Register the listener
    eventEmitter.on('job:update', mockListener);
    
    // Create a job event
    const jobEvent: JobEvent = {
      type: 'matrix',
      jobId: 'test-job-123',
      status: 'queued',
      timestamp: new Date().toISOString(),
      data: { assetId: 'asset-123', scenarioId: 'scenario-456' }
    };
    
    // Emit the event
    emitJobEvent(jobEvent);
    
    // Verify that the listener was called with the correct data
    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(jobEvent);
  });

  it('should throw an error for missing jobId', () => {
    // Create an invalid job event without a jobId
    const invalidEvent: Omit<JobEvent, 'jobId'> = {
      type: 'matrix',
      status: 'queued',
      timestamp: new Date().toISOString()
    };
    
    // Try to emit the event, should throw an error
    expect(() => emitJobEvent(invalidEvent as JobEvent)).toThrow('Job event must include a jobId');
  });

  it('should throw an error for invalid event type', () => {
    // Create an invalid job event with an invalid type
    const invalidEvent = {
      type: 'invalid-type',
      jobId: 'test-job-123',
      status: 'queued',
      timestamp: new Date().toISOString()
    };
    
    // Try to emit the event, should throw an error
    expect(() => emitJobEvent(invalidEvent as JobEvent)).toThrow('Invalid event type');
  });

  it('should throw an error for invalid status', () => {
    // Create an invalid job event with an invalid status
    const invalidEvent = {
      type: 'matrix',
      jobId: 'test-job-123',
      status: 'invalid-status',
      timestamp: new Date().toISOString()
    };
    
    // Try to emit the event, should throw an error
    expect(() => emitJobEvent(invalidEvent as JobEvent)).toThrow('Invalid event status');
  });

  it('should allow multiple listeners for the same event', () => {
    // Create two mock listener functions
    const mockListener1 = vi.fn();
    const mockListener2 = vi.fn();
    
    // Register both listeners
    eventEmitter.on('job:update', mockListener1);
    eventEmitter.on('job:update', mockListener2);
    
    // Create a job event
    const jobEvent: JobEvent = {
      type: 'probability',
      jobId: 'test-job-456',
      status: 'completed',
      timestamp: new Date().toISOString()
    };
    
    // Emit the event
    emitJobEvent(jobEvent);
    
    // Verify that both listeners were called
    expect(mockListener1).toHaveBeenCalledTimes(1);
    expect(mockListener1).toHaveBeenCalledWith(jobEvent);
    expect(mockListener2).toHaveBeenCalledTimes(1);
    expect(mockListener2).toHaveBeenCalledWith(jobEvent);
  });
  
  it('should remove listeners when unsubscribed', () => {
    // Create a mock listener function
    const mockListener = vi.fn();
    
    // Register the listener
    eventEmitter.on('job:update', mockListener);
    
    // Create a job event
    const jobEvent: JobEvent = {
      type: 'growth',
      jobId: 'test-job-789',
      status: 'started',
      timestamp: new Date().toISOString()
    };
    
    // Emit the event - listener should be called
    emitJobEvent(jobEvent);
    expect(mockListener).toHaveBeenCalledTimes(1);
    
    // Remove the listener
    eventEmitter.removeListener('job:update', mockListener);
    
    // Reset the mock
    mockListener.mockReset();
    
    // Emit the event again - listener should not be called
    emitJobEvent(jobEvent);
    expect(mockListener).not.toHaveBeenCalled();
  });
});
