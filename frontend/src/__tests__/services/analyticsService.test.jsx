import {
  getVehicleAnalytics,
  getPartsUsageAnalytics,
  getRevenueAnalytics,
  getDashboardStats,
  getMechanicPerformance
} from '../../services/analyticsService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVehicleAnalytics', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = {
        totalVehicles: 1500,
        activeVehicles: 1200,
        inactiveVehicles: 300
      };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getVehicleAnalytics();

      expect(api.get).toHaveBeenCalledWith('/analytics/vehicles');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getVehicleAnalytics()).rejects.toThrow('Network error');
    });
  });

  describe('getPartsUsageAnalytics', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = {
        mostUsedParts: [
          { name: 'Oil Filter', count: 150 },
          { name: 'Brake Pad', count: 120 }
        ],
        totalUsage: 500
      };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getPartsUsageAnalytics();

      expect(api.get).toHaveBeenCalledWith('/analytics/parts-usage');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getPartsUsageAnalytics()).rejects.toThrow('Network error');
    });
  });

  describe('getRevenueAnalytics', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = {
        monthlyRevenue: 50000,
        yearlyRevenue: 600000,
        growthRate: 0.15
      };
      const params = { period: 'monthly' };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getRevenueAnalytics(params);

      expect(api.get).toHaveBeenCalledWith('/analytics/revenue', { params });
      expect(result).toEqual(mockResponse);
    });

    test('should call api.get with default empty params when no params provided', async () => {
      const mockResponse = { monthlyRevenue: 50000 };
      api.get.mockResolvedValue({ data: mockResponse });

      await getRevenueAnalytics();

      expect(api.get).toHaveBeenCalledWith('/analytics/revenue', { params: {} });
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getRevenueAnalytics()).rejects.toThrow('Network error');
    });
  });

  describe('getDashboardStats', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = {
        totalBookings: 1200,
        pendingJobs: 45,
        completedJobs: 1155,
        activeUsers: 340
      };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getDashboardStats();

      expect(api.get).toHaveBeenCalledWith('/analytics/dashboard-stats');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getDashboardStats()).rejects.toThrow('Network error');
    });
  });

  describe('getMechanicPerformance', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = {
        performanceMetrics: [
          { mechanicId: 1, name: 'John Doe', completedJobs: 50, avgRating: 4.5 },
          { mechanicId: 2, name: 'Jane Smith', completedJobs: 45, avgRating: 4.8 }
        ]
      };
      const params = { timeframe: 'monthly' };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getMechanicPerformance(params);

      expect(api.get).toHaveBeenCalledWith('/analytics/mechanic-performance', { params });
      expect(result).toEqual(mockResponse);
    });

    test('should call api.get with default empty params when no params provided', async () => {
      const mockResponse = { performanceMetrics: [] };
      api.get.mockResolvedValue({ data: mockResponse });

      await getMechanicPerformance();

      expect(api.get).toHaveBeenCalledWith('/analytics/mechanic-performance', { params: {} });
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getMechanicPerformance()).rejects.toThrow('Network error');
    });
  });
});