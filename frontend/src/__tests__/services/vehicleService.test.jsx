import {
  createVehicle,
  getAllVehicles,
  getVehiclesByUserId,
  getVehicleById,
  vehicleExists,
  updateVehicle,
  deleteVehicle,
  getVehicleHistory
} from '../../services/vehicleService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

describe('vehicleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVehicle', () => {
    test('should call api.post with correct endpoint and data', async () => {
      const vehicleData = { make: 'Toyota', model: 'Camry', year: 2020 };
      const mockResponse = { id: '1', ...vehicleData };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await createVehicle(vehicleData);

      expect(api.post).toHaveBeenCalledWith('/vehicles', vehicleData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const vehicleData = { make: 'Toyota', model: 'Camry', year: 2020 };
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(createVehicle(vehicleData)).rejects.toThrow('Network error');
    });
  });

  describe('getAllVehicles', () => {
    test('should call api.get with correct endpoint for paginated results', async () => {
      const options = { page: 1, limit: 10, search: 'Toyota', sortBy: 'created_at', sortOrder: 'desc' };
      const mockResponse = { vehicles: [], totalPages: 1, currentPage: 1 };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllVehicles(options);

      expect(api.get).toHaveBeenCalledWith('/vehicles?page=1&limit=10&search=Toyota&sortBy=created_at&sortOrder=desc');
      expect(result).toEqual(mockResponse);
    });

    test('should call api.get with correct endpoint for all vehicles when noPagination is true', async () => {
      const options = { noPagination: true };
      const mockResponse = { vehicles: [{ id: '1', make: 'Toyota' }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllVehicles(options);

      expect(api.get).toHaveBeenCalledWith('/vehicles?limit=1000');
      expect(result).toEqual(mockResponse.vehicles);
    });

    test('should return empty array when no vehicles in response', async () => {
      const options = { noPagination: true };
      const mockResponse = {};
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllVehicles(options);

      expect(result).toEqual([]);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getAllVehicles()).rejects.toThrow('Network error');
    });
  });

  describe('getVehiclesByUserId', () => {
    test('should call api.get with correct endpoint and options', async () => {
      const userId = '123';
      const options = { page: 1, limit: 10, search: 'Camry', sortBy: 'created_at', sortOrder: 'desc' };
      const mockResponse = { vehicles: [], totalPages: 1, currentPage: 1 };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getVehiclesByUserId(userId, options);

      expect(api.get).toHaveBeenCalledWith(`/vehicles/user/${userId}?page=1&limit=10&search=Camry&sortBy=created_at&sortOrder=desc`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const userId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getVehiclesByUserId(userId)).rejects.toThrow('Network error');
    });
  });

  describe('getVehicleById', () => {
    test('should call api.get with correct endpoint and return vehicle data', async () => {
      const vehicleId = '123';
      const mockResponse = { vehicle: { id: vehicleId, make: 'Toyota', model: 'Camry' } };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getVehicleById(vehicleId);

      expect(api.get).toHaveBeenCalledWith(`/vehicles/${vehicleId}`);
      expect(result).toEqual(mockResponse.vehicle);
    });

    test('should handle API errors gracefully', async () => {
      const vehicleId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getVehicleById(vehicleId)).rejects.toThrow('Network error');
    });
  });

  describe('vehicleExists', () => {
    test('should return true when vehicle exists', async () => {
      const vehicleId = '123';
      const mockResponse = { vehicle: { id: vehicleId, make: 'Toyota' } };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await vehicleExists(vehicleId);

      expect(result).toBe(true);
    });

    test('should return false when vehicle does not exist', async () => {
      const vehicleId = '123';
      const mockError = new Error('Not found');
      mockError.response = { status: 404 };
      api.get.mockRejectedValue(mockError);

      const result = await vehicleExists(vehicleId);

      expect(result).toBe(false);
    });

    test('should re-throw error when it is not a 404', async () => {
      const vehicleId = '123';
      const mockError = new Error('Internal server error');
      mockError.response = { status: 500 };
      api.get.mockRejectedValue(mockError);

      await expect(vehicleExists(vehicleId)).rejects.toThrow('Internal server error');
    });
  });

  describe('updateVehicle', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const vehicleId = '123';
      const vehicleData = { make: 'Toyota', model: 'Corolla', year: 2021 };
      const mockResponse = { id: vehicleId, ...vehicleData };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await updateVehicle(vehicleId, vehicleData);

      expect(api.put).toHaveBeenCalledWith(`/vehicles/${vehicleId}`, vehicleData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const vehicleId = '123';
      const vehicleData = { make: 'Toyota', model: 'Corolla', year: 2021 };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(updateVehicle(vehicleId, vehicleData)).rejects.toThrow('Network error');
    });
  });

  describe('deleteVehicle', () => {
    test('should call api.delete with correct endpoint and return data', async () => {
      const vehicleId = '123';
      const mockResponse = { message: 'Vehicle deleted successfully' };
      api.delete.mockResolvedValue({ data: mockResponse });

      const result = await deleteVehicle(vehicleId);

      expect(api.delete).toHaveBeenCalledWith(`/vehicles/${vehicleId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const vehicleId = '123';
      const mockError = new Error('Network error');
      api.delete.mockRejectedValue(mockError);

      await expect(deleteVehicle(vehicleId)).rejects.toThrow('Network error');
    });
  });

  describe('getVehicleHistory', () => {
    test('should call api.get with correct endpoint and return history data', async () => {
      const vehicleId = '123';
      const mockResponse = { history: [{ service: 'Oil Change', date: '2023-01-01' }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getVehicleHistory(vehicleId);

      expect(api.get).toHaveBeenCalledWith(`/vehicles/${vehicleId}/history`);
      expect(result).toEqual(mockResponse.history);
    });

    test('should handle API errors gracefully', async () => {
      const vehicleId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getVehicleHistory(vehicleId)).rejects.toThrow('Network error');
    });
  });
});