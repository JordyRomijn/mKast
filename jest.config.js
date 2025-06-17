/**
 * Jest configuration for mKast Arcade Launcher
 */

/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'node',
  
  // Clear mocks automatically
  clearMocks: true,
  
  // Coverage settings
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "js/**/*.js",
    "renderer.js",
    "!**/node_modules/**"
  ],
  
  // Test file patterns
  testMatch: [
    "**/tests/**/*.test.js"
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    "<rootDir>/tests/setup.js"
  ],
  
  // Coverage reporters
  coverageReporters: [
    "text",
    "html"
  ],
  
  // Verbose output
  verbose: true
};

module.exports = config;
