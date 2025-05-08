/**
 * Example client-side code for consuming the SSE endpoint
 * 
 * This code demonstrates how to connect to the SSE endpoint and handle real-time events.
 * Include this in a browser environment or Next.js client component.
 */

class EventSourceManager {
  constructor() {
    this.eventSource = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1s delay
  }

  /**
   * Connect to the SSE endpoint
   * @param {Function} onEvent Callback for handling events
   * @param {Function} onError Callback for handling errors
   * @param {Function} onConnectionChange Callback for handling connection state changes
   */
  connect(onEvent, onError, onConnectionChange) {
    // Close any existing connection
    this.close();

    try {
      // Create a new EventSource connection
      this.eventSource = new EventSource('/api/events');
      
      // Handle successful connection
      this.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        if (onConnectionChange) {
          onConnectionChange(true);
        }
      };

      // Handle incoming messages
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onEvent) {
            onEvent(data);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          if (onError) {
            onError(error);
          }
        }
      };

      // Handle errors
      this.eventSource.onerror = (error) => {
        this.isConnected = false;
        if (onConnectionChange) {
          onConnectionChange(false);
        }
        
        console.error('SSE connection error:', error);
        
        if (onError) {
          onError(error);
        }
        
        // Close the connection on error
        this.eventSource.close();
        this.eventSource = null;
        
        // Try to reconnect if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          // Exponential backoff
          const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            this.connect(onEvent, onError, onConnectionChange);
          }, delay);
        }
      };
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Close the SSE connection
   */
  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      console.log('SSE connection closed');
    }
  }
}

// Usage example
const initializeRealTimeUpdates = () => {
  const eventManager = new EventSourceManager();
  
  // Connect to the SSE endpoint
  eventManager.connect(
    // Event handler
    (event) => {
      console.log('Received event:', event);
      
      // Handle different event types
      switch (event.type) {
        case 'matrix-analysis':
          handleMatrixEvent(event);
          break;
        case 'growth-analysis':
          handleGrowthEvent(event);
          break;
        default:
          console.log('Unknown event type:', event.type);
      }
    },
    // Error handler
    (error) => {
      console.error('SSE error:', error);
    },
    // Connection state change handler
    (isConnected) => {
      updateConnectionStatus(isConnected);
    }
  );
  
  // Clean up function (call this when component unmounts)
  return () => {
    eventManager.close();
  };
};

// Example event handler for matrix analysis events
function handleMatrixEvent(event) {
  const { status, jobId, data } = event;
  
  switch (status) {
    case 'pending':
      showPendingStatus(jobId);
      break;
    case 'processing':
      showProcessingStatus(jobId);
      break;
    case 'completed':
      if (data?.assetId && data?.scenarioId) {
        updateMatrixUI(data.assetId, data.scenarioId, data.impact);
      }
      break;
    case 'failed':
      showErrorStatus(jobId, data?.error);
      break;
  }
}

// Example UI update functions (implement these based on your UI framework)
function showPendingStatus(jobId) {
  console.log(`Job ${jobId} is pending`);
  // Update UI to show pending status
}

function showProcessingStatus(jobId) {
  console.log(`Job ${jobId} is processing`);
  // Update UI to show processing status (e.g., spinner)
}

function updateMatrixUI(assetId, scenarioId, impact) {
  console.log(`Matrix updated for asset ${assetId} and scenario ${scenarioId} with impact ${impact}`);
  // Update the UI with the new impact value
  // e.g., document.querySelector(`#impact-${assetId}-${scenarioId}`).textContent = impact;
}

function showErrorStatus(jobId, errorMessage) {
  console.error(`Job ${jobId} failed: ${errorMessage}`);
  // Show error message in UI
}

function updateConnectionStatus(isConnected) {
  console.log(`Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
  // Update UI to show connection status
  // e.g., document.querySelector('#connection-status').classList.toggle('connected', isConnected);
}

// In a React component, you could use this in useEffect:
/*
useEffect(() => {
  const cleanup = initializeRealTimeUpdates();
  return cleanup;
}, []);
*/

// For a standalone page
document.addEventListener('DOMContentLoaded', () => {
  initializeRealTimeUpdates();
});
