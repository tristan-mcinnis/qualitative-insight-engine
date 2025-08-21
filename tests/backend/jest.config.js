module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    '../../src/backend/src/**/*.ts',
    '!../../src/backend/src/**/*.d.ts',
    '!../../src/backend/src/index.ts'
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../src/backend/src/$1'
  },
  testTimeout: 30000,
  verbose: true,
  collectCoverage: false, // Enable manually with --coverage flag
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};