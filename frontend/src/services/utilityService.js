import api from './api';

/**
 * Utility Service
 * Handles utility and development-related API calls
 */

/**
 * Seed database with sample data (Development only)
 * @returns {Promise<Object>} Seeding result
 */
export const seedDatabase = async () => {
  const response = await api.post('/seed');
  return response.data;
};

/**
 * Check API health status
 * @returns {Promise<Object>} Health status data
 */
export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default {
  seedDatabase,
  getHealthStatus,
};