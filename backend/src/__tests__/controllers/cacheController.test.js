import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../../server.js';

// Mock the cache module
jest.mock('../../utils/cache.js', () => ({
  default: {
    clear: jest.fn(),
    size: jest.fn(),
    cache: {
      keys: jest.fn(() => [])
    }
  }
}));

describe('Cache Controller', () => {
  const mockCache = require('../../utils/cache.js').default;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock users
  const mockAdminUser = { id: 1, email: 'admin@example.com', role: 'admin' };

  describe('POST /api/cache/clear', () => {
    it('should clear cache successfully', async () => {
      // Mock cache clear
      mockCache.clear.mockImplementation(() => {});

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/cache/clear')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Cache cleared successfully');
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('should handle cache clearing errors', async () => {
      // Mock cache clear to throw error
      mockCache.clear.mockImplementation(() => {
        throw new Error('Cache clear error');
      });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/cache/clear')
        .set('Authorization', 'Bearer admin_token')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Server error');
      expect(response.body.error).toBe('Cache clear error');
    });
  });

  describe('GET /api/cache/stats', () => {
    it('should get cache statistics successfully', async () => {
      // Mock cache stats
      mockCache.size.mockReturnValue(5);
      mockCache.cache.keys.mockReturnValue(['key1', 'key2', 'key3', 'key4', 'key5']);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/cache/stats')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Cache statistics retrieved');
      expect(response.body.size).toBe(5);
      expect(response.body.keys).toHaveLength(5);
    });

    it('should handle cache stats errors', async () => {
      // Mock cache stats to throw error
      mockCache.size.mockImplementation(() => {
        throw new Error('Cache stats error');
      });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/cache/stats')
        .set('Authorization', 'Bearer admin_token')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Server error');
      expect(response.body.error).toBe('Cache stats error');
    });
  });
});