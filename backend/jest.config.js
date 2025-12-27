export default {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!src/migrations/**',
    '!src/seeders/**'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/setupTests.js',
    '/src/__tests__/testServer.js',
    '/jest.config.test.js'
  ],
  transform: {
    '^.+\\.js$': ['babel-jest', { "presets": ['@babel/preset-env'] }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios|uuid|.+uuid)/)'
  ],
  testTimeout: 15000
};