import {
  createPart,
  getAllParts,
  getPartById,
  updatePart,
  deletePart,
  getLowStockParts,
  getPartsUsage,
  createSupplier,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier
} from '../../services/partsService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

describe('partsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPart', () => {
    test('should call api.post with correct endpoint and data', async () => {
      const partData = { name: 'Engine Oil', quantity: 100, price: 25.99 };
      const mockResponse = { id: '1', ...partData };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await createPart(partData);

      expect(api.post).toHaveBeenCalledWith('/parts', partData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const partData = { name: 'Engine Oil', quantity: 100, price: 25.99 };
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(createPart(partData)).rejects.toThrow('Network error');
    });
  });

  describe('getAllParts', () => {
    test('should call api.get with correct endpoint and return parts array', async () => {
      const mockResponse = { parts: [{ id: '1', name: 'Engine Oil', quantity: 100 }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllParts();

      expect(api.get).toHaveBeenCalledWith('/parts');
      expect(result).toEqual(mockResponse.parts);
    });

    test('should return empty array when no parts in response', async () => {
      const mockResponse = {};
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllParts();

      expect(result).toEqual([]);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getAllParts()).rejects.toThrow('Network error');
    });
  });

  describe('getPartById', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const partId = '123';
      const mockResponse = { id: partId, name: 'Engine Oil', quantity: 100 };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getPartById(partId);

      expect(api.get).toHaveBeenCalledWith(`/parts/${partId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const partId = '123';
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getPartById(partId)).rejects.toThrow('Network error');
    });
  });

  describe('updatePart', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const partId = '123';
      const partData = { name: 'Engine Oil', quantity: 50, price: 29.99 };
      const mockResponse = { id: partId, ...partData };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await updatePart(partId, partData);

      expect(api.put).toHaveBeenCalledWith(`/parts/${partId}`, partData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const partId = '123';
      const partData = { name: 'Engine Oil', quantity: 50, price: 29.99 };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(updatePart(partId, partData)).rejects.toThrow('Network error');
    });
  });

  describe('deletePart', () => {
    test('should call api.delete with correct endpoint and return data', async () => {
      const partId = '123';
      const mockResponse = { message: 'Part deleted successfully' };
      api.delete.mockResolvedValue({ data: mockResponse });

      const result = await deletePart(partId);

      expect(api.delete).toHaveBeenCalledWith(`/parts/${partId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const partId = '123';
      const mockError = new Error('Network error');
      api.delete.mockRejectedValue(mockError);

      await expect(deletePart(partId)).rejects.toThrow('Network error');
    });
  });

  describe('getLowStockParts', () => {
    test('should call api.get with correct endpoint and return parts array', async () => {
      const mockResponse = { parts: [{ id: '1', name: 'Engine Oil', quantity: 5 }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getLowStockParts();

      expect(api.get).toHaveBeenCalledWith('/parts/low-stock');
      expect(result).toEqual(mockResponse.parts);
    });

    test('should return empty array when no parts in response', async () => {
      const mockResponse = {};
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getLowStockParts();

      expect(result).toEqual([]);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getLowStockParts()).rejects.toThrow('Network error');
    });
  });

  describe('getPartsUsage', () => {
    test('should call api.get with correct endpoint and return data', async () => {
      const mockResponse = [{ partId: '1', usage: 10 }];
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getPartsUsage();

      expect(api.get).toHaveBeenCalledWith('/parts/usage');
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getPartsUsage()).rejects.toThrow('Network error');
    });
  });

  describe('createSupplier', () => {
    test('should call api.post with correct endpoint and data', async () => {
      const supplierData = { name: 'Auto Parts Co.', contact: 'John Doe' };
      const mockResponse = { id: '1', ...supplierData };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await createSupplier(supplierData);

      expect(api.post).toHaveBeenCalledWith('/parts/supplier', supplierData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const supplierData = { name: 'Auto Parts Co.', contact: 'John Doe' };
      const mockError = new Error('Network error');
      api.post.mockRejectedValue(mockError);

      await expect(createSupplier(supplierData)).rejects.toThrow('Network error');
    });
  });

  describe('getAllSuppliers', () => {
    test('should call api.get with correct endpoint and return suppliers array', async () => {
      const mockResponse = { suppliers: [{ id: '1', name: 'Auto Parts Co.', contact: 'John Doe' }] };
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllSuppliers();

      expect(api.get).toHaveBeenCalledWith('/parts/suppliers');
      expect(result).toEqual(mockResponse.suppliers);
    });

    test('should return empty array when no suppliers in response', async () => {
      const mockResponse = {};
      api.get.mockResolvedValue({ data: mockResponse });

      const result = await getAllSuppliers();

      expect(result).toEqual([]);
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValue(mockError);

      await expect(getAllSuppliers()).rejects.toThrow('Network error');
    });
  });

  describe('updateSupplier', () => {
    test('should call api.put with correct endpoint and data', async () => {
      const supplierId = '123';
      const supplierData = { name: 'Auto Parts Co.', contact: 'Jane Smith' };
      const mockResponse = { id: supplierId, ...supplierData };
      api.put.mockResolvedValue({ data: mockResponse });

      const result = await updateSupplier(supplierId, supplierData);

      expect(api.put).toHaveBeenCalledWith(`/parts/supplier/${supplierId}`, supplierData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const supplierId = '123';
      const supplierData = { name: 'Auto Parts Co.', contact: 'Jane Smith' };
      const mockError = new Error('Network error');
      api.put.mockRejectedValue(mockError);

      await expect(updateSupplier(supplierId, supplierData)).rejects.toThrow('Network error');
    });
  });

  describe('deleteSupplier', () => {
    test('should call api.delete with correct endpoint and return data', async () => {
      const supplierId = '123';
      const mockResponse = { message: 'Supplier deleted successfully' };
      api.delete.mockResolvedValue({ data: mockResponse });

      const result = await deleteSupplier(supplierId);

      expect(api.delete).toHaveBeenCalledWith(`/parts/supplier/${supplierId}`);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      const supplierId = '123';
      const mockError = new Error('Network error');
      api.delete.mockRejectedValue(mockError);

      await expect(deleteSupplier(supplierId)).rejects.toThrow('Network error');
    });
  });
});