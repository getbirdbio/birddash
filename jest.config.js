export default {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'server/**/*.js',
    '*.js',
    '!server/server.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!coverage/**'
  ],
  testTimeout: 15000,
  verbose: true
};