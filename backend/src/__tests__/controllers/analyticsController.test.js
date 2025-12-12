import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../../server.js';

// Mock the database module
jest.mock('../../config/database.js', () => ({
  query: jest.fn()
}));

describe('Analytics Controller', () => {
  const mockDb = require('../../config/database.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock users
  const mockAdminUser = { id: 1, email: 'admin@example.com', role: 'admin' };
  const mockMechanicUser = { id: 2, email: 'mechanic@example.com', role: 'mechanic' };

  describe('GET /api/analytics/vehicles', () => {
    it('should get vehicle analytics successfully', async () => {
      const mockTopVehicles = [
        {
          model: 'Camry',
          vin: 'VIN123',
          service_count: 5,
          total_revenue: 1250.00
        }
      ];

      const mockServicesByModel = [
        {
          model: 'Camry',
          count: 5
        }
      ];

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: mockTopVehicles }) // Top vehicles
        .mockResolvedValueOnce({ rows: mockServicesByModel }); // Services by model

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/analytics/vehicles')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.topVehicles).toEqual(mockTopVehicles);
      expect(response.body.servicesByModel).toEqual(mockServicesByModel);
    });
  });

  describe('GET /api/analytics/parts-usage', () => {
    it('should get parts usage analytics successfully', async () => {
      const mockPartsUsage = [
        {
          name: 'Engine Oil',
          part_number: 'EO-123',
          total_used: 10,
          total_revenue: 250.00
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockPartsUsage });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/analytics/parts-usage')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.partsUsage).toEqual(mockPartsUsage);
    });
  });

  describe('GET /api/analytics/revenue', () => {
    it('should get revenue analytics successfully', async () => {
      const mockTotalRevenue = {
        total_revenue: 5000.00,
        parts_revenue: 2000.00,
        labor_revenue: 3000.00,
        invoice_count: 25
      };

      const mockMonthlyRevenue = [
        {
          month: '2023-01-01T00:00:00.000Z',
          revenue: 5000.00,
          invoice_count: 25
        }
      ];

      const mockDailyRevenue = [
        {
          date: '2023-01-15',
          revenue: 500.00,
          invoice_count: 3
        }
      ];

      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockTotalRevenue] }) // Total revenue
        .mockResolvedValueOnce({ rows: mockMonthlyRevenue }) // Monthly revenue
        .mockResolvedValueOnce({ rows: mockDailyRevenue }); // Daily revenue

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/analytics/revenue')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.totalRevenue).toEqual(mockTotalRevenue);
      expect(response.body.monthlyRevenue).toEqual(mockMonthlyRevenue);
      expect(response.body.dailyRevenue).toEqual(mockDailyRevenue);
    });

    it('should filter revenue analytics by date range', async () => {
      const mockTotalRevenue = {
        total_revenue: 2500.00,
        parts_revenue: 1000.00,
        labor_revenue: 1500.00,
        invoice_count: 12
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockTotalRevenue] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/analytics/revenue?startDate=2023-01-01&endDate=2023-01-31')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.totalRevenue).toEqual(mockTotalRevenue);
    });
  });

  describe('GET /api/analytics/dashboard-stats', () => {
    it('should get dashboard stats successfully', async () => {
      const mockStats = [
        { count: '10' }, // users
        { count: '7' },  // customers
        { count: '15' }, // vehicles
        { count: '3' },  // pending bookings
        { count: '5' },  // active jobs
        { count: '2' },  // low stock parts
        { total: '2500.00' }, // monthly revenue
        { total: '15000.00' }, // total revenue
        { count: '3' },  // mechanics
        [], // recent invoices
        []  // recent job cards
      ];

      // Mock database responses
      mockDb.query.mockResolvedValue({ rows: [] }); // Default mock
      for (let i = 0; i < mockStats.length; i++) {
        if (Array.isArray(mockStats[i])) {
          mockDb.query.mockResolvedValueOnce({ rows: mockStats[i] });
        } else {
          mockDb.query.mockResolvedValueOnce({ rows: [mockStats[i]] });
        }
      }

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/analytics/dashboard-stats')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.totalUsers).toBe(10);
      expect(response.body.totalCustomers).toBe(7);
      expect(response.body.totalVehicles).toBe(15);
      expect(response.body.pendingBookings).toBe(3);
      expect(response.body.activeJobs).toBe(5);
      expect(response.body.lowStockParts).toBe(2);
      expect(response.body.monthlyRevenue).toBe(2500.00);
      expect(response.body.totalRevenue).toBe(15000.00);
      expect(response.body.mechanics).toBe(3);
    });
  });

  describe('GET /api/analytics/mechanic-performance', () => {
    it('should get mechanic performance for admin successfully', async () => {
      const mockMechanicPerformance = [
        {
          id: 2,
          name: 'Mechanic One',
          jobs_completed: 15,
          total_revenue: 3750.00
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockMechanicPerformance });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/analytics/mechanic-performance')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.mechanicPerformance).toEqual(mockMechanicPerformance);
    });

    it('should get detailed performance for mechanic user', async () => {
      const mockMechanicData = {
        id: 2,
        name: 'Mechanic One',
        jobs_completed: 15,
        total_revenue: 3750.00
      };

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: [mockMechanicData] });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockMechanicUser);

      const response = await request(app)
        .get('/api/analytics/mechanic-performance')
        .set('Authorization', 'Bearer mechanic_token')
        .expect(200);

      expect(response.body.performance.jobs_completed).toBe(15);
      expect(response.body.performance.revenue_generated).toBe(3750.00);
    });

    it('should filter mechanic performance by date range', async () => {
      const mockMechanicPerformance = [
        {
          id: 2,
          name: 'Mechanic One',
          jobs_completed: 5,
          total_revenue: 1250.00
        }
      ];

      // Mock database response
      mockDb.query.mockResolvedValueOnce({ rows: mockMechanicPerformance });

      // Mock JWT token
      jwt.verify.mockReturnValue(mockAdminUser);

      const response = await request(app)
        .get('/api/analytics/mechanic-performance?from=2023-01-01&to=2023-01-31')
        .set('Authorization', 'Bearer admin_token')
        .expect(200);

      expect(response.body.mechanicPerformance).toEqual(mockMechanicPerformance);
    });
  });
});