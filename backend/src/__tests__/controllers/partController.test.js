import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../testServer.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn()
}));

// Mock cache
jest.mock('../../utils/cache.js', () => ({
  has: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn()
}));

// Mock jwt.verify separately
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn(),
  sign: jest.fn().mockReturnValue('jwt_token')
}));

describe('Part Controller', () => {
  const mockDb = require('../../config/database.js');
  const mockCache = require('../../utils/cache.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock JWT middleware
  const mockAdminUser = { id: 1, email: 'admin@example.com', role: 'admin' };
  const mockMechanicUser = { id: 2, email: 'mechanic@example.com', role: 'mechanic' };

  describe('POST /api/parts', () => {
    it('should create a new part successfully', async () => {
      const partData = {
        name: 'Engine Oil',
        part_number: 'EO-1234',
        price: 25.99,
        quantity: 50,
        reorder_level: 10,
        description: 'High-quality engine oil',
        supplier_id: 1
      };

      const createdPart = {
        id: 1,
        ...partData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [createdPart] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', 'Bearer admin_token')
        .send(partData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Part added successfully');
      expect(response.body.part).toEqual(createdPart);
    });

    it('should return 400 if part number already exists', async () => {
      const partData = {
        name: 'Engine Oil',
        part_number: 'EO-1234',
        price: 25.99,
        quantity: 50
      };

      // Mock database error for duplicate part number
      mockDb.query.mockRejectedValue({ code: '23505' });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', 'Bearer admin_token')
        .send(partData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Part number already exists');
    });
    
    it('should return 400 if validation fails', async () => {
      const invalidPartData = {
        name: '', // Invalid: empty name
        price: -5, // Invalid: negative price
        quantity: -10 // Invalid: negative quantity
      };

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', 'Bearer admin_token')
        .send(invalidPartData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(3);
    });
  });

  describe('GET /api/parts', () => {
    it('should get all parts successfully', async () => {
      const mockParts = [
        {
          id: 1,
          name: 'Engine Oil',
          part_number: 'EO-1234',
          price: 25.99,
          quantity: 50,
          reorder_level: 10,
          description: 'High-quality engine oil',
          supplier_id: 1,
          supplier_name: 'Auto Parts Supplier',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Air Filter',
          part_number: 'AF-5678',
          price: 15.50,
          quantity: 30,
          reorder_level: 5,
          description: 'Standard air filter',
          supplier_id: 1,
          supplier_name: 'Auto Parts Supplier',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock cache miss
      mockCache.has.mockReturnValue(false);

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockParts });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.parts).toHaveLength(2);
      expect(response.body.parts[0]).toEqual(mockParts[0]);
      expect(response.body.parts[1]).toEqual(mockParts[1]);
    });

    it('should return cached data if available', async () => {
      const cachedParts = {
        parts: [
          {
            id: 1,
            name: 'Engine Oil',
            part_number: 'EO-1234',
            price: 25.99,
            quantity: 50
          }
        ]
      };

      // Mock cache hit
      mockCache.has.mockReturnValue(true);
      mockCache.get.mockReturnValue(cachedParts);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toEqual(cachedParts);
    });
  });

  describe('GET /api/parts/:id', () => {
    it('should get part by ID successfully', async () => {
      const mockPart = {
        id: 1,
        name: 'Engine Oil',
        part_number: 'EO-1234',
        price: 25.99,
        quantity: 50,
        reorder_level: 10,
        description: 'High-quality engine oil',
        supplier_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock cache miss
      mockCache.has.mockReturnValue(false);

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockPart] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/parts/1')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.part).toEqual(mockPart);
    });

    it('should return 404 if part not found', async () => {
      // Mock cache miss
      mockCache.has.mockReturnValue(false);

      // Mock database response for non-existent part
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/parts/999')
        .set('Authorization', 'Bearer admin_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Part not found');
    });
  });

  describe('PUT /api/parts/:id', () => {
    it('should update part successfully', async () => {
      const updateData = {
        name: 'Premium Engine Oil',
        price: 29.99
      };

      const updatedPart = {
        id: 1,
        name: 'Premium Engine Oil',
        part_number: 'EO-1234',
        price: 29.99,
        quantity: 50,
        reorder_level: 10,
        description: 'High-quality engine oil',
        supplier_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [updatedPart] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/parts/1')
        .set('Authorization', 'Bearer admin_token')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Part updated successfully');
      expect(response.body.part).toEqual(updatedPart);
    });

    it('should return 404 if part not found', async () => {
      const updateData = {
        name: 'Premium Engine Oil'
      };

      // Mock database response for non-existent part
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/parts/999')
        .set('Authorization', 'Bearer admin_token')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Part not found');
    });
  });

  describe('DELETE /api/parts/:id', () => {
    it('should delete part successfully', async () => {
      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .delete('/api/parts/1')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Part deleted successfully');
    });

    it('should return 404 if part not found', async () => {
      // Mock database response for non-existent part
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .delete('/api/parts/999')
        .set('Authorization', 'Bearer admin_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Part not found');
    });
  });

  describe('GET /api/parts/low-stock', () => {
    it('should get low stock parts successfully', async () => {
      const mockLowStockParts = [
        {
          id: 2,
          name: 'Air Filter',
          part_number: 'AF-5678',
          price: 15.50,
          quantity: 3,
          reorder_level: 5,
          description: 'Standard air filter',
          supplier_id: 1,
          supplier_name: 'Auto Parts Supplier',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock cache miss
      mockCache.has.mockReturnValue(false);

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockLowStockParts });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/parts/low-stock')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.parts).toHaveLength(1);
      expect(response.body.parts[0]).toEqual(mockLowStockParts[0]);
    });
  });

  describe('GET /api/parts/usage', () => {
    it('should get parts usage successfully', async () => {
      const mockPartsUsage = [
        {
          id: 1,
          name: 'Engine Oil',
          part_number: 'EO-1234',
          total_used: 5,
          total_revenue: 129.95,
          usage_date: new Date().toISOString().split('T')[0]
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockPartsUsage });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/parts/usage')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.partsUsage).toHaveLength(1);
      expect(response.body.partsUsage[0]).toEqual(mockPartsUsage[0]);
    });
  });

  describe('POST /api/parts/supplier', () => {
    it('should create a new supplier successfully', async () => {
      const supplierData = {
        name: 'Auto Parts Supplier',
        contact_person: 'John Smith',
        email: 'john@autoparts.com',
        phone: '1234567890',
        address: '123 Supplier St'
      };

      const createdSupplier = {
        id: 1,
        ...supplierData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [createdSupplier] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/parts/supplier')
        .set('Authorization', 'Bearer admin_token')
        .send(supplierData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Supplier added successfully');
      expect(response.body.supplier).toEqual(createdSupplier);
    });
  });

  describe('GET /api/parts/suppliers', () => {
    it('should get all suppliers successfully', async () => {
      const mockSuppliers = [
        {
          id: 1,
          name: 'Auto Parts Supplier',
          contact_person: 'John Smith',
          email: 'john@autoparts.com',
          phone: '1234567890',
          address: '123 Supplier St',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockSuppliers });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/parts/suppliers')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.suppliers).toHaveLength(1);
      expect(response.body.suppliers[0]).toEqual(mockSuppliers[0]);
    });
  });

  describe('PUT /api/parts/supplier/:id', () => {
    it('should update supplier successfully', async () => {
      const updateData = {
        name: 'Updated Auto Parts Supplier',
        contact_person: 'Jane Smith'
      };

      const updatedSupplier = {
        id: 1,
        name: 'Updated Auto Parts Supplier',
        contact_person: 'Jane Smith',
        email: 'john@autoparts.com',
        phone: '1234567890',
        address: '123 Supplier St',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [updatedSupplier] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/parts/supplier/1')
        .set('Authorization', 'Bearer admin_token')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Supplier updated successfully');
      expect(response.body.supplier).toEqual(updatedSupplier);
    });

    it('should return 404 if supplier not found', async () => {
      const updateData = {
        name: 'Updated Auto Parts Supplier'
      };

      // Mock database response for non-existent supplier
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/parts/supplier/999')
        .set('Authorization', 'Bearer admin_token')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Supplier not found');
    });
  });

  describe('DELETE /api/parts/supplier/:id', () => {
    it('should delete supplier successfully', async () => {
      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .delete('/api/parts/supplier/1')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Supplier deleted successfully');
    });

    it('should return 404 if supplier not found', async () => {
      // Mock database response for non-existent supplier
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .delete('/api/parts/supplier/999')
        .set('Authorization', 'Bearer admin_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Supplier not found');
    });
  });
});