import api from './api';

/**
 * Invoice Service
 * Handles all invoice-related API calls
 */

/**
 * Create a new invoice (Mechanic/Admin only)
 * @param {Object} invoiceData - Invoice data
 * @returns {Promise<Object>} Created invoice data
 */
export const createInvoice = async (invoiceData) => {
  const response = await api.post('/invoices', invoiceData);
  
  // Dispatch event when invoice is created
  window.dispatchEvent(new CustomEvent('invoiceCreated'));
  
  return response.data;
};

/**
 * Get invoice by ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Object>} Invoice data
 */
export const getInvoiceById = async (invoiceId) => {
  const response = await api.get(`/invoices/${invoiceId}`);
  return response.data;
};

/**
 * Get invoice by booking ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Invoice data
 */
export const getInvoiceByBookingId = async (bookingId) => {
  const response = await api.get(`/invoices/booking/${bookingId}`);
  return response.data;
};

/**
 * Get invoices for a customer
 * @param {string} customerId - Customer ID
 * @param {Object} options - Filter options
 * @param {string} options.status - Filter by status (paid/unpaid)
 * @returns {Promise<Array>} List of customer invoices
 */
export const getCustomerInvoices = async (customerId, options = {}) => {
  const { status } = options;
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (status) {
    queryParams.append('status', status);
  }
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `/invoices/customer/${customerId}?${queryString}`
    : `/invoices/customer/${customerId}`;
    
  const response = await api.get(url);
  return response.data.invoices;
};

/**
 * Get all invoices (Mechanic/Admin only)
 * @returns {Promise<Array>} List of all invoices
 */
export const getMechanicInvoices = async (mechanicId) => {
  const response = await api.get(`/invoices/mechanic/${mechanicId}`);
  return response.data.invoices;
};

export const getAllInvoices = async () => {
  const response = await api.get('/invoices');
  return response.data.invoices;
};

/**
 * Update payment status (Mechanic/Admin only)
 * @param {string} invoiceId - Invoice ID
 * @param {Object} paymentData - Payment status data
 * @returns {Promise<Object>} Updated invoice data
 */
export const updatePaymentStatus = async (invoiceId, paymentData) => {
  const response = await api.put(`/invoices/${invoiceId}/payment`, paymentData);
  return response.data;
};

export default {
  createInvoice,
  getInvoiceById,
  getInvoiceByBookingId,
  getCustomerInvoices,
  getMechanicInvoices,
  getAllInvoices,
  updatePaymentStatus,
};