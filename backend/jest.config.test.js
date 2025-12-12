export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!src/migrations/**',
    '!src/seeders/**',
    '!src/__tests__/**'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!axios)/'
  ],
  verbose: true,
  testTimeout: 10000
};