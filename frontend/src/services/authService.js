import api from './api';

// Store refresh token promise to prevent multiple simultaneous refresh requests
let refreshingPromise = null;

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
  const { accessToken, refreshToken, user } = response.data;
  
  // Store tokens in localStorage
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  // Set access token in api headers
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  
  return { accessToken, refreshToken, user };
};

/**
 * User Login
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} Response data with token and user info
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { accessToken, refreshToken, user } = response.data;
  
  // Store tokens in localStorage
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  // Set access token in api headers
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  
  return { accessToken, refreshToken, user };
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
 * Create User (Admin only)
 * @param {Object} userData - User data
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.role - User's role
 * @param {string} [userData.phone] - User's phone number
 * @param {string} [userData.address] - User's address
 * @returns {Promise<Object>} Created user data
 */
export const createUser = async (userData) => {
  const response = await api.post('/auth/create-user', userData);
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

/**
 * Refresh Access Token
 * @returns {Promise<string|null>} New access token or null if failed
 */
export const refreshAccessToken = async () => {
  // If we're already refreshing, return the existing promise
  if (refreshingPromise) {
    return refreshingPromise;
  }
  
  // Set the refreshing promise
  refreshingPromise = _refreshAccessToken();
  
  try {
    const newToken = await refreshingPromise;
    return newToken;
  } finally {
    // Reset the refreshing promise when done
    refreshingPromise = null;
  }
};

/**
 * Internal function to refresh access token
 * @returns {Promise<string|null>} New access token or null if failed
 */
async function _refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/refresh-token', { refreshToken });
    const { accessToken } = response.data;
    
    // Update localStorage and api headers
    localStorage.setItem('accessToken', accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    return accessToken;
  } catch (error) {
    // If refresh fails, clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    
    return null;
  }
}

/**
 * Logout User
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      // Notify backend to invalidate refresh token
      await api.post('/auth/logout', { refreshToken });
    }
  } catch (error) {
    // Ignore errors during logout
    console.warn('Logout error:', error);
  } finally {
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
  }
};

export default {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUserRole,
  deleteUser,
  createUser,
  getAllMechanics,
  refreshAccessToken
};
