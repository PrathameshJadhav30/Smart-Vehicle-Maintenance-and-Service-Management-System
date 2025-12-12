import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoutes.js';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should have the register route defined', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'customer'
        });
      
      // We expect it to not return 404, meaning the route exists
      // The actual logic is tested in controller tests
      expect(response.status).not.toBe(404);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should have the login route defined', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should have the profile route defined', async () => {
      const response = await request(app)
        .get('/api/auth/profile');
      
      // We expect it to not return 404, meaning the route exists
      // Note: It will return 401 because no auth token is provided
      expect(response.status).not.toBe(404);
    });
  });

  describe('PUT /api/auth/users/:id', () => {
    it('should have the update user route defined', async () => {
      const response = await request(app)
        .put('/api/auth/users/1')
        .send({
          name: 'Updated User'
        });
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('PUT /api/auth/users/:id/change-password', () => {
    it('should have the change password route defined', async () => {
      const response = await request(app)
        .put('/api/auth/users/1/change-password')
        .send({
          oldPassword: 'oldpass123',
          newPassword: 'newpass123'
        });
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should have the forgot password route defined', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com'
        });
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should have the reset password route defined', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'reset_token',
          newPassword: 'newpass123'
        });
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });
});