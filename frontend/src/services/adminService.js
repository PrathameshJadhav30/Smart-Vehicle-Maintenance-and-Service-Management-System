import api from './api';

/**
 * Admin Service
 * Handles admin-specific API calls
 */

/**
 * Clear application cache (Admin only)
 * @returns {Promise<Object>} Confirmation message
 */
export const clearCache = async () => {
  const response = await api.post('/cache/clear');
  return response.data;
};

/**
 * Get cache statistics (Admin only)
 * @returns {Promise<Object>} Cache statistics
 */
export const getCacheStats = async () => {
  const response = await api.get('/cache/stats');
  return response.data;
};

export default {
  clearCache,
  getCacheStats
};