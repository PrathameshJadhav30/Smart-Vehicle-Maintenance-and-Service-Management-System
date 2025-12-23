/**
 * Format currency for display
 * @param {number|string|null|undefined} amount - Amount to format
 * @param {string} currency - Currency code (default: 'INR')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR') => {
  // Handle null, undefined, or invalid amounts
  if (amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number
  if (isNaN(numericAmount)) {
    return '₹0.00';
  }
  
  try {
    // Format with maximumFractionDigits: 0 for whole numbers, but allow decimals when needed
    const isWholeNumber = Number.isInteger(numericAmount);
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: isWholeNumber ? 0 : 2,
    }).format(numericAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '₹0.00';
  }
};

export default {
  formatCurrency
};