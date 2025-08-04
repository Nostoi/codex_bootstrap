const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    '<rootDir>/src/store/**/*.{ts,tsx}',
    '<rootDir>/src/components/**/*.{ts,tsx}',
  ],
  coveragePathIgnorePatterns: ['<rootDir>/src/app', '<rootDir>/src/hooks', '<rootDir>/src/lib'],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: {
      branches: 0.8,
      functions: 0.8,
      lines: 0.8,
      statements: 0.8,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
