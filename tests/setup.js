// Global test setup for BirdDash
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create test user data
  createTestUser: (overrides = {}) => ({
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123',
    ...overrides
  }),
  
  // Helper to create test score data
  createTestScore: (overrides = {}) => ({
    score: 1000,
    gameStats: {
      distance: 500,
      collectibles: 25,
      powerUpsUsed: 3,
      obstacles: 10,
      playtime: 120,
      maxCombo: 5,
      deaths: 1,
      level: 3
    },
    ...overrides
  }),
  
  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};
