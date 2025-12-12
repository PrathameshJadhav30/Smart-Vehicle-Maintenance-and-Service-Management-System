// Setup file for Jest tests
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Mock environment variables if not present
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'svmms_test';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// Suppress console logs during tests
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Mock Node.js built-in modules
jest.mock('fs');
jest.mock('path');

// Mock native modules that cause issues in test environment
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('jwt_token'),
  verify: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com', role: 'admin' })
}));