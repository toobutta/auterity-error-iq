import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb: any) {
    this.cb = cb;
  }
  cb: any;
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock performance.memory for memory leak detection tests
Object.defineProperty(window.performance, 'memory', {
  value: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 2172649472,
  },
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Setup MSW for API mocking
import { server } from './server';

// Start MSW server
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Stop MSW server
afterAll(() => {
  server.close();
});

// Global test utilities
global.testUtils = {
  createMockWorkflow: () => ({
    id: 'test-workflow',
    name: 'Test Workflow',
    version: '1.0.0',
    nodes: [],
    edges: [],
    metadata: {}
  }),

  createMockNode: (type = 'action') => ({
    id: `node-${Date.now()}`,
    type,
    position: { x: 100, y: 100 },
    data: { label: `${type} Node` }
  }),

  waitForNextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  mockApiResponse: (data: any) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {}
  })
};
