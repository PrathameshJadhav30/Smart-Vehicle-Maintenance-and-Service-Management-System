import {
  processPayment,
  getPaymentHistory,
  refundPayment,
  mockPayment,
  getMockPaymentData
} from '../../services/paymentService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processPayment', () => {
    test('should call api.post with correct endpoint and data', async () => {
      const paymentData = { amount: 100.00, method: 'credit_card', invoiceId: '123' };
      const mockResponse = { id: '1', status: 'success', ...paymentData };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await processPayment(paymentData);

      expect(api.post).toHaveBeenCalledWith('/payments/process', paymentData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const paymentData = { amount: 100.00, method: 'credit_card', invoiceId: '123' };
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(processPayment(paymentData)).rejects.toThrow('Network error');
    });
  });

  describe('getPaymentHistory', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const invoiceId = '123';
      const mockResponse = [{ id: '1', amount: 100.00, status: 'completed' }];
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getPaymentHistory(invoiceId);

      expect(api.get).toHaveBeenCalledWith(`/payments/history/${invoiceId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const invoiceId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getPaymentHistory(invoiceId)).rejects.toThrow('Network error');
    });
  });

  describe('refundPayment', () => {
    test('should call api.post with correct endpoint and return data', async () => {
      const paymentId = '123';
      const mockResponse = { id: paymentId, status: 'refunded' };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await refundPayment(paymentId);

      expect(api.post).toHaveBeenCalledWith(`/payments/refund/${paymentId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const paymentId = '123';
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(refundPayment(paymentId)).rejects.toThrow('Network error');
    });
  });

  describe('mockPayment', () => {
    test('should call api.post with correct endpoint and data', async () => {
      const paymentData = { amount: 100.00, method: 'credit_card' };
      const mockResponse = { id: '1', status: 'success', ...paymentData };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await mockPayment(paymentData);

      expect(api.post).toHaveBeenCalledWith('/payments/mock', paymentData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const paymentData = { amount: 100.00, method: 'credit_card' };
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(mockPayment(paymentData)).rejects.toThrow('Network error');
    });
  });

  describe('getMockPaymentData', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = { amount: 100.00, method: 'credit_card' };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getMockPaymentData();

      expect(api.get).toHaveBeenCalledWith('/payments/mock');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getMockPaymentData()).rejects.toThrow('Network error');
    });
  });
});