import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import bookingService from '../../services/bookingService';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmationModal from '../../components/ConfirmationModal';
import { formatBookingDateWithoutTime, formatCreatedDateShort } from '../../utils/dateFormatter';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelConfirmation, setCancelConfirmation] = useState({ isOpen: false, bookingId: null });
  const [processingCancel, setProcessingCancel] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      
      if (filter === 'all') {
        data = await bookingService.getCustomerBookings(user.id);
      } else {
        // Filter on the frontend based on actual status values
        data = await bookingService.getCustomerBookings(user.id);
        data = data.filter(booking => booking.status === filter);
      }
      
      // Ensure booking IDs are strings and valid
      const processedData = data.map(booking => ({
        ...booking,
        id: String(booking.id || Math.random().toString(36).substr(2, 9)) // Fallback for missing IDs
      })).filter(booking => booking.id); // Remove any entries without IDs
      
      setBookings(processedData);
    } catch (error) {
      console.error('Error loading bookings:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  }, [filter, user.id]);

  useEffect(() => {
    loadBookings();
    
    // Set up interval to refresh bookings every 30 seconds
    const intervalId = setInterval(() => {
      loadBookings();
    }, 30000); // 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [loadBookings]);

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'text-amber-600 bg-amber-100',
      approved: 'text-blue-600 bg-blue-100',
      confirmed: 'text-indigo-600 bg-indigo-100',
      in_progress: 'text-yellow-600 bg-yellow-100',
      completed: 'text-emerald-600 bg-emerald-100',
      cancelled: 'text-rose-600 bg-rose-100',
      rejected: 'text-rose-600 bg-rose-100'
    };
    
    return statusColors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      pending: (
        <div className="bg-amber-100 rounded-full p-1">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      approved: (
        <div className="bg-blue-100 rounded-full p-1">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      confirmed: (
        <div className="bg-indigo-100 rounded-full p-1">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      in_progress: (
        <div className="bg-yellow-100 rounded-full p-1">
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      ),
      completed: (
        <div className="bg-emerald-100 rounded-full p-1">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      cancelled: (
        <div className="bg-rose-100 rounded-full p-1">
          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
      rejected: (
        <div className="bg-rose-100 rounded-full p-1">
          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )
    };
    
    return statusIcons[status] || (
      <div className="bg-gray-100 rounded-full p-1">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    );
  };

  const getServiceIcon = (serviceType) => {
    const serviceIcons = {
      'Engine Tune-up': (
        <div className="bg-blue-100 rounded-lg p-2">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      ),
      'Tire Rotation': (
        <div className="bg-amber-100 rounded-lg p-2">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-2m0 2a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
      ),
      'Oil Change': (
        <div className="bg-emerald-100 rounded-lg p-2">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
          </svg>
        </div>
      ),
      'Brake Service': (
        <div className="bg-red-100 rounded-lg p-2">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      ),
      'Battery Replacement': (
        <div className="bg-gray-100 rounded-lg p-2">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m10 6l6-6m-6-6l6 6" />
          </svg>
        </div>
      )
    };
    
    return serviceIcons[serviceType] || (
      <div className="bg-gray-100 rounded-lg p-2">
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
    );
  };

  const formatDate = (dateObj) => {
    // Handle case where dateObj might be null or invalid
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj)) {
      return 'N/A';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelBooking = async (bookingId) => {
    setCancelConfirmation({ isOpen: true, bookingId });
  };
  
  const confirmCancelBooking = async () => {
    const bookingId = cancelConfirmation.bookingId;
    
    try {
      setProcessingCancel(true);
      const result = await bookingService.cancelBooking(bookingId);
      loadBookings(); // Refresh the list
      showToast.success('Booking cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      console.error('Error response:', error.response?.data);
      
      // Show a more user-friendly error message
      if (error.response?.status === 500) {
        showToast.error('Failed to cancel booking due to a server error. Please try again later or contact support.');
      } else {
        showToast.error('Failed to cancel booking. Please try again.');
      }
    } finally {
      setCancelConfirmation({ isOpen: false, bookingId: null });
      setProcessingCancel(false);
    }
  };
  
  const cancelCancelBooking = () => {
    setCancelConfirmation({ isOpen: false, bookingId: null });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="mt-2 text-gray-600">Manage and track your service appointments</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full pl-4 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg shadow-sm transition duration-200 appearance-none bg-white"
              >
                <option value="all">All Bookings</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            <Button 
              onClick={loadBookings}
              size="md"
              className="flex items-center px-4 py-2.5 bg-blue-600 border border-blue-600 rounded-lg shadow-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
              <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-6 text-2xl font-bold text-gray-900">No bookings found</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">You haven't made any service bookings yet. Book your first service to get started.</p>
            <div className="mt-8">
              <Button 
                onClick={() => navigate('/customer/book-service')}
                size="md"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Book Your First Service
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {bookings.filter(booking => booking.id).map((booking) => (
              <div key={`booking-${booking.id}`} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                <div className="p-5 flex-grow">
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-3">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0">
                        {getServiceIcon(booking.service_type) || (
                          <div className="bg-gray-100 rounded-lg p-2">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-3 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {booking.model || booking.vehicle?.model || 'Unknown Vehicle'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {(booking.year || booking.vehicle?.year ? `${booking.year || booking.vehicle?.year} • ` : '') + (booking.vin || booking.vehicle?.vin || 'No VIN')}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)} self-start whitespace-nowrap`}>
                      <span className="mr-1">
                        {getStatusIcon(booking.status) || (
                          <div className="bg-gray-100 rounded-full p-1">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        )}
                      </span>
                      <span className="capitalize truncate max-w-[80px]">
                        {booking.status ? booking.status.replace('_', ' ') : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-4 py-2 inline-block max-w-full">
                    <p className="text-sm font-semibold text-blue-700 truncate">
                      {booking.service_type}
                    </p>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-start text-sm text-gray-600">
                      <svg className="flex-shrink-0 mr-3 h-5 w-5 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Appointment Date</p>
                        <p className="font-medium text-base truncate">
                          {formatBookingDateWithoutTime(booking.booking_date, booking.booking_time) || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start text-sm text-gray-600">
                      <svg className="flex-shrink-0 mr-3 h-5 w-5 text-gray-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Booked On</p>
                        <p className="font-medium text-base truncate">
                          {formatCreatedDateShort(booking.created_at) || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-5 pb-5">
                  {booking.status === 'pending' && (
                    <div className="mt-4">
                      <Button 
                        variant="danger" 
                        size="md"
                        onClick={() => handleCancelBooking(String(booking.id))}
                        className="w-full px-4 py-2.5 rounded-lg transition-all duration-300 hover:shadow-md"
                      >
                        Cancel Booking
                      </Button>
                    </div>
                  )}
                  
                  {(booking.status === 'completed' || booking.status === 'approved' || booking.status === 'confirmed') && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Booking ID:</span>
                        <span className="text-sm font-mono font-semibold text-gray-700 truncate ml-2">#{String(booking.id).substring(0, 8)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Booking Confirmation Modal */}
      <ConfirmationModal
        isOpen={cancelConfirmation.isOpen}
        onClose={cancelCancelBooking}
        onConfirm={confirmCancelBooking}
        title="Confirm Cancellation"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        processing={processingCancel}
        confirmVariant="danger"
        cancelVariant="secondary"
      />
    </div>
  );
};

export default MyBookingsPage;