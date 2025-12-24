import api from './api';

/**
 * Job Card Service
 * Handles all job card-related API calls
 */

/**
 * Create a new job card (Mechanic/Admin only)
 * @param {Object} jobCardData - Job card data
 * @returns {Promise<Object>} Created job card data
 */
export const createJobCard = async (jobCardData) => {
  console.log('Sending job card request with data:', jobCardData);
  try {
    const response = await api.post('/jobcards', jobCardData);
    console.log('Received job card response:', response);
    return response.data;
  } catch (error) {
    console.error('Job card creation error:', error);
    if (error.response) {
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      
      // Log the exact error message from the backend
      if (error.response.data && error.response.data.message) {
        console.error('Backend error message:', error.response.data.message);
      }
    }
    throw error;
  }
};

/**
 * Get all job cards with pagination, search, and filtering
 * @param {Object} options - Options for pagination, search, and filtering
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.status - Filter by status
 * @returns {Promise<Object>} Paginated job cards data or array of all job cards
 */
export const getAllJobCards = async (options = {}) => {
  // Extract options with defaults
  const { page = 1, limit = 10, status = '' } = options;
  
  // Build query string
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(status && { status })
  }).toString();
  
  const response = await api.get(`/jobcards?${queryParams}`);
  
  // Check if response contains pagination data
  if (response.data.jobcards && response.data.pagination) {
    // Return paginated response
    return response.data;
  } else {
    // Return array response (backward compatibility)
    return response.data.jobcards || [];
  }
};

/**
 * Get completed job cards (Mechanic/Admin only)
 * @param {Object} options - Options for pagination
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @returns {Promise<Object>} Paginated job cards data or array of all job cards
 */
export const getCompletedJobCards = async (options = {}) => {
  // Extract options with defaults
  const { page = 1, limit = 10 } = options;
  
  // Build query string
  const queryParams = new URLSearchParams({
    page,
    limit
  }).toString();
  
  const response = await api.get(`/jobcards/completed?${queryParams}`);
  
  // Check if response contains pagination data
  if (response.data.jobcards && response.data.pagination) {
    // Return paginated response
    return response.data;
  } else {
    // Return array response (backward compatibility)
    return response.data.jobcards || [];
  }
};

/**
 * Get job card by ID
 * @param {string} jobCardId - Job card ID
 * @returns {Promise<Object>} Job card data
 */
export const getJobCardById = async (jobCardId) => {
  const response = await api.get(`/jobcards/${jobCardId}`);
  return response.data;
};

/**
 * Get job card by booking ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Job card data
 */
export const getJobCardByBookingId = async (bookingId) => {
  const response = await api.get(`/jobcards/booking/${bookingId}`);
  return response.data;
};

/**
 * Get job card notes
 * @param {string} jobCardId - Job card ID
 * @returns {Promise<Array>} List of job card notes
 */
export const getJobCardNotes = async (jobCardId) => {
  const response = await api.get(`/jobcards/${jobCardId}/notes`);
  return response.data;
};

/**
 * Update job card status (Mechanic/Admin only)
 * @param {string} jobCardId - Job card ID
 * @param {Object} statusData - Status update data
 * @returns {Promise<Object>} Updated job card data
 */
export const updateJobCardStatus = async (jobCardId, statusData) => {
  try {
    const response = await api.put(`/jobcards/${jobCardId}/update-status`, statusData);
    return response.data;
  } catch (error) {
    console.error('Update job card status service error:', error);
    throw error;
  }
};

/**
 * Add task to job card (Mechanic/Admin only)
 * @param {string} jobCardId - Job card ID
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} Updated job card data
 */
export const addTaskToJobCard = async (jobCardId, taskData) => {
  try {
    // Validate inputs
    if (!jobCardId) {
      throw new Error('Job card ID is required');
    }
    
    if (!taskData || !taskData.task_name || !taskData.task_cost) {
      throw new Error('Task name and cost are required');
    }
    
    const response = await api.put(`/jobcards/${jobCardId}/add-task`, taskData);
    return response.data;
  } catch (error) {
    console.error('Add task to job card service error:', error);
    // Provide more specific error messages
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Job card not found');
      } else if (error.response.status === 403) {
        throw new Error('Access denied. You can only update job cards assigned to you.');
      } else if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw error;
  }
};

/**
 * Assign mechanic to job card (Mechanic/Admin only)
 * @param {string} jobCardId - Job card ID
 * @param {Object} mechanicData - Mechanic data
 * @returns {Promise<Object>} Updated job card data
 */
export const assignMechanicToJobCard = async (jobCardId, mechanicData) => {
  const response = await api.put(`/jobcards/${jobCardId}/add-mechanic`, mechanicData);
  return response.data;
};

/**
 * Add spare part to job card (Mechanic/Admin only)
 * @param {string} jobCardId - Job card ID
 * @param {Object} partData - Spare part data
 * @returns {Promise<Object>} Updated job card data
 */
export const addSparePartToJobCard = async (jobCardId, partData) => {
  try {
    // Validate inputs
    if (!jobCardId) {
      throw new Error('Job card ID is required');
    }
    
    if (!partData || !partData.part_id || !partData.quantity) {
      throw new Error('Part ID and quantity are required');
    }
    
    const response = await api.put(`/jobcards/${jobCardId}/add-sparepart`, partData);
    
    // Dispatch event when spare part is added to notify parts inventory update
    window.dispatchEvent(new CustomEvent('sparePartAdded'));
    
    return response.data;
  } catch (error) {
    console.error('Add spare part to job card service error:', error);
    // Provide more specific error messages
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Job card not found');
      } else if (error.response.status === 403) {
        throw new Error('Access denied. You can only update job cards assigned to you.');
      } else if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw error;
  }
};

/**
 * Update job card progress (Mechanic/Admin only)
 * @param {string} jobCardId - Job card ID
 * @param {Object} progressData - Progress update data
 * @returns {Promise<Object>} Updated job card data
 */
export const updateJobCardProgress = async (jobCardId, progressData) => {
  try {
    const response = await api.put(`/jobcards/${jobCardId}/update-progress`, progressData);
    
    // Dispatch event when job card progress is updated
    window.dispatchEvent(new CustomEvent('jobCardProgressUpdated'));
    
    return response.data;
  } catch (error) {
    console.error('Update job card progress service error:', error);
    throw error;
  }
};

/**
 * Complete job card (Mechanic/Admin only)
 * @param {string} jobCardId - Job card ID
 * @param {Object} completionData - Completion data
 * @returns {Promise<Object>} Completed job card data
 */
export const completeJobCard = async (jobCardId, completionData) => {
  try {
    const response = await api.put(`/jobcards/${jobCardId}/complete`, completionData);
    
    // Dispatch event when job card is completed
    window.dispatchEvent(new CustomEvent('jobCardCompleted'));
    
    return response.data;
  } catch (error) {
    console.error('Complete job card service error:', error);
    throw error;
  }
};

/**
 * Delete job card (Admin only)
 * @param {string} jobCardId - Job card ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteJobCard = async (jobCardId) => {
  const response = await api.delete(`/jobcards/${jobCardId}`);
  return response.data;
};

/**
 * Get job cards by mechanic ID (Mechanic/Admin only)
 * @param {string} mechanicId - Mechanic ID
 * @param {Object} options - Options for pagination
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @returns {Promise<Object>} Paginated job cards data or array of all job cards
 */
export const getMechanicJobCards = async (mechanicId, options = {}) => {
  try {
    // Extract options with defaults
    const { page = 1, limit = 10 } = options;
    
    // Build query string
    const queryParams = new URLSearchParams({
      page,
      limit
    }).toString();
    
    const response = await api.get(`/jobcards/mechanic/${mechanicId}?${queryParams}`);
    
    // Check if response contains pagination data
    if (response.data.jobcards && response.data.pagination) {
      // Return paginated response
      return response.data;
    } else {
      // Return array response (backward compatibility)
      return response.data?.jobcards || [];
    }
  } catch (error) {
    console.error('Error fetching mechanic job cards:', error);
    return [];
  }
};

export default {
  createJobCard,
  getAllJobCards,
  getCompletedJobCards,
  getJobCardById,
  getJobCardByBookingId,
  getJobCardNotes,
  addTaskToJobCard,
  assignMechanicToJobCard,
  addSparePartToJobCard,
  updateJobCardStatus,
  updateJobCardProgress,
  deleteJobCard,
  getMechanicJobCards,
};
