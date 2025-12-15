import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import bookingService from '../../services/bookingService';
import jobcardService from '../../services/jobcardService';
import invoiceService from '../../services/invoiceService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { formatBookingDateWithoutTime } from '../../utils/dateFormatter';
import { formatCurrency } from '../../utils/currencyFormatter';

const AssignedBookingsPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('booking_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      let data;
      
      // Fetch bookings based on user role
      if (hasRole('admin')) {
        // Admins can see all bookings
        const response = await bookingService.getAllBookings();
        data = response.bookings || [];
      } else if (hasRole('mechanic')) {
        // Mechanics can see their assigned bookings
        data = await bookingService.getMechanicBookings(user.id);
      } else {
        // Customers shouldn't be here
        console.error('Unauthorized access to bookings page');
        return;
      }
      
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      alert('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user.id, hasRole]);

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-blue-100 text-blue-800',
      assigned: 'bg-indigo-100 text-indigo-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-rose-100 text-rose-800',
      rejected: 'bg-rose-100 text-rose-800'
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      pending: (
        <div className="flex-shrink-0 bg-amber-100 rounded-full p-1.5">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      approved: (
        <div className="flex-shrink-0 bg-blue-100 rounded-full p-1.5">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      assigned: (
        <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1.5">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      in_progress: (
        <div className="flex-shrink-0 bg-yellow-100 rounded-full p-1.5">
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      ),
      completed: (
        <div className="flex-shrink-0 bg-emerald-100 rounded-full p-1.5">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      cancelled: (
        <div className="flex-shrink-0 bg-rose-100 rounded-full p-1.5">
          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
      rejected: (
        <div className="flex-shrink-0 bg-rose-100 rounded-full p-1.5">
          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )
    };
    
    return statusIcons[status] || (
      <div className="flex-shrink-0 bg-gray-100 rounded-full p-1.5">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const statusText = {
      pending: 'Pending',
      approved: 'Approved',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        <span className="mr-1.5">
          {getStatusIcon(status)}
        </span>
        <span className="capitalize">
          {statusText[status] || status}
        </span>
      </span>
    );
  };

  const getServiceIcon = (serviceType) => {
    const serviceIcons = {
      'Engine Tune-up': (
        <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      ),
      'Tire Rotation': (
        <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
      ),
      'Oil Change': (
        <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
          </svg>
        </div>
      ),
      'Brake Service': (
        <div className="bg-red-50 rounded-lg p-2 border border-red-100">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      ),
      'Battery Replacement': (
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4m10 6l6-6m-6-6l6 6" />
          </svg>
        </div>
      )
    };
    
    return serviceIcons[serviceType] || (
      <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
    );
  };

  const formatBookingDateTime = (booking) => {
    // Handle case where booking data might be missing
    if (!booking) {
      return 'N/A';
    }
    
    try {
      // Use the centralized formatter
      return formatCombinedBookingDateTime(booking.booking_date, booking.booking_time);
    } catch (error) {
      console.error('Error formatting booking date/time:', error);
      return 'Invalid Date';
    }
  };

  const handleApprove = async (bookingId) => {
    // Only admins can approve bookings
    if (!hasRole('admin')) {
      alert('Only administrators can approve bookings.');
      return;
    }
    
    if (window.confirm('Are you sure you want to approve this booking?')) {
      try {
        await bookingService.approveBooking(bookingId);
        loadBookings(); // Refresh the list
      } catch (error) {
        console.error('Error approving booking:', error);
        // Check if it's a 403 error (permission denied)
        if (error.response && error.response.status === 403) {
          alert('Access denied. You do not have permission to approve bookings. Please ensure you have the admin role.');
        } else {
          alert('Failed to approve booking. Please try again.');
        }
      }
    }
  };

  const handleReject = async (bookingId) => {
    if (window.confirm('Are you sure you want to reject this booking? This action cannot be undone.')) {
      try {
        await bookingService.rejectBooking(bookingId);
        loadBookings(); // Refresh the list
      } catch (error) {
        console.error('Error rejecting booking:', error);
        alert('Failed to reject booking. Please try again.');
      }
    }
  };

  const handleConfirm = async (bookingId) => {
    // Only admins can confirm bookings
    if (!hasRole('admin')) {
      alert('Only administrators can confirm bookings.');
      return;
    }
    
    if (window.confirm('Are you sure you want to confirm this booking?')) {
      try {
        await bookingService.confirmBooking(bookingId);
        loadBookings(); // Refresh the list
      } catch (error) {
        console.error('Error confirming booking:', error);
        // Check if it's a 403 error (permission denied)
        if (error.response && error.response.status === 403) {
          alert('Access denied. You do not have permission to confirm bookings. Please ensure you have the admin role.');
        } else {
          alert('Failed to confirm booking. Please try again.');
        }
      }
    }
  };

  const handleAssign = async (bookingId) => {
    // Only admins can assign bookings
    if (!hasRole('admin')) {
      alert('Only administrators can assign bookings to mechanics.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to assign this booking? You will need to select a mechanic in the admin panel.`)) {
      // Redirect to admin panel for assignment
      alert('Please go to the Admin Bookings Management page to assign this booking to a mechanic.');
      // In a real implementation, we might open a modal or redirect
    }
  };

  const handleStartJob = async (bookingId) => {
    try {
      // Navigate to the job card creation page
      navigate(`/mechanic/job-cards?bookingId=${bookingId}`);
    } catch (error) {
      console.error('Error starting job:', error);
      alert('Failed to start job. Please try again.');
    }
  };

  const handleViewJobCard = async (bookingId) => {
    try {
      console.log('Attempting to view job card for booking ID:', bookingId);
      // Get the job card associated with this booking
      const jobCardData = await jobcardService.getJobCardByBookingId(bookingId);
      if (jobCardData && jobCardData.jobcard) {
        // Navigate to the job card page with the job card ID as a query parameter
        navigate(`/mechanic/job-cards?viewJobCard=${jobCardData.jobcard.id}`);
      } else {
        alert('No job card found for this booking.');
      }
    } catch (error) {
      console.error('Error viewing job card:', error);
      if (error.response && error.response.status === 404) {
        alert('No job card found for this booking.');
      } else if (error.response && error.response.status === 403) {
        alert('Access denied. You can only view job cards assigned to you.');
      } else {
        alert('Failed to view job card. Please try again.');
      }
    }
  };

  const handleViewInvoice = async (bookingId) => {
    try {
      console.log('Attempting to view invoice for booking ID:', bookingId);
      // Get invoice data for the booking
      const invoiceData = await invoiceService.getInvoiceByBookingId(bookingId);
      console.log('Invoice data received:', invoiceData);
      if (invoiceData && invoiceData.invoice) {
        // Set the selected invoice and show the modal
        setSelectedInvoice(invoiceData);
        setShowInvoiceModal(true);
      } else {
        alert('No invoice found for this booking.');
      }
    } catch (error) {
      console.error('Error viewing invoice:', error);
      if (error.response && error.response.status === 404) {
        alert('No invoice found for this booking.');
      } else {
        alert('Failed to view invoice. Please try again.');
      }
    }
  };

  const handleViewDetails = async (bookingId) => {
    try {
      console.log('Attempting to view details for booking ID:', bookingId);
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setShowBookingDetailsModal(true);
      } else {
        alert('Booking details not found.');
      }
    } catch (error) {
      console.error('Error viewing booking details:', error);
      alert('Failed to view booking details. Please try again.');
    }
  };

  const closeBookingDetailsModal = () => {
    setShowBookingDetailsModal(false);
    setSelectedBooking(null);
  };

  const SortIndicator = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  // Add this function to close the invoice modal
  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };  
  const getCustomerAvatar = (name) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-rose-100 text-rose-800 border-rose-200'
    ];
    
    const colorIndex = initials.charCodeAt(0) % colors.length;
    
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm border-2 ${colors[colorIndex]}`}>
        {initials}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Service Bookings</h1>
            <p className="mt-2 text-lg text-gray-600">Manage and review service bookings</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">Booking Management</h2>
                  <p className="mt-1 text-sm text-gray-500">View and manage service bookings</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition duration-150 ease-in-out"
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="appearance-none block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition duration-150 ease-in-out bg-white"
                      >
                        <option value="all">All Bookings</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="secondary"
                      onClick={loadBookings}
                      className="flex items-center w-full sm:w-auto justify-center"
                    >
                      <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {bookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 rounded-full p-4 inline-flex">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  There are currently no service bookings matching your criteria. Try adjusting your filters or search terms.
                </p>
                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    onClick={loadBookings}
                    className="inline-flex items-center"
                  >
                    <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                        onClick={() => {
                          setSortBy('customer_name');
                          setSortOrder(sortBy === 'customer_name' && sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <div className="flex items-center">
                          <span className="mr-1">Customer</span>
                          <SortIndicator field="customer_name" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                        onClick={() => {
                          setSortBy('model');
                          setSortOrder(sortBy === 'model' && sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <div className="flex items-center">
                          <span className="mr-1">Vehicle</span>
                          <SortIndicator field="model" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                        onClick={() => {
                          setSortBy('booking_date');
                          setSortOrder(sortBy === 'booking_date' && sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <div className="flex items-center">
                          <span className="mr-1">Appointment</span>
                          <SortIndicator field="booking_date" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                        onClick={() => {
                          setSortBy('service_type');
                          setSortOrder(sortBy === 'service_type' && sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <div className="flex items-center">
                          <span className="mr-1">Service</span>
                          <SortIndicator field="service_type" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                        onClick={() => {
                          setSortBy('status');
                          setSortOrder(sortBy === 'status' && sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <div className="flex items-center">
                          <span className="mr-1">Status</span>
                          <SortIndicator field="status" />
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings
                      .filter(booking => {
                        if (filter === 'all') return true;
                        return booking.status === filter;
                      })
                      .filter(booking => {
                        if (!searchTerm) return true;
                        
                        const term = searchTerm.toLowerCase();
                        return (
                          (booking.customer_name && booking.customer_name.toLowerCase().includes(term)) ||
                          (booking.model && booking.model.toLowerCase().includes(term)) ||
                          (booking.vin && booking.vin.toLowerCase().includes(term)) ||
                          (booking.service_type && booking.service_type.toLowerCase().includes(term))
                        );
                      })
                      .sort((a, b) => {
                        // Sorting logic
                        let aValue, bValue;
                        
                        switch (sortBy) {
                          case 'customer_name':
                            aValue = a.customer_name || '';
                            bValue = b.customer_name || '';
                            break;
                          case 'model':
                            aValue = a.model || '';
                            bValue = b.model || '';
                            break;
                          case 'booking_date':
                            // For date sorting, we need to create proper date objects
                            const aDate = new Date(`${a.booking_date}T${a.booking_time || '00:00:00'}`);
                            const bDate = new Date(`${b.booking_date}T${b.booking_time || '00:00:00'}`);
                            aValue = aDate.getTime();
                            bValue = bDate.getTime();
                            break;
                          case 'service_type':
                            aValue = a.service_type || '';
                            bValue = b.service_type || '';
                            break;
                          case 'status':
                            aValue = a.status || '';
                            bValue = b.status || '';
                            break;
                          default:
                            aValue = a[sortBy] || '';
                            bValue = b[sortBy] || '';
                        }
                        
                        if (sortOrder === 'asc') {
                          return aValue > bValue ? 1 : -1;
                        } else {
                          return aValue < bValue ? 1 : -1;
                        }
                      })
                      .map((booking) => (
                        <tr 
                          key={booking.id} 
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getCustomerAvatar(booking.customer_name)}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{booking.customer_name}</div>
                                <div className="text-sm text-gray-500">{booking.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{booking.model}</div>
                                <div className="text-sm text-gray-500">{booking.make}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatBookingDateWithoutTime(booking.booking_date, booking.booking_time) || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">{booking.booking_time}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getServiceIcon(booking.service_type)}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{booking.service_type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={booking.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {booking.status === 'assigned' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleStartJob(booking.id)}
                                  className="mr-2"
                                >
                                  Start Job
                                </Button>
                              )}
                              <button
                                onClick={() => handleViewDetails(booking.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetailsModal && selectedBooking && (
        <Modal 
          isOpen={showBookingDetailsModal} 
          onClose={closeBookingDetailsModal} 
          title={`Booking #${selectedBooking.id}`}
        >
          <div className="space-y-6">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Booking Information</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="text-sm font-medium text-gray-900">#{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{selectedBooking.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booking Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatBookingDateWithoutTime(selectedBooking.booking_date) || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booking Time</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.booking_time}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer Email</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer Phone</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.customer_phone}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Vehicle Information</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Vehicle Make</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.make}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle Model</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle Year</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">VIN</p>
                  <p className="text-sm font-medium text-gray-900">{selectedBooking.vin}</p>
                </div>
              </div>
            </div>
            
            {selectedBooking.notes && (
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                <p className="mt-2 text-gray-700">{selectedBooking.notes}</p>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button 
                variant="primary" 
                onClick={closeBookingDetailsModal}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <Modal 
          isOpen={showInvoiceModal} 
          onClose={closeInvoiceModal} 
          title={`Invoice #${selectedInvoice.invoice.id}`}
        >
          <div className="space-y-6">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Invoice Details</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Invoice ID</p>
                  <p className="text-sm font-medium text-gray-900">#{selectedInvoice.invoice.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{selectedInvoice.invoice.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedInvoice.invoice.grand_total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="text-sm font-medium text-gray-900">{selectedInvoice.invoice.payment_method || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">Charges Breakdown</h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Labor Charges</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedInvoice.invoice.labor_total)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Parts Total</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedInvoice.invoice.parts_total)}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-base font-medium text-gray-900">Grand Total</span>
                  <span className="text-base font-bold text-gray-900">{formatCurrency(selectedInvoice.invoice.grand_total)}</span>
                </div>
              </div>
            </div>
            
            {selectedInvoice.parts && selectedInvoice.parts.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Parts Used</h3>
                <div className="mt-4 divide-y divide-gray-200">
                  {selectedInvoice.parts.map((part) => (
                    <div key={part.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{part.part_name}</p>
                        <p className="text-xs text-gray-500">Qty: {part.quantity} • Part #: {part.part_number || 'N/A'}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(part.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button 
                variant="primary" 
                onClick={closeInvoiceModal}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssignedBookingsPage;