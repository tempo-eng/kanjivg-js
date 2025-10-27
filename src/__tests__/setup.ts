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
