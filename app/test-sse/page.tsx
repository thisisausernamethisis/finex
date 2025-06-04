'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface SSEEvent {
  id?: string;
  event?: string;
  data: any;
  timestamp: string;
}

export default function TestSSEPage() {
  const { user, isLoaded } = useUser();
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Connect to SSE endpoint
  const connectSSE = () => {
    if (eventSource) {
      eventSource.close();
    }

    setConnectionStatus('connecting');
    
    const newEventSource = new EventSource('/api/events');
    
    newEventSource.onopen = () => {
      console.log('SSE connection opened');
      setConnectionStatus('connected');
    };

    newEventSource.onmessage = (event) => {
      console.log('SSE message received:', event);
      try {
        const data = JSON.parse(event.data);
        setEvents(prev => [
          {
            data,
            timestamp: new Date().toISOString(),
            id: event.lastEventId || undefined,
            event: 'message'
          },
          ...prev.slice(0, 49) // Keep only last 50 events
        ]);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    // Handle specific event types
    newEventSource.addEventListener('connect', (event) => {
      console.log('SSE connect event:', event);
      try {
        const data = JSON.parse(event.data);
        setEvents(prev => [
          {
            data,
            timestamp: new Date().toISOString(),
            event: 'connect'
          },
          ...prev.slice(0, 49)
        ]);
      } catch (error) {
        console.error('Failed to parse connect event:', error);
      }
    });

    newEventSource.addEventListener('job-update', (event) => {
      console.log('SSE job-update event:', event);
      try {
        const data = JSON.parse(event.data);
        setEvents(prev => [
          {
            data,
            timestamp: new Date().toISOString(),
            event: 'job-update',
            id: event.lastEventId || undefined
          },
          ...prev.slice(0, 49)
        ]);
      } catch (error) {
        console.error('Failed to parse job-update event:', error);
      }
    });

    newEventSource.addEventListener('heartbeat', (event) => {
      console.log('SSE heartbeat received');
    });

    newEventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setConnectionStatus('disconnected');
    };

    setEventSource(newEventSource);
  };

  // Disconnect from SSE
  const disconnectSSE = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setConnectionStatus('disconnected');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  if (!isLoaded) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6">Please sign in to test SSE functionality.</div>;
  }

  const getStatusBadgeClass = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'connecting': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Server-Sent Events Test</h1>
          <p className="text-gray-600">
            Test real-time job updates via SSE endpoint
          </p>
        </div>

        {/* Connection Controls */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">SSE Connection</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}>
              {connectionStatus}
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Connect to the SSE endpoint to receive real-time updates
          </p>
          <div className="flex gap-2">
            <button 
              onClick={connectSSE} 
              disabled={connectionStatus === 'connected'}
              className={`px-4 py-2 rounded ${
                connectionStatus === 'connected' 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Connect
            </button>
            <button 
              onClick={disconnectSSE} 
              disabled={connectionStatus === 'disconnected'}
              className={`px-4 py-2 rounded border ${
                connectionStatus === 'disconnected'
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Events Display */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Live Events ({events.length})</h2>
          <p className="text-gray-600 mb-4">
            Real-time events received from the SSE endpoint
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No events received yet. Connect to SSE to see real-time updates.
              </p>
            ) : (
              events.map((event, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {event.event || 'message'}
                      </span>
                      {event.id && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          ID: {event.id}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 