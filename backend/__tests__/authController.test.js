import { register, login, getProfile } from '../src/controllers/authController';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../src/config/database';

// Mock the database query function
jest.mock('../src/config/database');

// Mock bcrypt and jwt
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'customer',
          phone: '1234567890',
          address: '123 Main St'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock database responses
      query.mockResolvedValueOnce({ rows: [] }); // No existing user
      bcrypt.hash.mockResolvedValueOnce('hashedPassword');
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '1234567890',
          address: '123 Main St',
          created_at: new Date()
        }]
      });
      jwt.sign.mockReturnValue('jwtToken');

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User registered successfully',
        token: 'jwtToken'
      }));
    });

    test('should return 400 if user already exists', async () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'customer'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock database response - user already exists
      query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User already exists with this email' });
    });
  });

  describe('login', () => {
    test('should login user successfully with valid credentials', async () => {
      const req = {
        body: {
          email: 'john@example.com',
          password: 'password123'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock database response
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '1234567890',
          address: '123 Main St',
          password_hash: 'hashedPassword'
        }]
      });

      // Mock bcrypt compare
      bcrypt.compare.mockResolvedValueOnce(true);

      // Mock jwt sign
      jwt.sign.mockReturnValue('jwtToken');

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login successful',
        token: 'jwtToken'
      }));
    });

    test('should return 401 for invalid credentials', async () => {
      const req = {
        body: {
          email: 'john@example.com',
          password: 'wrongPassword'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock database response
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'john@example.com',
          password_hash: 'hashedPassword'
        }]
      });

      // Mock bcrypt compare - wrong password
      bcrypt.compare.mockResolvedValueOnce(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });
  });
});