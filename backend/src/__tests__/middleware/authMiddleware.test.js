import { authMiddleware, roleMiddleware } from '../../middleware/auth.js';
import jwt from 'jsonwebtoken';

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should return 401 if no authorization header is provided', () => {
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', () => {
      req.headers.authorization = 'InvalidToken';
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should authenticate user successfully with valid token', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'customer' };
      req.headers.authorization = 'Bearer valid_token';
      
      jwt.verify.mockReturnValue(mockUser);
      
      authMiddleware(req, res, next);
      
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 for expired token', () => {
      req.headers.authorization = 'Bearer expired_token';
      
      jwt.verify.mockImplementation(() => {
        throw { name: 'TokenExpiredError' };
      });
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', () => {
      req.headers.authorization = 'Bearer invalid_token';
      
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('roleMiddleware', () => {
    it('should return 401 if user is not authenticated', () => {
      const middleware = roleMiddleware('admin');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not allowed', () => {
      req.user = { role: 'customer' };
      const middleware = roleMiddleware('admin', 'mechanic');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied. Insufficient permissions.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access for user with allowed role', () => {
      req.user = { role: 'admin' };
      const middleware = roleMiddleware('admin', 'mechanic');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should allow access for user with any of the allowed roles', () => {
      req.user = { role: 'mechanic' };
      const middleware = roleMiddleware('admin', 'mechanic');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});