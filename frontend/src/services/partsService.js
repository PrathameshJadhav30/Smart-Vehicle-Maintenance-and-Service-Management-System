import api from './api';

/**
 * Parts Service
 * Handles all parts/inventory-related API calls
 */

/**
 * Create a new part (Mechanic/Admin only)
 * @param {Object} partData - Part data
 * @returns {Promise<Object>} Created part data
 */
export const createPart = async (partData) => {
  const response = await api.post('/parts', partData);
  return response.data;
};

/**
 * Get all parts
 * @param {Object} options - Options for pagination and search
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.search - Search term (optional)
 * @returns {Promise<Object>} Response with parts and pagination info or just parts array (for backward compatibility)
 */
export const getAllParts = async (options = {}) => {
  // Extract options with defaults
  const { page = 1, limit = 10, search = '' } = options;
  
  // Build query string
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(search && { search })
  }).toString();
  
  console.log('Making API request to /parts with params:', queryParams);
  const response = await api.get(`/parts?${queryParams}`);
  console.log('API response for /parts:', response);
  
  // Check if response contains pagination data
  if (response.data.parts && response.data.pagination) {
    // Return paginated response
    return response.data;
  } else {
    // Return array response (backward compatibility)
    return response.data.parts || [];
  }
};

/**
 * Get part by ID
 * @param {string} partId - Part ID
 * @returns {Promise<Object>} Part data
 */
export const getPartById = async (partId) => {
  const response = await api.get(`/parts/${partId}`);
  return response.data;
};

/**
 * Update part details (Mechanic/Admin only)
 * @param {string} partId - Part ID
 * @param {Object} partData - Updated part data
 * @returns {Promise<Object>} Updated part data
 */
export const updatePart = async (partId, partData) => {
  const response = await api.put(`/parts/${partId}`, partData);
  return response.data;
};

/**
 * Delete part (Admin only)
 * @param {string} partId - Part ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deletePart = async (partId) => {
  const response = await api.delete(`/parts/${partId}`);
  return response.data;
};

/**
 * Get low stock parts (Mechanic/Admin only)
 * @param {Object} options - Options for pagination
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @returns {Promise<Object>} Response with parts and pagination info or just parts array (for backward compatibility)
 */
export const getLowStockParts = async (options = {}) => {
  // Extract options with defaults
  const { page = 1, limit = 10 } = options;
  
  // Build query string
  const queryParams = new URLSearchParams({
    page,
    limit
  }).toString();
  
  console.log('Making API request to /parts/low-stock with params:', queryParams);
  const response = await api.get(`/parts/low-stock?${queryParams}`);
  console.log('API response for /parts/low-stock:', response);
  
  // Check if response contains pagination data
  if (response.data.parts && response.data.pagination) {
    // Return paginated response
    return response.data;
  } else {
    // Return array response (backward compatibility)
    return response.data.parts || [];
  }
};

/**
 * Get parts usage trends
 * @returns {Promise<Array>} Parts usage data
 */
export const getPartsUsage = async () => {
  const response = await api.get('/parts/usage');
  return response.data;
};

/**
 * Create a new supplier (Mechanic/Admin only)
 * @param {Object} supplierData - Supplier data
 * @returns {Promise<Object>} Created supplier data
 */
export const createSupplier = async (supplierData) => {
  const response = await api.post('/parts/supplier', supplierData);
  return response.data;
};

/**
 * Get all suppliers
 * @param {Object} options - Options for pagination and search
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.search - Search term (optional)
 * @returns {Promise<Object>} Response with suppliers and pagination info or just suppliers array (for backward compatibility)
 */
export const getAllSuppliers = async (options = {}) => {
  // Extract options with defaults
  const { page = 1, limit = 10, search = '' } = options;
  
  // Build query string
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(search && { search })
  }).toString();
  
  console.log('Making API request to /parts/suppliers with params:', queryParams);
  const response = await api.get(`/parts/suppliers?${queryParams}`);
  console.log('API response for /parts/suppliers:', response);
  
  // Check if response contains pagination data
  if (response.data.suppliers && response.data.pagination) {
    // Return paginated response
    return response.data;
  } else {
    // Return array response (backward compatibility)
    return response.data.suppliers || [];
  }
};

/**
 * Update supplier details (Mechanic/Admin only)
 * @param {string} supplierId - Supplier ID
 * @param {Object} supplierData - Updated supplier data
 * @returns {Promise<Object>} Updated supplier data
 */
export const updateSupplier = async (supplierId, supplierData) => {
  const response = await api.put(`/parts/supplier/${supplierId}`, supplierData);
  return response.data;
};

/**
 * Delete supplier (Admin only)
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteSupplier = async (supplierId) => {
  const response = await api.delete(`/parts/supplier/${supplierId}`);
  return response.data;
};

export default {
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
  deleteSupplier,
};