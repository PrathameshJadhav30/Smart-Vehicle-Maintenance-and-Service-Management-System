import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../../server.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn()
}));

describe('Clear Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock users
  const mockAdminUser = { id: 1, email: 'admin@example.com', role: 'admin' };

  describe('POST /api/clear/database', () => {
    it('should return 403 if not in development environment', async () => {
      // Temporarily set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/clear/database')
        .set('Authorization', 'Bearer admin_token')
        .expect(403);

      expect(response.body).toHaveProperty('message', 'This endpoint is only available in development mode');

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('should clear database successfully in development environment', async () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // DELETE FROM invoices
          .mockResolvedValueOnce({}) // DELETE FROM jobcard_spareparts
          .mockResolvedValueOnce({}) // DELETE FROM jobcard_tasks
          .mockResolvedValueOnce({}) // DELETE FROM jobcards
          .mockResolvedValueOnce({}) // DELETE FROM bookings
          .mockResolvedValueOnce({}) // DELETE FROM vehicles
          .mockResolvedValueOnce({}) // DELETE FROM parts
          .mockResolvedValueOnce({}) // DELETE FROM users
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/clear/database')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Database cleared successfully!');
      expect(mockClient.query).toHaveBeenCalledTimes(10); // BEGIN + 8 DELETEs + COMMIT

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle database clearing errors', async () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockRejectedValueOnce(new Error('Database clear error')), // DELETE FROM invoices (fails)
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/clear/database')
        .set('Authorization', 'Bearer admin_token')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Clearing failed');
      expect(response.body.error).toBe('Database clear error');

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });
});