import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../testServer.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn()
}));

// Mock cache
jest.mock('../../utils/cache.js', () => ({
  default: {
    delete: jest.fn()
  }
}));

// Mock jwt.verify separately
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn(),
  sign: jest.fn().mockReturnValue('jwt_token')
}));

describe('Job Card Controller', () => {
  const mockDb = require('../../config/database.js');
  const mockCache = require('../../utils/cache.js').default;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock users
  const mockMechanicUser = { id: 1, email: 'mechanic@example.com', role: 'mechanic' };
  const mockAdminUser = { id: 2, email: 'admin@example.com', role: 'admin' };
  const mockCustomerUser = { id: 3, email: 'customer@example.com', role: 'customer' };

  describe('POST /api/jobcards', () => {
    it('should create a new job card successfully', async () => {
      const jobCardData = {
        customer_id: 1,
        vehicle_id: 1,
        booking_id: 1,
        notes: 'Engine inspection required',
        estimated_hours: 2.5,
        priority: 'medium'
      };

      const mockVehicle = { id: 1 };
      const mockCustomer = { id: 1 };
      const mockBooking = { id: 1 };
      const createdJobCard = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        booking_id: 1,
        mechanic_id: 1,
        notes: 'Engine inspection required',
        estimated_hours: 2.5,
        priority: 'medium',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockVehicle] }) // Check vehicle exists
        .mockResolvedValueOnce({ rows: [mockCustomer] }) // Check customer exists
        .mockResolvedValueOnce({ rows: [mockBooking] }) // Check booking exists
        .mockResolvedValueOnce({ rows: [createdJobCard] }); // Create job card

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .post('/api/jobcards')
        .set('Authorization', 'Bearer mechanic_token')
        .send(jobCardData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Job card created successfully');
      expect(response.body.jobcard).toEqual(createdJobCard);
    });

    it('should return 400 for invalid vehicle ID', async () => {
      const jobCardData = {
        vehicle_id: 'invalid',
        notes: 'Engine inspection required'
      };

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .post('/api/jobcards')
        .set('Authorization', 'Bearer mechanic_token')
        .send(jobCardData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Vehicle ID must be a valid number');
    });

    it('should return 400 for invalid vehicle', async () => {
      const jobCardData = {
        vehicle_id: 999,
        notes: 'Engine inspection required'
      };

      // Mock database response for non-existent vehicle
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Check vehicle exists

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .post('/api/jobcards')
        .set('Authorization', 'Bearer mechanic_token')
        .send(jobCardData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid vehicle ID');
    });
  });

  describe('GET /api/jobcards', () => {
    it('should get job cards successfully', async () => {
      const mockJobCards = [
        {
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          booking_id: 1,
          mechanic_id: 1,
          notes: 'Engine inspection required',
          estimated_hours: 2.5,
          priority: 'medium',
          status: 'in_progress',
          model: 'Camry',
          vin: 'VIN123',
          customer_name: 'John Doe',
          customer_email: 'customer@example.com',
          mechanic_name: 'Mechanic One',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockJobCards });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/jobcards')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.jobcards).toHaveLength(1);
      expect(response.body.jobcards[0]).toEqual(mockJobCards[0]);
    });

    it('should filter job cards by status', async () => {
      const mockJobCards = [
        {
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          booking_id: 1,
          mechanic_id: 1,
          notes: 'Engine inspection required',
          estimated_hours: 2.5,
          priority: 'medium',
          status: 'completed',
          model: 'Camry',
          vin: 'VIN123',
          customer_name: 'John Doe',
          customer_email: 'customer@example.com',
          mechanic_name: 'Mechanic One'
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockJobCards });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/jobcards?status=completed')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.jobcards).toHaveLength(1);
      expect(response.body.jobcards[0]).toEqual(mockJobCards[0]);
    });
  });

  describe('GET /api/jobcards/:id', () => {
    it('should get job card by ID successfully', async () => {
      const mockJobCard = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        booking_id: 1,
        mechanic_id: 1,
        notes: 'Engine inspection required',
        estimated_hours: 2.5,
        priority: 'medium',
        status: 'in_progress',
        model: 'Camry',
        vin: 'VIN123',
        year: 2020,
        customer_name: 'John Doe',
        customer_email: 'customer@example.com',
        customer_phone: '1234567890',
        mechanic_name: 'Mechanic One',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockTasks = [
        {
          id: 1,
          jobcard_id: 1,
          task_name: 'Oil change',
          task_cost: 25.00,
          created_at: new Date().toISOString()
        }
      ];

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

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockJobCard] }) // Get job card
        .mockResolvedValueOnce({ rows: mockTasks }) // Get tasks
        .mockResolvedValueOnce({ rows: mockParts }); // Get parts

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/jobcards/1')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.jobcard).toEqual(mockJobCard);
      expect(response.body.tasks).toEqual(mockTasks);
      expect(response.body.parts).toEqual(mockParts);
    });

    it('should return 404 if job card not found', async () => {
      // Mock database response for non-existent job card
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/jobcards/999')
        .set('Authorization', 'Bearer admin_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Job card not found');
    });
  });

  describe('PUT /api/jobcards/:id/add-task', () => {
    it('should add task to job card successfully', async () => {
      const taskData = {
        task_name: 'Oil change',
        task_cost: 25.00
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check job card exists
          .mockResolvedValueOnce({ rows: [{ 
            id: 1,
            jobcard_id: 1,
            task_name: 'Oil change',
            task_cost: 25.00,
            created_at: new Date().toISOString()
          }] }) // Add task
          .mockResolvedValueOnce({}) // Update job card labor cost
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/jobcards/1/add-task')
        .set('Authorization', 'Bearer mechanic_token')
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Task added successfully');
      expect(response.body.task).toEqual({
        id: 1,
        jobcard_id: 1,
        task_name: 'Oil change',
        task_cost: 25.00,
        created_at: expect.any(String)
      });
    });

    it('should return 404 if job card not found', async () => {
      const taskData = {
        task_name: 'Oil change',
        task_cost: 25.00
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }), // Check job card exists
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/jobcards/999/add-task')
        .set('Authorization', 'Bearer mechanic_token')
        .send(taskData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Job card not found');
    });
  });

  describe('PUT /api/jobcards/:id/add-mechanic', () => {
    it('should assign mechanic to job card successfully', async () => {
      const assignData = {
        mechanic_id: 1
      };

      const updatedJobCard = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        booking_id: 1,
        mechanic_id: 1,
        notes: 'Engine inspection required',
        estimated_hours: 2.5,
        priority: 'medium',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [updatedJobCard] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/jobcards/1/add-mechanic')
        .set('Authorization', 'Bearer admin_token')
        .send(assignData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Mechanic assigned successfully');
      expect(response.body.jobcard).toEqual(updatedJobCard);
    });

    it('should return 404 if job card not found', async () => {
      const assignData = {
        mechanic_id: 1
      };

      // Mock database response for non-existent job card
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .put('/api/jobcards/999/add-mechanic')
        .set('Authorization', 'Bearer admin_token')
        .send(assignData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Job card not found');
    });
  });

  describe('PUT /api/jobcards/:id/add-sparepart', () => {
    it('should add spare part to job card successfully', async () => {
      const partData = {
        part_id: 1,
        quantity: 2
      };

      const mockPart = {
        id: 1,
        name: 'Engine Oil',
        price: 25.00,
        quantity: 10
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check job card exists
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check mechanic ownership
          .mockResolvedValueOnce({ rows: [mockPart] }) // Get part details
          .mockResolvedValueOnce({ rows: [{ 
            id: 1,
            jobcard_id: 1,
            part_id: 1,
            quantity: 2,
            unit_price: 25.00,
            total_price: 50.00,
            created_at: new Date().toISOString()
          }] }) // Add spare part
          .mockResolvedValueOnce({}) // Update part quantity
          .mockResolvedValueOnce({}) // Update job card total cost
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/jobcards/1/add-sparepart')
        .set('Authorization', 'Bearer mechanic_token')
        .send(partData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Spare part added successfully');
      expect(response.body.sparePart).toEqual({
        id: 1,
        jobcard_id: 1,
        part_id: 1,
        quantity: 2,
        unit_price: 25.00,
        total_price: 50.00,
        created_at: expect.any(String)
      });
    });

    it('should return 404 if part not found', async () => {
      const partData = {
        part_id: 999,
        quantity: 2
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check job card exists
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check mechanic ownership
          .mockResolvedValueOnce({ rows: [] }) // Get part details (not found)
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/jobcards/1/add-sparepart')
        .set('Authorization', 'Bearer mechanic_token')
        .send(partData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Part not found');
    });

    it('should return 400 for insufficient stock', async () => {
      const partData = {
        part_id: 1,
        quantity: 20
      };

      const mockPart = {
        id: 1,
        name: 'Engine Oil',
        price: 25.00,
        quantity: 5 // Less than requested quantity
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check job card exists
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check mechanic ownership
          .mockResolvedValueOnce({ rows: [mockPart] }) // Get part details
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/jobcards/1/add-sparepart')
        .set('Authorization', 'Bearer mechanic_token')
        .send(partData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Insufficient stock');
    });
  });

  describe('PUT /api/jobcards/:id/update-status', () => {
    it('should update job card status successfully', async () => {
      const statusData = {
        status: 'completed'
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check job card exists
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check mechanic ownership
          .mockResolvedValueOnce({ rows: [{ 
            id: 1,
            customer_id: 1,
            booking_id: 1,
            labor_cost: 50.00,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }] }) // Update job card status
          .mockResolvedValueOnce({ rows: [{ parts_total: '25.00' }] }) // Calculate parts total
          .mockResolvedValueOnce({ rows: [{ 
            id: 1,
            jobcard_id: 1,
            customer_id: 1,
            parts_total: 25.00,
            labor_total: 50.00,
            grand_total: 75.00,
            status: 'unpaid',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }] }) // Create invoice
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Update booking status
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/jobcards/1/update-status')
        .set('Authorization', 'Bearer mechanic_token')
        .send(statusData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Job card status updated successfully');
    });

    it('should return 400 for invalid status', async () => {
      const statusData = {
        status: 'invalid_status'
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check job card exists
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }), // Check mechanic ownership
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/jobcards/1/update-status')
        .set('Authorization', 'Bearer mechanic_token')
        .send(statusData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid status');
    });
  });

  describe('GET /api/jobcards/completed', () => {
    it('should get completed job cards successfully', async () => {
      const mockJobCards = [
        {
          id: 1,
          customer_id: 1,
          vehicle_id: 1,
          booking_id: 1,
          mechanic_id: 1,
          notes: 'Engine inspection required',
          estimated_hours: 2.5,
          priority: 'medium',
          status: 'completed',
          completed_at: new Date().toISOString(),
          model: 'Camry',
          vin: 'VIN123',
          customer_name: 'John Doe',
          customer_email: 'customer@example.com',
          mechanic_name: 'Mechanic One',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockJobCards });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/jobcards/completed')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.jobcards).toHaveLength(1);
      expect(response.body.jobcards[0]).toEqual(mockJobCards[0]);
    });
  });

  describe('PUT /api/jobcards/:id/update-progress', () => {
    it('should update job card progress successfully', async () => {
      const progressData = {
        percentComplete: 75,
        notes: 'Almost done with the engine inspection'
      };

      const updatedJobCard = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        booking_id: 1,
        percent_complete: 75,
        notes: 'Almost done with the engine inspection',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check job card exists
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check mechanic ownership
          .mockResolvedValueOnce({ rows: [updatedJobCard] }), // Update job card progress
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/jobcards/1/update-progress')
        .set('Authorization', 'Bearer mechanic_token')
        .send(progressData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Job card progress updated successfully');
      expect(response.body.jobcard.percent_complete).toBe(75);
    });

    it('should return 404 if job card not found', async () => {
      const progressData = {
        percentComplete: 75
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }), // Check job card exists
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .put('/api/jobcards/999/update-progress')
        .set('Authorization', 'Bearer mechanic_token')
        .send(progressData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Job card not found');
    });
  });

  describe('GET /api/jobcards/:id/notes', () => {
    it('should get job card notes successfully', async () => {
      const mockNotes = {
        progress_notes: 'Engine inspection in progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock database response - return the full job card row
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{
          progress_notes: 'Engine inspection in progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }] 
      });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/jobcards/1/notes')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.notes.progress_notes).toBe('Engine inspection in progress');
    });

    it('should return 404 if job card not found', async () => {
      // Mock database response for non-existent job card
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/jobcards/999/notes')
        .set('Authorization', 'Bearer admin_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Job card not found');
    });
  });

  describe('GET /api/jobcards/mechanic/:id', () => {
    it('should get job cards by mechanic ID successfully', async () => {
      const mockJobCard = {
        id: 1,
        customer_id: 1,
        vehicle_id: 1,
        booking_id: 1,
        mechanic_id: 1,
        notes: 'Engine inspection required',
        estimated_hours: 2.5,
        priority: 'medium',
        status: 'in_progress',
        model: 'Camry',
        vin: 'VIN123',
        year: 2020,
        customer_name: 'John Doe',
        customer_email: 'customer@example.com',
        customer_phone: '1234567890',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockTasks = [
        {
          id: 1,
          jobcard_id: 1,
          task_name: 'Oil change',
          task_cost: 25.00
        }
      ];

      const mockParts = [
        {
          id: 1,
          jobcard_id: 1,
          part_id: 1,
          quantity: 1,
          unit_price: 25.00,
          total_price: 25.00,
          part_name: 'Engine Oil'
        }
      ];

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockJobCard] }) // Get job cards
        .mockResolvedValueOnce({ rows: mockTasks }) // Get tasks
        .mockResolvedValueOnce({ rows: mockParts }); // Get parts

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/jobcards/mechanic/1')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.jobcards).toHaveLength(1);
      expect(response.body.jobcards[0]).toEqual({
        ...mockJobCard,
        tasks: mockTasks,
        parts_used: mockParts
      });
    });
  });

  describe('DELETE /api/jobcards/:id', () => {
    it('should delete job card successfully', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // Delete tasks
          .mockResolvedValueOnce({}) // Delete spare parts
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }), // Delete job card
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .delete('/api/jobcards/1')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Job card deleted successfully');
    });

    it('should return 404 if job card not found', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // Delete tasks
          .mockResolvedValueOnce({}) // Delete spare parts
          .mockResolvedValueOnce({ rows: [] }), // Delete job card (not found)
        release: jest.fn()
      };

      // Mock database client
      mockDb.getClient.mockResolvedValue(mockClient);

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .delete('/api/jobcards/999')
        .set('Authorization', 'Bearer admin_token')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Job card not found');
    });
  });
});