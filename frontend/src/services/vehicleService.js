import api from './api';

/**
 * Vehicle Service
 * Handles all vehicle-related API calls
 */

/**
 * Create a new vehicle
 * @param {Object} vehicleData - Vehicle data
 * @returns {Promise<Object>} Created vehicle data
 */
export const createVehicle = async (vehicleData) => {
  const response = await api.post('/vehicles', vehicleData);
  return response.data;
};

/**
 * Get all vehicles with pagination, search, and sorting
 * @param {Object} options - Pagination, search, and sort options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.search - Search term
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {boolean} options.noPagination - If true, returns all vehicles without pagination
 * @returns {Promise<Object>} Paginated vehicles data or array of all vehicles
 */
export const getAllVehicles = async (options = {}) => {
  // If noPagination is true, fetch all vehicles without pagination
  if (options.noPagination) {
    // For simplicity, we'll fetch a large number of vehicles
    // In a production environment, you might want a separate endpoint for this
    const response = await api.get('/vehicles?limit=1000');
    return response.data.vehicles || [];
  }

  const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc', status = '' } = options;

  // Build query string
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
    ...(status && { status })
  }).toString();
  
  const response = await api.get(`/vehicles?${queryParams}`);
  return response.data;
};

/**
 * Get vehicles by user ID with pagination, search, and sorting
 * @param {string} userId - User ID
 * @param {Object} options - Pagination, search, and sort options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.search - Search term
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Paginated vehicles data
 */
export const getVehiclesByUserId = async (userId, options = {}) => {
  const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc', status = '' } = options;

  // Build query string
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
    ...(status && { status })
  }).toString();
  
  const response = await api.get(`/vehicles/user/${userId}?${queryParams}`);
  return response.data;
};

/**
 * Get vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} Vehicle data
 */
export const getVehicleById = async (vehicleId) => {
  const response = await api.get(`/vehicles/${vehicleId}`);
  return response.data.vehicle;
};

/**
 * Check if a vehicle exists
 * @param {string|number} vehicleId - Vehicle ID
 * @returns {Promise<boolean>} True if vehicle exists, false otherwise
 */
export const vehicleExists = async (vehicleId) => {
  try {
    await getVehicleById(vehicleId);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    throw error;
  }
};

/**
 * Update vehicle details
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} vehicleData - Updated vehicle data
 * @returns {Promise<Object>} Updated vehicle data
 */
export const updateVehicle = async (vehicleId, vehicleData) => {
  const response = await api.put(`/vehicles/${vehicleId}`, vehicleData);
  return response.data;
};

/**
 * Delete vehicle
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteVehicle = async (vehicleId) => {
  try {
    const response = await api.delete(`/vehicles/${vehicleId}`);
    return response.data;
  } catch (error) {
    console.error('Delete vehicle service error:', error);
    throw error;
  }
};

/**
 * Get vehicle service history
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Array>} Service history for the vehicle
 */
export const getVehicleHistory = async (vehicleId) => {
  const response = await api.get(`/vehicles/${vehicleId}/history`);
  return response.data.history;
};

export default {
  createVehicle,
  getAllVehicles,
  getVehiclesByUserId,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleHistory,
};