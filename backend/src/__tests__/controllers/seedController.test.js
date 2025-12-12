import request from 'supertest';
import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../server.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn()
}));

// Mock bcrypt
jest.mock('bcrypt');

describe('Seed Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock users
  const mockAdminUser = { id: 1, email: 'admin@example.com', role: 'admin' };

  describe('POST /api/seed/database', () => {
    it('should return 403 if not in development environment', async () => {
      // Temporarily set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/seed/database')
        .set('Authorization', 'Bearer admin_token')
        .expect(403);

      expect(response.body).toHaveProperty('message', 'This endpoint is only available in development mode');

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('should seed database successfully in development environment', async () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Mock bcrypt hash
      bcrypt.hash.mockResolvedValue('hashed_password');

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
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT admin user
          .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT mechanic 1
          .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // INSERT mechanic 2
          .mockResolvedValueOnce({ rows: [{ id: 4 }] }) // INSERT mechanic 3
          .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // INSERT customer 1
          .mockResolvedValueOnce({ rows: [{ id: 6 }] }) // INSERT customer 2
          .mockResolvedValueOnce({ rows: [{ id: 7 }] }) // INSERT customer 3
          .mockResolvedValueOnce({ rows: [{ id: 8 }] }) // INSERT customer 4
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT part 1
          .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT part 2
          .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // INSERT part 3
          .mockResolvedValueOnce({ rows: [{ id: 4 }] }) // INSERT part 4
          .mockResolvedValueOnce({ rows: [{ id: 5 }] }) // INSERT part 5
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT vehicle 1
          .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT vehicle 2
          .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // INSERT vehicle 3
          .mockResolvedValueOnce({ rows: [{ id: 4 }] }) // INSERT vehicle 4
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT booking 1
          .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT booking 2
          .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // INSERT booking 3
          .mockResolvedValueOnce({ rows: [{ id: 4 }] }) // INSERT booking 4
          .mockResolvedValueOnce({ rows: [{ customer_id: 5, vehicle_id: 1 }] }) // SELECT booking data
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT jobcard 1
          .mockResolvedValueOnce({}) // INSERT task 1
          .mockResolvedValueOnce({}) // INSERT task 2
          .mockResolvedValueOnce({}) // INSERT spare part 1
          .mockResolvedValueOnce({}) // INSERT spare part 2
          .mockResolvedValueOnce({}) // INSERT invoice 1
          .mockResolvedValueOnce({ rows: [{ customer_id: 6, vehicle_id: 2 }] }) // SELECT booking data
          .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT jobcard 2
          .mockResolvedValueOnce({}) // INSERT task 1
          .mockResolvedValueOnce({}) // INSERT spare part 1
          .mockResolvedValueOnce({}) // INSERT invoice 2
          .mockResolvedValueOnce({ rows: [{ customer_id: 7, vehicle_id: 3 }] }) // SELECT booking data
          .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // INSERT jobcard 3
          .mockResolvedValueOnce({}) // INSERT task 1
          .mockResolvedValueOnce({}) // INSERT spare part 1
          .mockResolvedValueOnce({}) // COMMIT
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/seed/database')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Database seeded successfully!');
      expect(response.body.usersCreated).toBe(8); // 1 admin + 3 mechanics + 4 customers
      expect(response.body.partsCreated).toBe(5);
      expect(response.body.vehiclesCreated).toBe(4);
      expect(response.body.bookingsCreated).toBe(4);

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle database seeding errors', async () => {
      // Set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Mock bcrypt hash
      bcrypt.hash.mockResolvedValue('hashed_password');

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockRejectedValueOnce(new Error('Database seeding error')), // DELETE FROM invoices (fails)
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/seed/database')
        .set('Authorization', 'Bearer admin_token')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Seeding failed');
      expect(response.body.error).toBe('Database seeding error');

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });
});