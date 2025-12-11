/**
 * Format date for display
 * @param {string|Date|null} dateValue - Date to format
 * @param {string} format - Format type ('short', 'long', 'datetime')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateValue, format = 'short') => {
  // Handle null, undefined, or invalid dates
  if (!dateValue) return 'N/A';
  
  let dateObj;
  if (typeof dateValue === 'string') {
    // Try to parse the string date
    dateObj = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    dateObj = dateValue;
  } else {
    return 'N/A';
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  
  const options = {
    short: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    long: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    },
    datetime: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  };
  
  try {
    return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Format booking date specifically
 * @param {string|Date|null} bookingDate - Booking date to format
 * @returns {string} Formatted booking date
 */
export const formatBookingDate = (bookingDate) => {
  return formatDate(bookingDate, 'datetime');
};

/**
 * Format created date specifically
 * @param {string|Date|null} createdDate - Created date to format
 * @returns {string} Formatted created date
 */
export const formatCreatedDate = (createdDate) => {
  return formatDate(createdDate, 'datetime');
};

/**
 * Format booking date without time
 * @param {string|Date|null} bookingDate - Booking date to format
 * @returns {string} Formatted booking date without time
 */
export const formatBookingDateShort = (bookingDate) => {
  return formatDate(bookingDate, 'short');
};

/**
 * Format created date without time
 * @param {string|Date|null} createdDate - Created date to format
 * @returns {string} Formatted created date without time
 */
export const formatCreatedDateShort = (createdDate) => {
  return formatDate(createdDate, 'short');
};

/**
 * Format combined booking date and time
 * @param {string|Date|null} bookingDate - Booking date
 * @param {string|Date|null} bookingTime - Booking time
 * @returns {string} Formatted combined date and time
 */
export const formatCombinedBookingDateTime = (bookingDate, bookingTime) => {
  // Handle null, undefined, or invalid dates
  if (!bookingDate) {
    return 'N/A';
  }
  
  try {
    // If bookingDate already contains both date and time, just format it
    if (typeof bookingDate === 'string' && bookingDate.includes('T')) {
      const dateObj = new Date(bookingDate);
      if (!isNaN(dateObj.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(dateObj);
      }
    }
    
    // Normalize the date value (should be in YYYY-MM-DD format)
    let normalizedDate = '';
    if (typeof bookingDate === 'string') {
      normalizedDate = bookingDate;
    } else if (bookingDate instanceof Date) {
      normalizedDate = bookingDate.toISOString().split('T')[0];
    } else {
      normalizedDate = String(bookingDate);
    }
    
    // If we have both date and time, combine them properly
    if (normalizedDate && bookingTime) {
      // Normalize the time value
      let normalizedTime = '';
      if (typeof bookingTime === 'string') {
        normalizedTime = bookingTime;
      } else if (bookingTime instanceof Date) {
        normalizedTime = bookingTime.toTimeString().split(' ')[0]; // Gets HH:MM:SS format
      } else {
        normalizedTime = String(bookingTime);
      }
      
      // Handle PostgreSQL TIME format which might be "HH:MM:SS" or just "HH:MM"
      // We need to ensure we have a proper time format
      if (normalizedTime) {
        // Split the time parts
        const timeParts = normalizedTime.split(':');
        if (timeParts.length >= 2) {
          // Ensure we have proper hour and minute values
          const hours = timeParts[0].padStart(2, '0');
          const minutes = timeParts[1].padStart(2, '0');
          // Seconds might or might not be present
          const seconds = timeParts.length > 2 ? timeParts[2] : '00';
          
          // Create a proper time string
          normalizedTime = `${hours}:${minutes}:${seconds}`;
        }
      }
      
      // Try to manually construct a date object by setting the time components
      try {
        // Create date object from the date part
        const dateObj = new Date(normalizedDate);
        if (!isNaN(dateObj.getTime())) {
          // Parse time components
          const timeParts = normalizedTime.split(':');
          if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0], 10) || 0;
            const minutes = parseInt(timeParts[1], 10) || 0;
            const seconds = timeParts.length > 2 ? parseInt(timeParts[2], 10) || 0 : 0;
            
            // Set the time components
            dateObj.setHours(hours, minutes, seconds, 0);
            
            // Check if the resulting date is valid
            if (!isNaN(dateObj.getTime())) {
              // Format the combined date and time
              return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }).format(dateObj);
            }
          }
        }
      } catch (manualParseError) {
        console.error('Manual date/time parsing failed:', manualParseError);
      }
      
      // Fallback: try different combination approaches
      const combinations = [
        `${normalizedDate}T${normalizedTime}`,
        `${normalizedDate} ${normalizedTime}`,
        `${normalizedDate}T${normalizedTime}.000Z`
      ];
      
      for (const combo of combinations) {
        try {
          const dateObj = new Date(combo);
          if (!isNaN(dateObj.getTime())) {
            return new Intl.DateTimeFormat('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(dateObj);
          }
        } catch (e) {
          // Continue to next combination
          continue;
        }
      }
      
      // If all combinations fail, fall back to just the date
      const dateOnlyObj = new Date(normalizedDate);
      if (!isNaN(dateOnlyObj.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(dateOnlyObj);
      }
    } 
    // If we only have date, format it without time
    else if (normalizedDate) {
      const dateObj = new Date(normalizedDate);
      if (!isNaN(dateObj.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(dateObj);
      }
    }
    
    return 'N/A';
  } catch (error) {
    console.error('Error formatting combined booking date/time:', error);
    // Final fallback - try to format whatever we have
    try {
      if (bookingDate) {
        let fallbackDate = bookingDate;
        if (typeof bookingDate === 'string') {
          fallbackDate = new Date(bookingDate);
        }
        
        if (fallbackDate instanceof Date && !isNaN(fallbackDate.getTime())) {
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }).format(fallbackDate);
        }
      }
    } catch (fallbackError) {
      console.error('Final fallback error:', fallbackError);
    }
    return 'N/A';
  }
};

/**
 * Format booking date without time
 * @param {string|Date|null} bookingDate - Booking date
 * @param {string|Date|null} bookingTime - Booking time
 * @returns {string} Formatted date without time
 */
export const formatBookingDateWithoutTime = (bookingDate, bookingTime) => {
  // Handle null, undefined, or invalid dates
  if (!bookingDate) {
    return 'N/A';
  }
  
  try {
    // If bookingDate already contains both date and time, just format the date part
    if (typeof bookingDate === 'string' && bookingDate.includes('T')) {
      const dateObj = new Date(bookingDate);
      if (!isNaN(dateObj.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(dateObj);
      }
    }
    
    // Normalize the date value (should be in YYYY-MM-DD format)
    let normalizedDate = '';
    if (typeof bookingDate === 'string') {
      normalizedDate = bookingDate;
    } else if (bookingDate instanceof Date) {
      normalizedDate = bookingDate.toISOString().split('T')[0];
    } else {
      normalizedDate = String(bookingDate);
    }
    
    // Format just the date without time
    const dateObj = new Date(normalizedDate);
    if (!isNaN(dateObj.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(dateObj);
    }
    
    return 'N/A';
  } catch (error) {
    console.error('Error formatting booking date without time:', error);
    // Final fallback - try to format whatever we have
    try {
      if (bookingDate) {
        let fallbackDate = bookingDate;
        if (typeof bookingDate === 'string') {
          fallbackDate = new Date(bookingDate);
        }
        
        if (fallbackDate instanceof Date && !isNaN(fallbackDate.getTime())) {
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }).format(fallbackDate);
        }
      }
    } catch (fallbackError) {
      console.error('Final fallback error:', fallbackError);
    }
    return 'N/A';
  }
};

export default {
  formatDate,
  formatBookingDate,
  formatCreatedDate,
  formatCombinedBookingDateTime
};