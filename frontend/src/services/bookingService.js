import api from './api';

/**
 * Booking Service
 * Handles all booking-related API calls
 */

/**
 * Create a new booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise<Object>} Created booking data
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Create booking service error:', error);
    // Re-throw the error so it can be handled by the caller
    throw error;
  }
};

/**
 * Get all bookings (Mechanic/Admin only) with pagination, search, and sorting
 * @param {Object} options - Pagination, search, and sort options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.search - Search term
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {boolean} options.noPagination - If true, returns all bookings without pagination
 * @returns {Promise<Object>} Paginated bookings data or array of all bookings
 */
export const getAllBookings = async (options = {}) => {
  // If noPagination is true, fetch all bookings without pagination
  if (options.noPagination) {
    // For simplicity, we'll fetch a large number of bookings
    // In a production environment, you might want a separate endpoint for this
    const response = await api.get('/bookings?limit=1000');
    return response.data.bookings || [];
  }
  
  const { page = 1, limit = 10, search = '', status = '', sortBy = 'booking_date', sortOrder = 'desc' } = options;
  
  // Build query string
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...(search && { search }),
    ...(status && { status }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder })
  }).toString();
  
  const response = await api.get(`/bookings?${queryParams}`);
  return response.data;
};

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking data
 */
export const getBookingById = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Get bookings for a specific customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Array>} List of customer bookings
 */
export const getCustomerBookings = async (customerId) => {
  const response = await api.get(`/bookings/customer/${customerId}`);
  return response.data.bookings;
};

/**
 * Get bookings for a service center
 * @param {string} serviceCenterId - Service center ID
 * @returns {Promise<Array>} List of service center bookings
 */
export const getServiceCenterBookings = async (serviceCenterId) => {
  const response = await api.get(`/bookings/servicecenter/${serviceCenterId}`);
  return response.data.bookings;
};

/**
 * Get pending bookings (Mechanic/Admin only)
 * @returns {Promise<Array>} List of pending bookings
 */
export const getPendingBookings = async () => {
  try {
    const response = await api.get('/bookings/pending');
    return response.data?.bookings || [];
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    return [];
  }
};

/**
 * Get bookings by mechanic ID (Mechanic/Admin only)
 * @param {string} mechanicId - Mechanic ID
 * @returns {Promise<Array>} List of bookings for the mechanic
 */
export const getMechanicBookings = async (mechanicId) => {
  try {
    // Validate input
    if (!mechanicId) {
      console.warn('No mechanic ID provided');
      return [];
    }
    
    // Use the specific mechanic bookings endpoint
    const response = await api.get(`/bookings/mechanic/${mechanicId}`);
    const mechanicBookings = response.data?.bookings || [];
    
    return mechanicBookings;
  } catch (error) {
    console.error('Error fetching mechanic bookings:', error);
    return [];
  }
};

/**
 * Get bookings by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} List of bookings in date range
 */
export const getBookingsByDateRange = async (startDate, endDate) => {
  const response = await api.get(`/bookings/date-range?startDate=${startDate}&endDate=${endDate}`);
  return response.data;
};

/**
 * Approve a booking (Mechanic/Admin only)
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Approved booking data
 */
export const approveBooking = async (bookingId) => {
  const response = await api.put(`/bookings/${bookingId}/approve`);
  return response.data;
};

/**
 * Reject a booking (Mechanic/Admin only)
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Rejected booking data
 */
export const rejectBooking = async (bookingId) => {
  const response = await api.put(`/bookings/${bookingId}/reject`);
  return response.data;
};

/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Cancelled booking data
 */
export const cancelBooking = async (bookingId) => {
  const response = await api.put(`/bookings/${bookingId}/cancel`);
  return response.data;
};

/**
 * Reschedule a booking
 * @param {string} bookingId - Booking ID
 * @param {Object} rescheduleData - Reschedule data with new date/time
 * @returns {Promise<Object>} Rescheduled booking data
 */
export const rescheduleBooking = async (bookingId, rescheduleData) => {
  const response = await api.put(`/bookings/${bookingId}/reschedule`, {
    newDateTime: rescheduleData
  });
  return response.data;
};

/**
 * Update booking status (Mechanic/Admin only)
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated booking data
 */
export const updateBookingStatus = async (bookingId, status) => {
  const response = await api.put(`/bookings/${bookingId}/status`, { status });
  return response.data;
};

/**
 * Confirm a booking (Mechanic/Admin only)
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Confirmed booking data
 */
export const confirmBooking = async (bookingId) => {
  const response = await api.put(`/bookings/${bookingId}/confirm`);
  return response.data;
};

/**
 * Assign a booking to a mechanic (Mechanic/Admin only)
 * @param {string} bookingId - Booking ID
 * @param {Object} assignData - Assignment data with mechanicId
 * @returns {Promise<Object>} Assigned booking data
 */
export const assignBooking = async (bookingId, assignData) => {
  const response = await api.put(`/bookings/${bookingId}/assign`, assignData);
  return response.data;
};

export default {
  createBooking,
  getAllBookings,
  getBookingById,
  getCustomerBookings,
  getServiceCenterBookings,
  getPendingBookings,
  getBookingsByDateRange,
  approveBooking,
  rejectBooking,
  cancelBooking,
  rescheduleBooking,
  updateBookingStatus,
  getMechanicBookings,
  confirmBooking,
  assignBooking,
};