import api from './api';

/**
 * Analytics Service
 * Handles all analytics-related API calls
 */

/**
 * Get vehicle analytics (Admin only)
 * @returns {Promise<Object>} Vehicle analytics data
 */
export const getVehicleAnalytics = async () => {
  const response = await api.get('/analytics/vehicles');
  return response.data;
};

/**
 * Get parts usage analytics (Admin only)
 * @returns {Promise<Object>} Parts usage analytics data
 */
export const getPartsUsageAnalytics = async () => {
  const response = await api.get('/analytics/parts-usage');
  return response.data;
};

/**
 * Get revenue analytics (Admin only)
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} Revenue analytics data
 */
export const getRevenueAnalytics = async (params = {}) => {
  const response = await api.get('/analytics/revenue', { params });
  return response.data;
};

/**
 * Get dashboard statistics (Admin only)
 * @returns {Promise<Object>} Dashboard statistics data
 */
export const getDashboardStats = async () => {
  const response = await api.get('/analytics/dashboard-stats');
  return response.data;
};

/**
 * Get mechanic performance metrics (Admin/Mechanic)
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} Mechanic performance data
 */
export const getMechanicPerformance = async (params = {}) => {
  const response = await api.get('/analytics/mechanic-performance', { params });
  return response.data;
};

export default {
  getVehicleAnalytics,
  getPartsUsageAnalytics,
  getRevenueAnalytics,
  getDashboardStats,
  getMechanicPerformance,
};