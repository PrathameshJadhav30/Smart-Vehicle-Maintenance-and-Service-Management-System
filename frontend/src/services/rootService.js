import api from './api';

/**
 * Root Service
 * Handles root API endpoint calls
 */

/**
 * Get API root information
 * @returns {Promise<Object>} API root information
 */
export const getRootInfo = async () => {
  const response = await api.get('/');
  return response.data;
};

export default {
  getRootInfo,
};