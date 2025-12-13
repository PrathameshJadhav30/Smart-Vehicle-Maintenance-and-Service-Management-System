import { seedDatabase, getHealthStatus } from '../../services/utilityService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

describe('utilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('seedDatabase', () => {
    test('should call api.post with correct endpoint and return data', async () => {
      const mockResponse = { message: 'Database seeded successfully', records: 100 };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await seedDatabase();

      expect(api.post).toHaveBeenCalledWith('/seed');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(seedDatabase()).rejects.toThrow('Network error');
    });
  });

  describe('getHealthStatus', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = { status: 'healthy', uptime: 12345 };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getHealthStatus();

      expect(api.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getHealthStatus()).rejects.toThrow('Network error');
    });
  });
});