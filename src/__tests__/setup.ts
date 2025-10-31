// Jest setup file for testing environment
import '@testing-library/jest-dom';

// Mock file system operations for Node.js environment
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
}));

// Mock path operations
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
  basename: jest.fn((file) => file.split('/').pop()),
}));

// // Type declaration shim for react-dom/test-utils to avoid TS7016 in tests
// // We only use `act` in tests, and Jest environment provides the runtime.
// declare module 'react-dom/test-utils' {
//   export const act: (callback: () => void | Promise<void>) => void | Promise<void>;
// }
