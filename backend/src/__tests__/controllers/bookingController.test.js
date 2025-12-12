import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../testServer.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn()
}));

// Mock jwt.verify separately
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn(),
  sign: jest.fn().mockReturnValue('jwt_token')
}));

describe('Booking Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock users
  const mockCustomerUser = { id: 1, email: 'customer@example.com', role: 'customer' };
  const mockMechanicUser = { id: 2, email: 'mechanic@example.com', role: 'mechanic' };
  const mockAdminUser = { id: 3, email: 'admin@example.com', role: 'admin' };

  describe('POST /api/bookings', () => {
    it('should create a new booking successfully', async () => {
      const bookingData = {
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00
      };

      const createdBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        status: 'pending',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [createdBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', 'Bearer customer_token')
        .send(bookingData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Booking created successfully');
      expect(response.body.booking).toEqual(createdBooking);
    });

    it('should return 500 if database error occurs', async () => {
      const bookingData = {
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00'
      };

      // Mock database error
      mockDb.query.mockRejectedValue(new Error('Database error'));

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', 'Bearer customer_token')
        .send(bookingData)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Server error');
    });
  });

  describe('GET /api/bookings/customer/:id', () => {
    it('should get customer bookings successfully', async () => {
      const mockBookings = [
        {
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          service_type: 'oil_change',
          booking_date: '2023-12-25',
          booking_time: '10:00',
          status: 'pending',
          notes: 'Please check engine oil level',
          estimated_cost: 50.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockBookings });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/bookings/customer/1')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.bookings).toEqual(mockBookings);
    });
  });

  describe('GET /api/bookings/pending', () => {
    it('should get pending bookings successfully', async () => {
      const mockPendingBookings = [
        {
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          service_type: 'oil_change',
          booking_date: '2023-12-25',
          booking_time: '10:00',
          status: 'pending',
          notes: 'Please check engine oil level',
          estimated_cost: 50.00,
          customer_name: 'John Doe',
          vehicle_model: 'Toyota Camry',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockPendingBookings });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/bookings/pending')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.pendingBookings).toEqual(mockPendingBookings);
    });
  });

  describe('GET /api/bookings/mechanic/:id', () => {
    it('should get mechanic bookings successfully', async () => {
      const mockMechanicBookings = [
        {
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          service_type: 'oil_change',
          booking_date: '2023-12-25',
          booking_time: '10:00',
          status: 'approved',
          notes: 'Please check engine oil level',
          estimated_cost: 50.00,
          customer_name: 'John Doe',
          vehicle_model: 'Toyota Camry',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockMechanicBookings });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .get('/api/bookings/mechanic/2')
        .set('Authorization', 'Bearer mechanic_token')
        .expect(200);

      expect(response.body.bookings).toEqual(mockMechanicBookings);
    });

    it('should return 403 if unauthorized access', async () => {
      // Mock JWT token for customer trying to access mechanic bookings
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/bookings/mechanic/2')
        .set('Authorization', 'Bearer customer_token')
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Access denied');
    });
  });

  describe('GET /api/bookings', () => {
    it('should get all bookings with pagination successfully', async () => {
      const mockAllBookings = [
        {
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          service_type: 'oil_change',
          booking_date: '2023-12-25',
          booking_time: '10:00',
          status: 'pending',
          notes: 'Please check engine oil level',
          estimated_cost: 50.00,
          customer_name: 'John Doe',
          vehicle_model: 'Toyota Camry',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockAllBookings });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/bookings?page=1&limit=10')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.bookings).toEqual(mockAllBookings);
      expect(response.body.pagination).toHaveProperty('page', 1);
    });
  });

  describe('PUT /api/bookings/:id/approve', () => {
    it('should approve booking successfully', async () => {
      const approvedBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        status: 'approved',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [approvedBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/bookings/1/approve')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking approved successfully');
      expect(response.body.booking).toEqual(approvedBooking);
    });

    it('should return 404 if booking not found', async () => {
      // Mock database response for non-existent booking
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/bookings/999/approve')
        .set('Authorization', 'Bearer admin_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Booking not found');
    });
  });

  describe('PUT /api/bookings/:id/reject', () => {
    it('should reject booking successfully', async () => {
      const rejectedBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        status: 'rejected',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [rejectedBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/bookings/1/reject')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking rejected successfully');
      expect(response.body.booking).toEqual(rejectedBooking);
    });
  });

  describe('PUT /api/bookings/:id/cancel', () => {
    it('should cancel booking successfully', async () => {
      const cancelledBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        status: 'cancelled',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [cancelledBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .put('/api/bookings/1/cancel')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking cancelled successfully');
      expect(response.body.booking).toEqual(cancelledBooking);
    });

    it('should return 403 if customer tries to cancel another customer\'s booking', async () => {
      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [{ customer_id: 2 }] }); // Different customer

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .put('/api/bookings/1/cancel')
        .set('Authorization', 'Bearer customer_token')
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Access denied');
    });
  });

  describe('PUT /api/bookings/:id/reschedule', () => {
    it('should reschedule booking successfully', async () => {
      const rescheduledBookingData = {
        booking_date: '2023-12-26',
        booking_time: '14:00'
      };

      const rescheduledBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-26',
        booking_time: '14:00',
        status: 'pending',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [rescheduledBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .put('/api/bookings/1/reschedule')
        .set('Authorization', 'Bearer customer_token')
        .send(rescheduledBookingData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking rescheduled successfully');
      expect(response.body.booking).toEqual(rescheduledBooking);
    });
  });

  describe('PUT /api/bookings/:id/status', () => {
    it('should update booking status successfully', async () => {
      const statusUpdateData = {
        status: 'in_progress'
      };

      const updatedBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        status: 'in_progress',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [updatedBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/bookings/1/status')
        .set('Authorization', 'Bearer mechanic_token')
        .send(statusUpdateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking status updated successfully');
      expect(response.body.booking).toEqual(updatedBooking);
    });

    it('should return 400 for invalid status', async () => {
      const invalidStatusData = {
        status: 'invalid_status'
      };

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/bookings/1/status')
        .set('Authorization', 'Bearer mechanic_token')
        .send(invalidStatusData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid status');
    });
  });

  describe('PUT /api/bookings/:id/confirm', () => {
    it('should confirm booking successfully', async () => {
      const confirmedBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        status: 'confirmed',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [confirmedBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/bookings/1/confirm')
        .set('Authorization', 'Bearer mechanic_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking confirmed successfully');
      expect(response.body.booking).toEqual(confirmedBooking);
    });
  });

  describe('PUT /api/bookings/:id/assign', () => {
    it('should assign booking to mechanic successfully', async () => {
      const assignData = {
        mechanic_id: 2
      };

      const assignedBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        status: 'assigned',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        mechanic_id: 2,
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [assignedBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/bookings/1/assign')
        .set('Authorization', 'Bearer admin_token')
        .send(assignData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking assigned successfully');
      expect(response.body.booking).toEqual(assignedBooking);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should get booking by ID successfully', async () => {
      const mockBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        status: 'pending',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/bookings/1')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body.booking).toEqual(mockBooking);
    });

    it('should return 404 if booking not found', async () => {
      // Mock database response for non-existent booking
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/bookings/999')
        .set('Authorization', 'Bearer customer_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Booking not found');
    });
  });
});