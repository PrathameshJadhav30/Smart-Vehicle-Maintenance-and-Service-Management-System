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
 * @returns {Promise<Array>} List of all parts
 */
export const getAllParts = async () => {
  console.log('Making API request to /parts');
  const response = await api.get('/parts');
  console.log('API response for /parts:', response);
  // The backend returns { parts: [...] }, so we need to extract the array
  return response.data.parts || [];
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
 * @returns {Promise<Array>} List of low stock parts
 */
export const getLowStockParts = async () => {
  console.log('Making API request to /parts/low-stock');
  const response = await api.get('/parts/low-stock');
  console.log('API response for /parts/low-stock:', response);
  // The backend returns { parts: [...] }, so we need to extract the array
  return response.data.parts || [];
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
 * @returns {Promise<Array>} List of all suppliers
 */
export const getAllSuppliers = async () => {
  console.log('Making API request to /parts/suppliers');
  const response = await api.get('/parts/suppliers');
  console.log('API response for /parts/suppliers:', response);
  // The backend returns { suppliers: [...] }, so we need to extract the array
  return response.data.suppliers || [];
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