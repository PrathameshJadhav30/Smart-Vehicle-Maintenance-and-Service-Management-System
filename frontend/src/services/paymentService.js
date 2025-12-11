import api from './api';

/**
 * Payment Service
 * Handles all payment-related API calls
 */

/**
 * Process a payment (Customer/Mechanic/Admin)
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Payment processing result
 */
export const processPayment = async (paymentData) => {
  const response = await api.post('/payments/process', paymentData);
  return response.data;
};

/**
 * Get payment history for an invoice (Customer/Mechanic/Admin)
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Array>} Payment history for the invoice
 */
export const getPaymentHistory = async (invoiceId) => {
  const response = await api.get(`/payments/history/${invoiceId}`);
  return response.data;
};

/**
 * Refund a payment (Admin only)
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Refund result
 */
export const refundPayment = async (paymentId) => {
  const response = await api.post(`/payments/refund/${paymentId}`);
  return response.data;
};

/**
 * Mock payment processing
 * @param {Object} paymentData - Payment data for mocking
 * @returns {Promise<Object>} Mock payment result
 */
export const mockPayment = async (paymentData) => {
  const response = await api.post('/payments/mock', paymentData);
  return response.data;
};

/**
 * Get mock payment data
 * @returns {Promise<Object>} Mock payment data
 */
export const getMockPaymentData = async () => {
  const response = await api.get('/payments/mock');
  return response.data;
};

export default {
  processPayment,
  getPaymentHistory,
  refundPayment,
  mockPayment,
  getMockPaymentData,
};