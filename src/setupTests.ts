// Jest setup file
import '@testing-library/jest-dom';

// Mock DOM methods that might not be available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock DOMParser
if (!global.DOMParser) {
  global.DOMParser = class DOMParser {
    parseFromString(str: string, type: string): Document {
      // Simple mock implementation
      return {
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
      } as any;
    }
  } as any;
}
