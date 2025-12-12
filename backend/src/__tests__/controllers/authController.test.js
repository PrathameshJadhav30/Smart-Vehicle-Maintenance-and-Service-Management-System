import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { jest } from '@jest/globals';
import express from 'express';
import authRoutes from '../../routes/authRoutes.js';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn()
}));

// Mock bcrypt
jest.mock('bcrypt');

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer',
        phone: '1234567890',
        address: '123 Main St'
      };

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // Check if user exists
        .mockResolvedValueOnce({ rows: [{ 
          id: 1, 
          name: 'John Doe', 
          email: 'john@example.com', 
          role: 'customer',
          phone: '1234567890',
          address: '123 Main St',
          created_at: new Date().toISOString()
        }] }); // Insert user

      bcrypt.hash.mockResolvedValue('hashed_password');
      jwt.sign.mockReturnValue('jwt_token');

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('token', 'jwt_token');
      expect(response.body.user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'customer',
        phone: '1234567890',
        address: '123 Main St'
      });
    });

    it('should return 400 if user already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer'
      };

      // Mock database response for existing user
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'User already exists with this email');
    });

    it('should return 500 if database error occurs', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer'
      };

      // Mock database error
      mockDb.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Server error during registration');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      // Mock database responses
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 1, 
          name: 'John Doe', 
          email: 'john@example.com', 
          password_hash: 'hashed_password',
          role: 'customer',
          phone: '1234567890',
          address: '123 Main St'
        }] 
      });

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt_token');

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token', 'jwt_token');
      expect(response.body.user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'customer',
        phone: '1234567890',
        address: '123 Main St'
      });
    });

    it('should return 401 for invalid credentials - user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Mock database response for non-existent user
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for invalid credentials - wrong password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      // Mock database responses
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 1, 
          name: 'John Doe', 
          email: 'john@example.com', 
          password_hash: 'hashed_password',
          role: 'customer'
        }] 
      });

      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'customer',
        phone: '1234567890',
        address: '123 Main St',
        created_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Mock JWT token
      jwt.verify.mockReturnValue({ id: 1, email: 'john@example.com', role: 'customer' });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body.user).toEqual(mockUser);
    });

    it('should return 404 if user not found', async () => {
      // Mock database response for non-existent user
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue({ id: 999, email: 'nonexistent@example.com', role: 'customer' });

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('PUT /api/auth/profile/:id', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'John Updated',
        phone: '0987654321',
        address: '456 New St'
      };

      const updatedUser = {
        id: 1,
        name: 'John Updated',
        email: 'john@example.com',
        role: 'customer',
        phone: '0987654321',
        address: '456 New St'
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [updatedUser] });

      // Mock JWT token
      jwt.verify.mockReturnValue({ id: 1, email: 'john@example.com', role: 'customer' });

      const response = await request(app)
        .put('/api/auth/profile/1')
        .set('Authorization', 'Bearer valid_token')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.user).toEqual(updatedUser);
    });

    it('should return 403 if user tries to update another user\'s profile', async () => {
      const updateData = {
        name: 'John Updated'
      };

      // Mock JWT token for different user
      jwt.verify.mockReturnValue({ id: 2, email: 'other@example.com', role: 'customer' });

      const response = await request(app)
        .put('/api/auth/profile/1')
        .set('Authorization', 'Bearer valid_token')
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Access denied');
    });
  });

  describe('PUT /api/auth/change-password/:id', () => {
    it('should change password successfully with valid old password', async () => {
      const passwordData = {
        oldPassword: 'old_password',
        newPassword: 'new_password'
      };

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ password_hash: 'hashed_old_password' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashed_new_password');

      // Mock JWT token
      jwt.verify.mockReturnValue({ id: 1, email: 'john@example.com', role: 'customer' });

      const response = await request(app)
        .put('/api/auth/change-password/1')
        .set('Authorization', 'Bearer valid_token')
        .send(passwordData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Password changed successfully');
    });

    it('should return 400 for incorrect old password', async () => {
      const passwordData = {
        oldPassword: 'wrong_password',
        newPassword: 'new_password'
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hashed_old_password' }] });

      bcrypt.compare.mockResolvedValue(false);

      // Mock JWT token
      jwt.verify.mockReturnValue({ id: 1, email: 'john@example.com', role: 'customer' });

      const response = await request(app)
        .put('/api/auth/change-password/1')
        .set('Authorization', 'Bearer valid_token')
        .send(passwordData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Current password is incorrect');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should generate reset token for existing user', async () => {
      const requestData = {
        email: 'john@example.com'
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, email: 'john@example.com', name: 'John Doe' }] 
      });

      jwt.sign.mockReturnValue('reset_token');

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Password reset token generated');
      expect(response.body).toHaveProperty('resetToken', 'reset_token');
    });

    it('should still return success for non-existent user (to prevent email enumeration)', async () => {
      const requestData = {
        email: 'nonexistent@example.com'
      };

      // Mock database response for non-existent user
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'If an account exists with this email, a password reset link has been sent.');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully with valid token', async () => {
      const requestData = {
        token: 'valid_reset_token',
        newPassword: 'new_password123'
      };

      // Mock JWT verification
      jwt.verify.mockReturnValue({ id: 1, email: 'john@example.com' });

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      bcrypt.hash.mockResolvedValue('hashed_new_password');

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Password reset successfully');
    });

    it('should return 400 for invalid or expired token', async () => {
      const requestData = {
        token: 'invalid_token',
        newPassword: 'new_password123'
      };

      // Mock JWT verification error
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid or expired reset token');
    });
  });
});