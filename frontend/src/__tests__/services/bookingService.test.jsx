import {
  createBooking,
  getAllBookings,
  getBookingById,
  getCustomerBookings,
  getServiceCenterBookings,
  getPendingBookings,
  getMechanicBookings,
  getBookingsByDateRange,
  approveBooking,
  rejectBooking,
  cancelBooking,
  rescheduleBooking,
  updateBookingStatus,
  confirmBooking,
  assignBooking
} from '../../services/bookingService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

describe('bookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBooking', () => {
    test('should call api.post with correct endpoint and data', async () => {
      const bookingData = { serviceType: 'oil_change', vehicleId: '123' };
      const mockResponse = { id: '1', ...bookingData };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await createBooking(bookingData);

      expect(api.post).toHaveBeenCalledWith('/bookings', bookingData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingData = { serviceType: 'oil_change', vehicleId: '123' };
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(createBooking(bookingData)).rejects.toThrow('Network error');
    });
  });

  describe('getAllBookings', () => {
    test('should call api.get with correct endpoint for paginated results', async () => {
      const options = { page: 1, limit: 10, search: 'test', sortBy: 'booking_date', sortOrder: 'desc' };
      const mockResponse = { bookings: [], totalPages: 1, currentPage: 1 };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllBookings(options);

      expect(api.get).toHaveBeenCalledWith('/bookings?page=1&limit=10&search=test&sortBy=booking_date&sortOrder=desc');
      expect(result).toEqual(mockResponse);
    });

    test('should call api.get with correct endpoint for all bookings when noPagination is true', async () => {
      const options = { noPagination: true };
      const mockResponse = { bookings: [] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllBookings(options);

      expect(api.get).toHaveBeenCalledWith('/bookings?limit=1000');
      expect(result).toEqual([]);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getAllBookings()).rejects.toThrow('Network error');
    });
  });

  describe('getBookingById', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const bookingId = '123';
      const mockResponse = { id: bookingId, serviceType: 'oil_change' };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getBookingById(bookingId);

      expect(api.get).toHaveBeenCalledWith(`/bookings/${bookingId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getBookingById(bookingId)).rejects.toThrow('Network error');
    });
  });

  describe('getCustomerBookings', () => {
    test('should call api.get with correct endpoint and return bookings array', async () => {
      const customerId = '456';
      const mockResponse = { bookings: [{ id: '1', serviceType: 'oil_change' }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getCustomerBookings(customerId);

      expect(api.get).toHaveBeenCalledWith(`/bookings/customer/${customerId}`);
      expect(result).toEqual(mockResponse.bookings);
    });

    test('should handle API errors gracefully', async () => {
      const customerId = '456';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getCustomerBookings(customerId)).rejects.toThrow('Network error');
    });
  });

  describe('getServiceCenterBookings', () => {
    test('should call api.get with correct endpoint and return bookings array', async () => {
      const serviceCenterId = '789';
      const mockResponse = { bookings: [{ id: '1', serviceType: 'oil_change' }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getServiceCenterBookings(serviceCenterId);

      expect(api.get).toHaveBeenCalledWith(`/bookings/servicecenter/${serviceCenterId}`);
      expect(result).toEqual(mockResponse.bookings);
    });

    test('should handle API errors gracefully', async () => {
      const serviceCenterId = '789';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getServiceCenterBookings(serviceCenterId)).rejects.toThrow('Network error');
    });
  });

  describe('getPendingBookings', () => {
    test('should call api.get with correct endpoint and return bookings array', async () => {
      const mockResponse = { bookings: [{ id: '1', status: 'pending' }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getPendingBookings();

      expect(api.get).toHaveBeenCalledWith('/bookings/pending');
      expect(result).toEqual(mockResponse.bookings);
    });

    test('should return empty array when API call fails', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      const result = await getPendingBookings();

      expect(result).toEqual([]);
    });
  });

  describe('getMechanicBookings', () => {
    test('should call api.get with correct endpoint and return bookings array', async () => {
      const mechanicId = '123';
      const mockResponse = { bookings: [{ id: '1', mechanicId: '123' }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getMechanicBookings(mechanicId);

      expect(api.get).toHaveBeenCalledWith(`/bookings/mechanic/${mechanicId}`);
      expect(result).toEqual(mockResponse.bookings);
    });

    test('should return empty array when no mechanicId is provided', async () => {
      const result = await getMechanicBookings();

      expect(result).toEqual([]);
    });

    test('should return empty array when API call fails', async () => {
      const mechanicId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      const result = await getMechanicBookings(mechanicId);

      expect(result).toEqual([]);
    });
  });

  describe('getBookingsByDateRange', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const mockResponse = [{ id: '1', bookingDate: startDate }];
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getBookingsByDateRange(startDate, endDate);

      expect(api.get).toHaveBeenCalledWith(`/bookings/date-range?startDate=${startDate}&endDate=${endDate}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getBookingsByDateRange(startDate, endDate)).rejects.toThrow('Network error');
    });
  });

  describe('approveBooking', () => {
    test('should call api.put with correct endpoint and return data', async () => {
      const bookingId = '123';
      const mockResponse = { id: bookingId, status: 'approved' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await approveBooking(bookingId);

      expect(api.put).toHaveBeenCalledWith(`/bookings/${bookingId}/approve`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '123';
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(approveBooking(bookingId)).rejects.toThrow('Network error');
    });
  });

  describe('rejectBooking', () => {
    test('should call api.put with correct endpoint and return data', async () => {
      const bookingId = '123';
      const mockResponse = { id: bookingId, status: 'rejected' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await rejectBooking(bookingId);

      expect(api.put).toHaveBeenCalledWith(`/bookings/${bookingId}/reject`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '123';
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(rejectBooking(bookingId)).rejects.toThrow('Network error');
    });
  });

  describe('cancelBooking', () => {
    test('should call api.put with correct endpoint and return data', async () => {
      const bookingId = '123';
      const mockResponse = { id: bookingId, status: 'cancelled' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await cancelBooking(bookingId);

      expect(api.put).toHaveBeenCalledWith(`/bookings/${bookingId}/cancel`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '123';
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(cancelBooking(bookingId)).rejects.toThrow('Network error');
    });
  });

  describe('rescheduleBooking', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const bookingId = '123';
      const rescheduleData = '2023-02-01T10:00:00Z';
      const mockResponse = { id: bookingId, newDateTime: rescheduleData };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await rescheduleBooking(bookingId, rescheduleData);

      expect(api.put).toHaveBeenCalledWith(`/bookings/${bookingId}/reschedule`, {
        newDateTime: rescheduleData
      });
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '123';
      const rescheduleData = '2023-02-01T10:00:00Z';
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(rescheduleBooking(bookingId, rescheduleData)).rejects.toThrow('Network error');
    });
  });

  describe('updateBookingStatus', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const bookingId = '123';
      const status = 'in_progress';
      const mockResponse = { id: bookingId, status };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await updateBookingStatus(bookingId, status);

      expect(api.put).toHaveBeenCalledWith(`/bookings/${bookingId}/status`, { status });
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '123';
      const status = 'in_progress';
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(updateBookingStatus(bookingId, status)).rejects.toThrow('Network error');
    });
  });

  describe('confirmBooking', () => {
    test('should call api.put with correct endpoint and return data', async () => {
      const bookingId = '123';
      const mockResponse = { id: bookingId, status: 'confirmed' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await confirmBooking(bookingId);

      expect(api.put).toHaveBeenCalledWith(`/bookings/${bookingId}/confirm`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '123';
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(confirmBooking(bookingId)).rejects.toThrow('Network error');
    });
  });

  describe('assignBooking', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const bookingId = '123';
      const assignData = { mechanicId: '456' };
      const mockResponse = { id: bookingId, mechanicId: '456' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await assignBooking(bookingId, assignData);

      expect(api.put).toHaveBeenCalledWith(`/bookings/${bookingId}/assign`, assignData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '123';
      const assignData = { mechanicId: '456' };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(assignBooking(bookingId, assignData)).rejects.toThrow('Network error');
    });
  });
});