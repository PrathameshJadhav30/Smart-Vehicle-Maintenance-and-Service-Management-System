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

describe('Payment Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock users
  const mockCustomerUser = { id: 1, email: 'customer@example.com', role: 'customer' };
  const mockAdminUser = { id: 2, email: 'admin@example.com', role: 'admin' };

  describe('POST /api/payments/process', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 125.00,
        method: 'card' // Changed to valid method
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
        payment_method: 'card',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockInvoice] }) // Check invoice
        .mockResolvedValueOnce({ rows: [updatedInvoice] }); // Update invoice

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', 'Bearer customer_token')
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Payment processed successfully');
      expect(response.body.payment.amount).toBe(125.00);
      expect(response.body.payment.method).toBe('card');
      expect(response.body.invoice).toEqual(updatedInvoice);
    });

    it('should return 400 if required fields are missing', async () => {
      const paymentData = {
        amount: 125.00
      };

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', 'Bearer customer_token')
        .send(paymentData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(2); // invoiceId and method are missing
    });

    it('should return 400 for invalid amount', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: -50.00,
        method: 'card'
      };

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', 'Bearer customer_token')
        .send(paymentData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('message');
      expect(response.body.errors[0].message).toBe('Valid amount is required');
    });

    it('should return 404 if invoice not found', async () => {
      const paymentData = {
        invoiceId: 999,
        amount: 125.00,
        method: 'card'
      };

      // Mock database response for non-existent invoice
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', 'Bearer customer_token')
        .send(paymentData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Invoice not found');
    });

    it('should return 400 if invoice is already paid', async () => {
      const paymentData = {
        invoiceId: 1,
        amount: 125.00,
        method: 'card'
      };

      const mockInvoice = {
        id: 1,
        status: 'paid'
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockInvoice] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .post('/api/payments/process')
        .set('Authorization', 'Bearer customer_token')
        .send(paymentData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invoice is already paid');
    });
  });

  describe('GET /api/payments/history/:invoiceId', () => {
    it('should get payment history successfully', async () => {
      const mockInvoice = {
        id: 1,
        status: 'paid',
        payment_method: 'card',
        paid_at: new Date().toISOString(),
        grand_total: 125.00
      };

      const expectedPaymentHistory = {
        id: 'pay_1',
        invoice_id: 1,
        amount: 125.00,
        method: 'card',
        status: 'completed',
        processed_at: mockInvoice.paid_at
      };
      
      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockInvoice] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .get('/api/payments/history/1')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.paymentHistory).toHaveLength(1);
      expect(response.body.paymentHistory[0]).toEqual(expectedPaymentHistory);
    });

    it('should return empty payment history for unpaid invoice', async () => {
      const mockInvoice = {
        id: 1,
        status: 'unpaid',
        grand_total: 125.00
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockInvoice] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .get('/api/payments/history/1')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.paymentHistory).toHaveLength(0);
    });

    it('should return 404 if invoice not found', async () => {
      // Mock database response for non-existent invoice
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockCustomerUser);

      const response = await request(app)
        .get('/api/payments/history/999')
        .set('Authorization', 'Bearer customer_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Invoice not found');
    });
  });

  describe('POST /api/payments/refund/:paymentId', () => {
    it('should refund payment successfully', async () => {
      const refundData = {
        reason: 'Customer request'
      };

      const mockInvoice = {
        id: 1,
        jobcard_id: 1,
        customer_id: 1,
        parts_total: 50.00,
        labor_total: 75.00,
        grand_total: 125.00,
        status: 'refunded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockInvoice] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .post('/api/payments/refund/pay_1')
        .set('Authorization', 'Bearer admin_token')
        .send(refundData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Payment refunded successfully');
      expect(response.body.refund.amount).toBe(125.00);
      expect(response.body.refund.reason).toBe('Customer request');
    });

    it('should return 404 if payment not found', async () => {
      const refundData = {
        reason: 'Customer request'
      };

      // Mock database response for non-existent payment
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockImplementation(() => mockAdminUser);

      const response = await request(app)
        .post('/api/payments/refund/pay_999')
        .set('Authorization', 'Bearer admin_token')
        .send(refundData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Payment not found');
    });
  });
});