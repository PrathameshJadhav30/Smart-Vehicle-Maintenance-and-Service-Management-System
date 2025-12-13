import { clearCache, getCacheStats } from '../../services/adminService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('clearCache', () => {
    test('should call api.post with correct endpoint and return data', async () => {
      const mockResponse = { message: 'Cache cleared successfully' };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await clearCache();

      expect(api.post).toHaveBeenCalledWith('/cache/clear');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(clearCache()).rejects.toThrow('Network error');
    });
  });

  describe('getCacheStats', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = {
        hits: 1000,
        misses: 50,
        hitRate: 0.95
      };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getCacheStats();

      expect(api.get).toHaveBeenCalledWith('/cache/stats');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getCacheStats()).rejects.toThrow('Network error');
    });
  });
});