import { getRootInfo } from '../../services/rootService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

describe('rootService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRootInfo', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = { message: 'Welcome to the SVMMS API', version: '1.0.0' };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getRootInfo();

      expect(api.get).toHaveBeenCalledWith('/');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getRootInfo()).rejects.toThrow('Network error');
    });
  });
});