import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../testServer.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn()
}));

// Mock jwt.verify separately
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn(),
  sign: jest.fn().mockReturnValue('jwt_token')
}));

describe('User Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock JWT middleware
  const mockAdminUser = { id: 1, email: 'admin@example.com', role: 'admin' };
  const mockCustomerUser = { id: 2, email: 'customer@example.com', role: 'customer' };

  describe('GET /api/users', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          phone: '1234567890',
          address: '123 Admin St',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Customer User',
          email: 'customer@example.com',
          role: 'customer',
          phone: '0987654321',
          address: '456 Customer Ave',
          created_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockUsers });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0]).toEqual(mockUsers[0]);
      expect(response.body.users[1]).toEqual(mockUsers[1]);
    });

    it('should return 500 if database error occurs', async () => {
      // Mock database error
      mockDb.query.mockRejectedValue(new Error('Database error'));

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer admin_token')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Server error');
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('should update user role successfully', async () => {
      const updatedUser = {
        id: 2,
        name: 'Customer User',
        email: 'customer@example.com',
        role: 'mechanic'
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [updatedUser] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .put('/api/users/2/role')
        .set('Authorization', 'Bearer admin_token')
        .send({ role: 'mechanic' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User role updated successfully');
      expect(response.body.user).toEqual(updatedUser);
    });

    it('should return 400 for invalid role', async () => {
      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .put('/api/users/2/role')
        .set('Authorization', 'Bearer admin_token')
        .send({ role: 'invalid_role' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 404 if user not found', async () => {
      // Mock database response for non-existent user
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .put('/api/users/999/role')
        .set('Authorization', 'Bearer admin_token')
        .send({ role: 'mechanic' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      // Mock database responses for cascade delete
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Check user exists
        .mockResolvedValueOnce({ rows: [] }) // Delete vehicles
        .mockResolvedValueOnce({ rows: [] }) // Delete bookings
        .mockResolvedValueOnce({ rows: [] }) // Delete invoices
        .mockResolvedValueOnce({ rows: [] }) // Delete job cards
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }); // Delete user

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .delete('/api/users/2')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should return 400 if user tries to delete themselves', async () => {
      // Mock JWT token for admin trying to delete themselves
      jwt.verify.mockImplementation(() => ({ id: 1, email: 'admin@example.com', role: 'admin' }));

      const response = await request(app)
        .delete('/api/users/1')
        .set('Authorization', 'Bearer admin_token')
        .expect(400);

      expect(response.body).toHaveProperty('message', 'You cannot delete your own account');
    });

    it('should return 404 if user not found', async () => {
      // Mock database response for non-existent user
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .delete('/api/users/999')
        .set('Authorization', 'Bearer admin_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('GET /api/users/mechanics', () => {
    it('should get all mechanics successfully', async () => {
      const mockMechanics = [
        {
          id: 3,
          name: 'Mechanic One',
          email: 'mech1@example.com',
          phone: '1111111111',
          address: '789 Mechanic Blvd',
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Mechanic Two',
          email: 'mech2@example.com',
          phone: '2222222222',
          address: '987 Repair St',
          created_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockMechanics });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .get('/api/users/mechanics')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.mechanics).toHaveLength(2);
      expect(response.body.mechanics[0]).toEqual(mockMechanics[0]);
      expect(response.body.mechanics[1]).toEqual(mockMechanics[1]);
    });

    it('should return 500 if database error occurs', async () => {
      // Mock database error
      mockDb.query.mockRejectedValue(new Error('Database error'));

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .get('/api/users/mechanics')
        .set('Authorization', 'Bearer admin_token')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Server error');
    });
  });
});