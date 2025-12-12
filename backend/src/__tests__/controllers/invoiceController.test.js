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

describe('Invoice Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock users
  const mockCustomerUser = { id: 1, email: 'customer@example.com', role: 'customer' };
  const mockAdminUser = { id: 2, email: 'admin@example.com', role: 'admin' };

  describe('POST /api/invoices', () => {
    it('should create a new invoice successfully', async () => {
      const invoiceData = {
        jobcard_id: 1,
        customer_id: 1,
        parts_total: 50.00,
        labor_total: 75.00,
        grand_total: 125.00
      };

      const createdInvoice = {
        id: 1,
        jobcard_id: 1,
        customer_id: 1,
        parts_total: 50.00,
        labor_total: 75.00,
        grand_total: 125.00,
        status: 'unpaid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [createdInvoice] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', 'Bearer admin_token')
        .send(invoiceData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Invoice created successfully');
      expect(response.body.invoice).toEqual(createdInvoice);
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('should get invoice by ID successfully', async () => {
      const mockInvoice = {
        id: 1,
        jobcard_id: 1,
        customer_id: 1,
        parts_total: 50.00,
        labor_total: 75.00,
        grand_total: 125.00,
        status: 'unpaid',
        customer_name: 'John Doe',
        customer_email: 'customer@example.com',
        customer_phone: '1234567890',
        model: 'Camry',
        vin: 'VIN123',
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockParts = [
        {
          id: 1,
          jobcard_id: 1,
          part_id: 1,
          quantity: 1,
          unit_price: 25.00,
          total_price: 25.00,
          part_name: 'Engine Oil',
          part_number: 'EO-1234',
          created_at: new Date().toISOString()
        }
      ];

      const mockTasks = [
        {
          id: 1,
          jobcard_id: 1,
          task_name: 'Oil change',
          task_cost: 25.00,
          created_at: new Date().toISOString()
        }
      ];

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockInvoice] }) // Get invoice
        .mockResolvedValueOnce({ rows: mockParts }) // Get parts
        .mockResolvedValueOnce({ rows: mockTasks }); // Get tasks

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/invoices/1')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.invoice).toEqual(mockInvoice);
      expect(response.body.parts).toEqual(mockParts);
      expect(response.body.tasks).toEqual(mockTasks);
    });

    it('should return 404 if invoice not found', async () => {
      // Mock database response for non-existent invoice
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/invoices/999')
        .set('Authorization', 'Bearer customer_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Invoice not found');
    });
  });

  describe('GET /api/invoices/booking/:bookingId', () => {
    it('should get invoice by booking ID successfully', async () => {
      const mockInvoice = {
        id: 1,
        jobcard_id: 1,
        customer_id: 1,
        parts_total: 50.00,
        labor_total: 75.00,
        grand_total: 125.00,
        status: 'unpaid',
        customer_name: 'John Doe',
        customer_email: 'customer@example.com',
        customer_phone: '1234567890',
        model: 'Camry',
        vin: 'VIN123',
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockParts = [
        {
          id: 1,
          jobcard_id: 1,
          part_id: 1,
          quantity: 1,
          unit_price: 25.00,
          total_price: 25.00,
          part_name: 'Engine Oil',
          part_number: 'EO-1234'
        }
      ];

      const mockTasks = [
        {
          id: 1,
          jobcard_id: 1,
          task_name: 'Oil change',
          task_cost: 25.00
        }
      ];

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockInvoice] }) // Get invoice
        .mockResolvedValueOnce({ rows: mockParts }) // Get parts
        .mockResolvedValueOnce({ rows: mockTasks }); // Get tasks

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/invoices/booking/1')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.invoice).toEqual(mockInvoice);
      expect(response.body.parts).toEqual(mockParts);
      expect(response.body.tasks).toEqual(mockTasks);
    });

    it('should return 404 if invoice not found for booking', async () => {
      // Mock database response for non-existent invoice
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/invoices/booking/999')
        .set('Authorization', 'Bearer customer_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Invoice not found for this booking');
    });
  });

  describe('GET /api/invoices/customer/:id', () => {
    it('should get customer invoices successfully', async () => {
      const mockInvoices = [
        {
          id: 1,
          jobcard_id: 1,
          customer_id: 1,
          parts_total: 50.00,
          labor_total: 75.00,
          grand_total: 125.00,
          status: 'unpaid',
          model: 'Camry',
          vin: 'VIN123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockInvoices });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/invoices/customer/1')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.invoices).toHaveLength(1);
      expect(response.body.invoices[0]).toEqual(mockInvoices[0]);
    });
  });

  describe('GET /api/invoices', () => {
    it('should get all invoices successfully', async () => {
      const mockInvoices = [
        {
          id: 1,
          jobcard_id: 1,
          customer_id: 1,
          parts_total: 50.00,
          labor_total: 75.00,
          grand_total: 125.00,
          status: 'unpaid',
          customer_name: 'John Doe',
          model: 'Camry',
          vin: 'VIN123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockInvoices });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.invoices).toHaveLength(1);
      expect(response.body.invoices[0]).toEqual(mockInvoices[0]);
    });
  });

  describe('PUT /api/invoices/:id/payment', () => {
    it('should update payment status successfully', async () => {
      const statusData = {
        status: 'paid',
        payment_method: 'credit_card'
      };

      const updatedInvoice = {
        id: 1,
        jobcard_id: 1,
        customer_id: 1,
        parts_total: 50.00,
        labor_total: 75.00,
        grand_total: 125.00,
        status: 'paid',
        payment_method: 'credit_card',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [updatedInvoice] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/invoices/1/payment')
        .set('Authorization', 'Bearer admin_token')
        .send(statusData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Payment status updated successfully');
      expect(response.body.invoice).toEqual(updatedInvoice);
    });

    it('should return 404 if invoice not found', async () => {
      const statusData = {
        status: 'paid'
      };

      // Mock database response for non-existent invoice
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/invoices/999/payment')
        .set('Authorization', 'Bearer admin_token')
        .send(statusData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Invoice not found');
    });
  });

  describe('POST /api/invoices/mock', () => {
    it('should process mock payment successfully', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 125.00,
        method: 'credit_card'
      };

      const mockInvoice = {
        id: 1,
        jobcard_id: 1,
        customer_id: 1,
        parts_total: 50.00,
        labor_total: 75.00,
        grand_total: 125.00,
        status: 'unpaid'
      };

      const updatedInvoice = {
        id: 1,
        jobcard_id: 1,
        customer_id: 1,
        parts_total: 50.00,
        labor_total: 75.00,
        grand_total: 125.00,
        status: 'paid',
        payment_method: 'credit_card',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockInvoice] }) // Get invoice
        .mockResolvedValueOnce({ rows: [updatedInvoice] }); // Update invoice

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .post('/api/invoices/mock')
        .set('Authorization', 'Bearer customer_token')
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Payment processed successfully');
      expect(response.body.success).toBe(true);
      expect(response.body.invoice).toEqual(updatedInvoice);
    });

    it('should return 404 if invoice not found', async () => {
      const paymentData = {
        invoiceId: 999,
        amount: 125.00,
        method: 'credit_card'
      };

      // Mock database response for non-existent invoice
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .post('/api/invoices/mock')
        .set('Authorization', 'Bearer customer_token')
        .send(paymentData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Invoice not found');
    });
  });
});