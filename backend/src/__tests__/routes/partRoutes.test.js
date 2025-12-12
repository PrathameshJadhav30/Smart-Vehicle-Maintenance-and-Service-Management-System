import request from 'supertest';
import express from 'express';
import partRoutes from '../../routes/partRoutes.js';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api', partRoutes);

describe('Part Routes', () => {
  describe('POST /api/parts', () => {
    it('should have the create part route defined', async () => {
      const response = await request(app)
        .post('/api/parts')
        .send({
          name: 'Test Part',
          part_number: 'TP-001',
          price: 25.99,
          quantity: 10
        });
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('GET /api/parts', () => {
    it('should have the get parts route defined', async () => {
      const response = await request(app)
        .get('/api/parts');
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('GET /api/parts/:id', () => {
    it('should have the get part by ID route defined', async () => {
      const response = await request(app)
        .get('/api/parts/1');
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('PUT /api/parts/:id', () => {
    it('should have the update part route defined', async () => {
      const response = await request(app)
        .put('/api/parts/1')
        .send({
          name: 'Updated Part'
        });
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('DELETE /api/parts/:id', () => {
    it('should have the delete part route defined', async () => {
      const response = await request(app)
        .delete('/api/parts/1');
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('GET /api/parts/low-stock', () => {
    it('should have the get low stock parts route defined', async () => {
      const response = await request(app)
        .get('/api/parts/low-stock');
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('GET /api/parts/usage', () => {
    it('should have the get parts usage route defined', async () => {
      const response = await request(app)
        .get('/api/parts/usage');
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('POST /api/suppliers', () => {
    it('should have the create supplier route defined', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .send({
          name: 'Test Supplier',
          contact_person: 'John Doe',
          email: 'john@test.com'
        });
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('GET /api/suppliers', () => {
    it('should have the get suppliers route defined', async () => {
      const response = await request(app)
        .get('/api/suppliers');
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    it('should have the update supplier route defined', async () => {
      const response = await request(app)
        .put('/api/suppliers/1')
        .send({
          name: 'Updated Supplier'
        });
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    it('should have the delete supplier route defined', async () => {
      const response = await request(app)
        .delete('/api/suppliers/1');
      
      // We expect it to not return 404, meaning the route exists
      expect(response.status).not.toBe(404);
    });
  });
});