import {
  createInvoice,
  getInvoiceById,
  getInvoiceByBookingId,
  getCustomerInvoices,
  getAllInvoices,
  updatePaymentStatus
} from '../../services/invoiceService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

// Mock window.dispatchEvent
const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {});

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockDispatchEvent.mockClear();
  });

  describe('createInvoice', () => {
    test('should call api.post with correct endpoint and data', async () => {
      const invoiceData = { amount: 100, bookingId: '123' };
      const mockResponse = { id: '1', ...invoiceData };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await createInvoice(invoiceData);

      expect(api.post).toHaveBeenCalledWith('/invoices', invoiceData);
      expect(result).toEqual(mockResponse);
    });

    test('should dispatch invoiceCreated event after successful creation', async () => {
      const invoiceData = { amount: 100, bookingId: '123' };
      const mockResponse = { id: '1', amount: 100, bookingId: '123' };
      api.post.mockResolvedValue({ data: mockResponse });

      await createInvoice(invoiceData);

      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'invoiceCreated'
      }));
    });

    test('should handle API errors gracefully', async () => {
      const invoiceData = { amount: 100, bookingId: '123' };
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(createInvoice(invoiceData)).rejects.toThrow('Network error');
    });
  });

  describe('getInvoiceById', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const invoiceId = '123';
      const mockResponse = { id: invoiceId, amount: 100 };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getInvoiceById(invoiceId);

      expect(api.get).toHaveBeenCalledWith(`/invoices/${invoiceId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const invoiceId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getInvoiceById(invoiceId)).rejects.toThrow('Network error');
    });
  });

  describe('getInvoiceByBookingId', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const bookingId = '456';
      const mockResponse = { id: '123', bookingId, amount: 100 };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getInvoiceByBookingId(bookingId);

      expect(api.get).toHaveBeenCalledWith(`/invoices/booking/${bookingId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const bookingId = '456';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getInvoiceByBookingId(bookingId)).rejects.toThrow('Network error');
    });
  });

  describe('getCustomerInvoices', () => {
    test('should call api.get with correct endpoint and return invoices array', async () => {
      const customerId = '789';
      const mockResponse = { invoices: [{ id: '1', customerId, amount: 100 }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getCustomerInvoices(customerId);

      expect(api.get).toHaveBeenCalledWith(`/invoices/customer/${customerId}?page=1&limit=10`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const customerId = '789';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getCustomerInvoices(customerId)).rejects.toThrow('Network error');
    });
  });

  describe('getAllInvoices', () => {
    test('should call api.get with correct endpoint and return invoices array', async () => {
      const mockResponse = { invoices: [{ id: '1', amount: 100 }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllInvoices();

      expect(api.get).toHaveBeenCalledWith('/invoices?page=1&limit=10');
      expect(result).toEqual(mockResponse.invoices);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getAllInvoices()).rejects.toThrow('Network error');
    });
  });

  describe('updatePaymentStatus', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const invoiceId = '123';
      const paymentData = { status: 'paid' };
      const mockResponse = { id: invoiceId, paymentStatus: 'paid' };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await updatePaymentStatus(invoiceId, paymentData);

      expect(api.put).toHaveBeenCalledWith(`/invoices/${invoiceId}/payment`, paymentData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const invoiceId = '123';
      const paymentData = { status: 'paid' };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(updatePaymentStatus(invoiceId, paymentData)).rejects.toThrow('Network error');
    });
  });
});