import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../testServer.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn()
}));

describe('Clear Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Set NODE_ENV to development for testing
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    // Reset NODE_ENV
    delete process.env.NODE_ENV;
  });

  describe('POST /api/clear', () => {
    it('should clear database successfully in development mode', async () => {
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

      const response = await request(app)
        .post('/api/clear')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Database cleared successfully!');
      expect(mockClient.query).toHaveBeenCalledTimes(10); // BEGIN + 8 DELETEs + COMMIT
    });

    it('should return 403 when not in development mode', async () => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/clear')
        .expect(403);

      expect(response.body).toHaveProperty('message', 'This endpoint is only available in development mode');
    });

    it('should handle database errors gracefully', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockRejectedValueOnce(new Error('Database error')) // DELETE FROM invoices (simulate error)
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      const response = await request(app)
        .post('/api/clear')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Clearing failed');
      expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN + failed DELETE + ROLLBACK
    });
  });
});