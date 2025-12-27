import { jest } from '@jest/globals';

// Mock all dependencies before importing the controller
jest.mock('../../config/database.js', () => ({
  query: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('jwt_token'),
  verify: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com', role: 'admin' })
}));

// Import the controller after mocks are set up
import * as authController from '../../controllers/authController.js';

describe('Auth Controller', () => {
  const mockDb = require('../../config/database.js');
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      body: {},
      params: {},
      user: {},
      headers: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockReq.body = {
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
        }] }) // Insert user
        .mockResolvedValueOnce({ rows: [] }); // Insert refresh token

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        accessToken: 'jwt_token',
        refreshToken: 'jwt_token',
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '1234567890',
          address: '123 Main St'
        }
      });
    });

    it('should return 400 if user already exists', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer'
      };

      // Mock database response for existing user
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User already exists with this email' });
    });

    it('should return 500 if database error occurs', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer'
      };

      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Server error during registration' });
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      mockReq.body = {
        email: 'john@example.com',
        password: 'password123'
      };

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe', 
            email: 'john@example.com', 
            password_hash: 'hashed_password',
            role: 'customer',
            phone: '1234567890',
            address: '123 Main St'
          }] 
        })
        .mockResolvedValueOnce({ rows: [] }); // Insert refresh token

      // Ensure bcrypt.compare returns true for this test
      require('bcrypt').compare.mockResolvedValue(true);

      await authController.login(mockReq, mockRes, mockNext);

      // For successful responses, the controller calls res.json() directly without res.status()
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login successful',
        accessToken: 'jwt_token',
        refreshToken: 'jwt_token',
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '1234567890',
          address: '123 Main St'
        }
      });
    });

    it('should return 401 for invalid credentials - user not found', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Mock database response for non-existent user
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return 401 for invalid credentials - wrong password', async () => {
      mockReq.body = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: 'John Doe', 
            email: 'john@example.com', 
            password_hash: 'hashed_password',
            role: 'customer'
          }] 
        })
        .mockResolvedValueOnce({ rows: [] }); // Insert refresh token

      // Override bcrypt.compare mock for this test to return false
      require('bcrypt').compare.mockResolvedValue(false);

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      mockReq.user = { id: 1 };
      
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'customer',
        phone: '1234567890',
        address: '123 Main St',
        created_at: new Date().toISOString()
      };

      // Mock database response for SELECT query specifically
      mockDb.query = jest.fn().mockImplementation((queryText, params) => {
        if (queryText.includes('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = $1')) {
          return Promise.resolve({ rows: [mockUser] });
        }
        // Default response for other queries
        return Promise.resolve({ rows: [] });
      });

      await authController.getProfile(mockReq, mockRes, mockNext);

      // For successful responses, the controller calls res.json() directly without res.status()
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it('should return 404 if user not found', async () => {
      mockReq.user = { id: 999 };
      
      // Mock database response for non-existent user
      mockDb.query = jest.fn().mockImplementation((queryText, params) => {
        if (queryText.includes('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = $1')) {
          return Promise.resolve({ rows: [] });
        }
        // Default response for other queries
        return Promise.resolve({ rows: [] });
      });

      await authController.getProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      mockReq.user = { id: 1 };
      mockReq.params = { id: '1' };
      mockReq.body = {
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

      // Mock database response - update returns updated user
      mockDb.query = jest.fn().mockImplementation((queryText, params) => {
        if (queryText.includes('UPDATE users') && queryText.includes('RETURNING')) {
          return Promise.resolve({ rows: [updatedUser] });
        }
        // Default response for other queries
        return Promise.resolve({ rows: [] });
      });

      await authController.updateProfile(mockReq, mockRes, mockNext);

      // For successful responses, the controller calls res.json() directly without res.status()
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    });

    it('should return 403 if user tries to update another user\'s profile', async () => {
      mockReq.user = { id: 2 };
      mockReq.params = { id: '1' };
      mockReq.body = {
        name: 'John Updated'
      };

      await authController.updateProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access denied' });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully with valid old password', async () => {
      mockReq.user = { id: 1 };
      mockReq.params = { id: '1' };
      mockReq.body = {
        oldPassword: 'old_password',
        newPassword: 'new_password'
      };

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ password_hash: 'hashed_old_password' }] }) // Get user for password check
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Update password

      // Ensure bcrypt.compare returns true for this test
      require('bcrypt').compare.mockResolvedValue(true);

      await authController.changePassword(mockReq, mockRes, mockNext);

      // For successful responses, the controller calls res.json() directly without res.status()
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password changed successfully' });
    });

    it('should return 400 for incorrect old password', async () => {
      mockReq.user = { id: 1 };
      mockReq.params = { id: '1' };
      mockReq.body = {
        oldPassword: 'wrong_password',
        newPassword: 'new_password'
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hashed_old_password' }] });

      // Override bcrypt.compare mock for this test to return false
      require('bcrypt').compare.mockResolvedValue(false);

      await authController.changePassword(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Current password is incorrect' });
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for existing user', async () => {
      mockReq.body = {
        email: 'john@example.com'
      };

      // Mock database response - user exists
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, email: 'john@example.com', name: 'John Doe' }] 
      });

      await authController.forgotPassword(mockReq, mockRes, mockNext);

      // For successful responses, the controller calls res.json() directly without res.status()
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Password reset token generated',
        resetToken: 'jwt_token'
      });
    });

    it('should still return success for non-existent user (to prevent email enumeration)', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com'
      };

      // Mock database response - user does not exist (empty array)
      mockDb.query = jest.fn().mockImplementation((queryText, params) => {
        if (queryText.includes('SELECT id, email, name FROM users WHERE email = $1')) {
          return Promise.resolve({ rows: [] });
        }
        // Default response for other queries
        return Promise.resolve({ rows: [] });
      });

      await authController.forgotPassword(mockReq, mockRes, mockNext);

      // For successful responses, the controller calls res.json() directly without res.status()
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with valid token', async () => {
      mockReq.body = {
        token: 'valid_reset_token',
        newPassword: 'new_password123'
      };

      // Mock JWT verification
      require('jsonwebtoken').verify.mockReturnValue({ id: 1, email: 'john@example.com' });

      // Mock database response - user exists and gets updated
      mockDb.query = jest.fn().mockImplementation((queryText, params) => {
        if (queryText.includes('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        // Default response for other queries
        return Promise.resolve({ rows: [] });
      });

      await authController.resetPassword(mockReq, mockRes, mockNext);

      // For successful responses, the controller calls res.json() directly without res.status()
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });

    it('should return 400 for invalid or expired token', async () => {
      mockReq.body = {
        token: 'invalid_token',
        newPassword: 'new_password123'
      };

      // Mock JWT verification error
      require('jsonwebtoken').verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.resetPassword(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid or expired reset token' });
    });
  });
});