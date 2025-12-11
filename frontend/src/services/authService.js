import api from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

/**
 * User Registration
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.role - User's role (customer, mechanic, admin)
 * @returns {Promise<Object>} Response data
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * User Login
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} Response data with token and user info
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Get Authenticated User Profile
 * @returns {Promise<Object>} User profile data
 */
export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

/**
 * Update User Profile
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user data
 */
export const updateProfile = async (userId, userData) => {
  const response = await api.put(`/auth/users/${userId}`, userData);
  return response.data;
};

/**
 * Change User Password
 * @param {string} userId - User ID
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.oldPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @returns {Promise<Object>} Response data
 */
export const changePassword = async (userId, passwordData) => {
  const response = await api.put(`/auth/users/${userId}/change-password`, passwordData);
  return response.data;
};

/**
 * Forgot Password
 * @param {string} email - User's email
 * @returns {Promise<Object>} Response data
 */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset Password
 * @param {Object} resetData - Password reset data
 * @param {string} resetData.token - Reset token
 * @param {string} resetData.password - New password
 * @returns {Promise<Object>} Response data
 */
export const resetPassword = async (resetData) => {
  const response = await api.post('/auth/reset-password', resetData);
  return response.data;
};

/**
 * Get All Users (Admin only)
 * @returns {Promise<Array>} List of users
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    // The backend returns { users: [...] }, so we need to extract the array
    return response.data.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return []; // Return empty array on error to prevent crashes
  }
};

/**
 * Update User Role (Admin only)
 * @param {string} userId - User ID
 * @param {Object} roleData - Role update data
 * @param {string} roleData.role - New role
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserRole = async (userId, roleData) => {
  const response = await api.put(`/users/${userId}/role`, roleData);
  return response.data;
};

/**
 * Delete User (Admin only)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

/**
 * Get All Mechanics (Admin only)
 * @returns {Promise<Array>} List of mechanics
 */
export const getAllMechanics = async () => {
  const response = await api.get('/users/mechanics');
  // The backend returns { mechanics: [...] }, so we need to extract the array
  return response.data.mechanics || [];
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllMechanics,
};