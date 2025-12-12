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

describe('Vehicle Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock users
  const mockCustomerUser = { id: 1, email: 'customer@example.com', role: 'customer' };
  const mockAdminUser = { id: 2, email: 'admin@example.com', role: 'admin' };

  describe('POST /api/vehicles', () => {
    it('should create a new vehicle successfully', async () => {
      const vehicleData = {
        vin: 'VIN123456789',
        model: 'Camry',
        year: 2020,
        engine_type: 'V6',
        make: 'Toyota',
        registration_number: 'ABC123',
        mileage: 15000
      };

      const createdVehicle = {
        id: 1,
        customer_id: 1,
        vin: 'VIN123456789',
        model: 'Camry',
        year: 2020,
        engine_type: 'V6',
        make: 'Toyota',
        registration_number: 'ABC123',
        mileage: 15000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [createdVehicle] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', 'Bearer customer_token')
        .send(vehicleData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Vehicle added successfully');
      expect(response.body.vehicle).toEqual(createdVehicle);
    });

    it('should return 400 if vehicle with VIN already exists', async () => {
      const vehicleData = {
        vin: 'DUPLICATE_VIN',
        model: 'Camry',
        year: 2020,
        make: 'Toyota'
      };

      // Mock database error for duplicate VIN
      mockDb.query.mockRejectedValue({ code: '23505' });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', 'Bearer customer_token')
        .send(vehicleData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Vehicle with this VIN already exists');
    });
  });

  describe('GET /api/vehicles', () => {
    it('should get vehicles with pagination successfully', async () => {
      const mockVehicles = [
        {
          id: 1,
          customer_id: 1,
          vin: 'VIN123456789',
          model: 'Camry',
          year: 2020,
          engine_type: 'V6',
          make: 'Toyota',
          registration_number: 'ABC123',
          mileage: 15000,
          customer_name: 'John Doe',
          customer_email: 'customer@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database responses for pagination
      mockDb.query
        .mockResolvedValueOnce({ rows: mockVehicles })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .get('/api/vehicles?page=1&limit=10')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.vehicles).toHaveLength(1);
      expect(response.body.vehicles[0]).toEqual(mockVehicles[0]);
      expect(response.body.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10
      });
    });

    it('should filter vehicles for customer role', async () => {
      const mockVehicles = [
        {
          id: 1,
          customer_id: 1,
          vin: 'VIN123456789',
          model: 'Camry',
          year: 2020,
          engine_type: 'V6',
          make: 'Toyota',
          registration_number: 'ABC123',
          mileage: 15000,
          customer_name: 'John Doe',
          customer_email: 'customer@example.com'
        }
      ];

      // Mock database responses for pagination
      mockDb.query
        .mockResolvedValueOnce({ rows: mockVehicles })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.vehicles).toHaveLength(1);
      expect(response.body.vehicles[0]).toEqual(mockVehicles[0]);
    });
  });

  describe('GET /api/vehicles/user/:id', () => {
    it('should get user vehicles successfully', async () => {
      const mockVehicles = [
        {
          id: 1,
          customer_id: 1,
          vin: 'VIN123456789',
          model: 'Camry',
          year: 2020,
          engine_type: 'V6',
          make: 'Toyota',
          registration_number: 'ABC123',
          mileage: 15000,
          customer_name: 'John Doe',
          customer_email: 'customer@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check user exists
        .mockResolvedValueOnce({ rows: mockVehicles }); // Get vehicles

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .get('/api/vehicles/user/1')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.vehicles).toHaveLength(1);
      expect(response.body.vehicles[0]).toEqual(mockVehicles[0]);
    });

    it('should return 404 if user not found', async () => {
      // Mock database response for non-existent user
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .get('/api/vehicles/user/999')
        .set('Authorization', 'Bearer admin_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('GET /api/vehicles/:id', () => {
    it('should get vehicle by ID successfully', async () => {
      const mockVehicle = {
        id: 1,
        customer_id: 1,
        vin: 'VIN123456789',
        model: 'Camry',
        year: 2020,
        engine_type: 'V6',
        make: 'Toyota',
        registration_number: 'ABC123',
        mileage: 15000,
        customer_name: 'John Doe',
        customer_email: 'customer@example.com',
        customer_phone: '1234567890',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockVehicle] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .get('/api/vehicles/1')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.vehicle).toEqual(mockVehicle);
    });

    it('should return 404 if vehicle not found', async () => {
      // Mock database response for non-existent vehicle
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .get('/api/vehicles/999')
        .set('Authorization', 'Bearer customer_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Vehicle not found');
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('should update vehicle successfully', async () => {
      const updateData = {
        mileage: 20000,
        registration_number: 'XYZ789'
      };

      const updatedVehicle = {
        id: 1,
        customer_id: 1,
        vin: 'VIN123456789',
        model: 'Camry',
        year: 2020,
        engine_type: 'V6',
        make: 'Toyota',
        registration_number: 'XYZ789',
        mileage: 20000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [updatedVehicle] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .put('/api/vehicles/1')
        .set('Authorization', 'Bearer customer_token')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Vehicle updated successfully');
      expect(response.body.vehicle).toEqual(updatedVehicle);
    });

    it('should return 404 if vehicle not found', async () => {
      const updateData = {
        mileage: 20000
      };

      // Mock database response for non-existent vehicle
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .put('/api/vehicles/999')
        .set('Authorization', 'Bearer customer_token')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Vehicle not found');
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('should delete vehicle successfully', async () => {
      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check ownership
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Delete vehicle

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .delete('/api/vehicles/1')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Vehicle deleted successfully');
    });

    it('should return 403 if customer tries to delete another customer\'s vehicle', async () => {
      // Mock database response for ownership check
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // No matching vehicle

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .delete('/api/vehicles/999')
        .set('Authorization', 'Bearer customer_token')
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Access denied. You can only delete your own vehicles.');
    });

    it('should return 404 if vehicle not found', async () => {
      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check ownership
        .mockResolvedValueOnce({ rows: [] }); // Delete vehicle (not found)

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .delete('/api/vehicles/999')
        .set('Authorization', 'Bearer customer_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Vehicle not found');
    });
  });

  describe('GET /api/vehicles/:id/history', () => {
    it('should get vehicle history successfully', async () => {
      const mockHistory = [
        {
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          booking_id: 1,
          mechanic_id: 2,
          notes: 'Engine inspection',
          status: 'completed',
          mechanic_name: 'Mechanic One',
          grand_total: 150.00,
          payment_status: 'paid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockHistory });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .get('/api/vehicles/1/history')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.history).toHaveLength(1);
      expect(response.body.history[0]).toEqual(mockHistory[0]);
    });
  });
});