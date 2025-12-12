import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../../server.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn()
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
          model: 'Camry',
          vin: 'VIN123',
          year: 2020,
          make: 'Toyota',
          customer_name: 'John Doe',
          customer_phone: '1234567890',
          customer_email: 'customer@example.com',
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

      expect(response.body.bookings).toHaveLength(1);
      expect(response.body.bookings[0]).toEqual(mockBookings[0]);
    });
  });

  describe('GET /api/bookings/pending', () => {
    it('should get pending bookings successfully', async () => {
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
          model: 'Camry',
          vin: 'VIN123',
          year: 2020,
          make: 'Toyota',
          customer_name: 'John Doe',
          customer_phone: '1234567890',
          customer_email: 'customer@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockBookings });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .get('/api/bookings/pending')
        .set('Authorization', 'Bearer mechanic_token')
        .expect(200);

      expect(response.body.bookings).toHaveLength(1);
      expect(response.body.bookings[0]).toEqual(mockBookings[0]);
    });
  });

  describe('GET /api/bookings/mechanic/:id', () => {
    it('should get mechanic bookings successfully', async () => {
      const mockBookings = [
        {
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          service_type: 'oil_change',
          booking_date: '2023-12-25',
          booking_time: '10:00',
          status: 'assigned',
          notes: 'Please check engine oil level',
          estimated_cost: 50.00,
          model: 'Camry',
          vin: 'VIN123',
          year: 2020,
          make: 'Toyota',
          customer_name: 'John Doe',
          customer_phone: '1234567890',
          customer_email: 'customer@example.com',
          mechanic_id: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockBookings });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .get('/api/bookings/mechanic/2')
        .set('Authorization', 'Bearer mechanic_token')
        .expect(200);

      expect(response.body.bookings).toHaveLength(1);
      expect(response.body.bookings[0]).toEqual(mockBookings[0]);
    });

    it('should return 403 if unauthorized access', async () => {
      // Mock JWT token for customer trying to access mechanic bookings
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .get('/api/bookings/mechanic/2')
        .set('Authorization', 'Bearer customer_token')
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Unauthorized access');
    });
  });

  describe('GET /api/bookings', () => {
    it('should get all bookings with pagination successfully', async () => {
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
          model: 'Camry',
          vin: 'VIN123',
          customer_name: 'John Doe'
        }
      ];

      // Mock database responses for pagination
      mockDb.query
        .mockResolvedValueOnce({ rows: mockBookings })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/bookings?page=1&limit=10')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.bookings).toHaveLength(1);
      expect(response.body.bookings[0]).toEqual(mockBookings[0]);
      expect(response.body.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10
      });
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
        created_at: new Date().toISOString(),
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

      expect(response.body).toHaveProperty('message', 'Booking approved');
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
        created_at: new Date().toISOString(),
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

      expect(response.body).toHaveProperty('message', 'Booking rejected');
      expect(response.body.booking).toEqual(rejectedBooking);
    });
  });

  describe('PUT /api/bookings/:id/cancel', () => {
    it('should cancel booking successfully', async () => {
      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 1 }] }) // Check booking exists
        .mockResolvedValueOnce({ rows: [{ 
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          service_type: 'oil_change',
          booking_date: '2023-12-25',
          booking_time: '10:00',
          status: 'rejected',
          notes: 'Please check engine oil level',
          estimated_cost: 50.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }] }); // Update booking

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .put('/api/bookings/1/cancel')
        .set('Authorization', 'Bearer customer_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking rejected');
    });

    it('should return 403 if customer tries to cancel another customer\'s booking', async () => {
      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1, customer_id: 2 }] }); // Different customer

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .put('/api/bookings/1/cancel')
        .set('Authorization', 'Bearer customer_token')
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });
  });

  describe('PUT /api/bookings/:id/reschedule', () => {
    it('should reschedule booking successfully', async () => {
      const rescheduleData = {
        newDateTime: {
          date: '2023-12-30',
          time: '14:00'
        }
      };

      const rescheduledBooking = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        service_type: 'oil_change',
        booking_date: '2023-12-30 14:00',
        booking_time: '14:00',
        status: 'pending',
        notes: 'Please check engine oil level',
        estimated_cost: 50.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [rescheduledBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockCustomerUser);

      const response = await request(app)
        .put('/api/bookings/1/reschedule')
        .set('Authorization', 'Bearer customer_token')
        .send(rescheduleData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking rescheduled');
      expect(response.body.booking).toEqual(rescheduledBooking);
    });
  });

  describe('PUT /api/bookings/:id/status', () => {
    it('should update booking status successfully', async () => {
      const statusData = {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [updatedBooking] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/bookings/1/status')
        .set('Authorization', 'Bearer mechanic_token')
        .send(statusData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking status updated');
      expect(response.body.booking).toEqual(updatedBooking);
    });

    it('should return 400 for invalid status', async () => {
      const statusData = {
        status: 'invalid_status'
      };

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/bookings/1/status')
        .set('Authorization', 'Bearer mechanic_token')
        .send(statusData)
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
        created_at: new Date().toISOString(),
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

      expect(response.body).toHaveProperty('message', 'Booking confirmed');
      expect(response.body.booking).toEqual(confirmedBooking);
    });
  });

  describe('PUT /api/bookings/:id/assign', () => {
    it('should assign booking to mechanic successfully', async () => {
      const assignData = {
        mechanicId: 2
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ 
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }] }) // Update booking
          .mockResolvedValueOnce({ rows: [{ 
            id: 1,
            booking_id: 1,
            customer_id: 1,
            vehicle_id: 1,
            mechanic_id: 2,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }] }) // Create job card
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/bookings/1/assign')
        .set('Authorization', 'Bearer admin_token')
        .send(assignData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Booking assigned to mechanic and job card created');
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
        model: 'Camry',
        vin: 'VIN123',
        year: 2020,
        make: 'Toyota',
        customer_name: 'John Doe',
        customer_phone: '1234567890',
        customer_email: 'customer@example.com',
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