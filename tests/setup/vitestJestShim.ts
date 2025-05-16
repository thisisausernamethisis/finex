/**
 * Vitest-Jest compatibility shim
 * Provides Jest-compatible functions and methods in a Vitest environment
 */

import { vi } from 'vitest';

// Create or augment the global jest object
globalThis.jest = globalThis.jest || {};

// Map Jest functions to their Vitest equivalents
globalThis.jest.fn = vi.fn;
globalThis.jest.mock = vi.mock;
globalThis.jest.spyOn = vi.spyOn;
globalThis.jest.doMock = vi.doMock;
globalThis.jest.unmock = vi.unmock;
globalThis.jest.resetModules = vi.resetModules;
globalThis.jest.restoreAllMocks = vi.restoreAllMocks;
globalThis.jest.clearAllMocks = vi.clearAllMocks;
globalThis.jest.resetAllMocks = vi.resetAllMocks;
globalThis.jest.isMockFunction = vi.isMockFunction;

// Add requireActual support
globalThis.jest.requireActual = vi.importActual;

// Add mock implementation shims for older Jest syntax
const originalFn = vi.fn;
vi.fn = (impl?: any) => {
  const mockFn = originalFn(impl);
  
  // Ensure these methods exist and are properly bound
  if (!mockFn.mockImplementation) {
    mockFn.mockImplementation = function(implementation) {
      return originalFn.call(this, implementation);
    };
  }
  
  if (!mockFn.mockImplementationOnce) {
    mockFn.mockImplementationOnce = function(implementation) {
      const originalMock = this;
      let called = false;
      return this.mockImplementation(function(...args) {
        if (!called) {
          called = true;
          return implementation.apply(this, args);
        }
        return originalMock.getMockImplementation().apply(this, args);
      });
    };
  }
  
  return mockFn;
};

// Add Jest timer shims
globalThis.jest.useFakeTimers = vi.useFakeTimers;
globalThis.jest.useRealTimers = vi.useRealTimers;
globalThis.jest.advanceTimersByTime = vi.advanceTimersByTime;
globalThis.jest.runAllTimers = vi.runAllTimers;
globalThis.jest.runOnlyPendingTimers = vi.runOnlyPendingTimers;
globalThis.jest.advanceTimersToNextTimer = vi.advanceTimersToNextTimer;

export default globalThis.jest;
